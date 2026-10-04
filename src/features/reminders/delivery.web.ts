import type { Reminder } from '../../types';
import type { ReminderDelivery, ReminderListeners, ReminderMessage, ReminderPermission } from './delivery.types';
import { getReminderMessage, nextReminderDate, reminderClockParts, validateReminder } from './model';

type Browser = Window & typeof globalThis;
type PendingReminder = { timer: number; dueAt: number; reminder: Reminder; revision: number };

const DELIVERY_PREFIX = 'still-reminder-delivered-v1:';
const CLAIM_PREFIX = 'still-reminder-claim-v1:';
const PROFILE_KEY = 'still-wellness-v1';
const MAX_LATENESS_MS = 60_000;
const HEARTBEAT_MS = 60_000;
const TEST_DELAY_MS = 5_000;

function browserPermission(browser: Browser | null): ReminderPermission {
  if (!browser || browser.isSecureContext === false || typeof browser.Notification !== 'function') {
    return { status: 'unavailable', canAskAgain: false };
  }
  const permission = browser.Notification.permission;
  return {
    status: permission === 'default' ? 'undetermined' : permission,
    canAskAgain: permission === 'default',
  };
}

/** The web preview can remind only while its page is open. The OS owns native schedules. */
export function createWebReminderDelivery(
  getBrowser: () => Browser | null = () => typeof window === 'undefined' ? null : window,
  now: () => number = () => Date.now(),
): ReminderDelivery {
  let reminders: Reminder[] = [];
  let revision = 0;
  let removeWakeListeners: (() => void) | undefined;
  let testTimer: number | undefined;
  let verificationTimer: number | undefined;
  let testRevision = 0;
  let hasSavedProfile = false;
  const listeners = new Set<ReminderListeners>();
  const pending = new Map<string, PendingReminder>();
  const deliveredInMemory = new Map<string, string>();
  const claimWaits = new Map<number, () => void>();

  function activeReminders(value: unknown[]): Reminder[] {
    const byId = new Map<string, Reminder>();
    for (const candidate of value) {
      const reminder = candidate as Reminder;
      if (validateReminder(reminder) || !reminder.enabled) continue;
      byId.set(reminder.id, { ...reminder, days: [...reminder.days].sort((a, b) => a - b) });
    }
    return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
  }

  function signature(value: Reminder[]): string {
    return JSON.stringify(value.map(reminder => [reminder.id, reminder.title, reminder.time, reminder.days]));
  }

  function readSavedReminders(): Reminder[] | null {
    const browser = getBrowser();
    if (!browser) return null;
    try {
      const value = browser.localStorage.getItem(PROFILE_KEY);
      if (value === null) return hasSavedProfile ? [] : null;
      const profile = JSON.parse(value) as { state?: { reminders?: unknown; reminderSetupVersion?: unknown } };
      if (!profile?.state || !Array.isArray(profile.state.reminders)) return null;
      hasSavedProfile = true;
      // Legacy preview preferences were never consent to a real notification schedule.
      if (profile.state.reminderSetupVersion !== 1) return [];
      return activeReminders(profile.state.reminders);
    } catch {
      // The main storage layer reports unreadable profiles; never write or migrate here.
      return null;
    }
  }

  function replaceReminders(nextReminders: Reminder[]): boolean {
    if (signature(nextReminders) === signature(reminders)) return false;
    revision += 1;
    reminders = nextReminders;
    clearRecurringTimers();
    for (const reminder of reminders) schedule(reminder);
    return true;
  }

  function reconcileSavedReminders(): boolean {
    const saved = readSavedReminders();
    return saved !== null && replaceReminders(saved);
  }

  function clearRecurringTimers() {
    const browser = getBrowser();
    for (const item of pending.values()) browser?.clearTimeout(item.timer);
    pending.clear();
  }

  function announce(message: ReminderMessage, tag: string) {
    if (!listeners.size) return;
    for (const listener of listeners) listener.onReceive(message);
    const browser = getBrowser();
    if (!browser || browserPermission(browser).status !== 'granted') return;
    try {
      const notification = new browser.Notification(message.title, { body: message.body, tag });
      notification.onclick = () => {
        notification.close();
        browser.focus();
        for (const listener of listeners) listener.onOpen(message.route);
      };
    } catch {
      // Some mobile browsers expose permission APIs but require a push service to display.
      // The in-app reminder above still reaches the open page.
    }
  }

  async function claimOccurrence(id: string, dueAt: number): Promise<boolean> {
    const browser = getBrowser();
    if (!browser) return false;
    const key = `${DELIVERY_PREFIX}${encodeURIComponent(id)}`;
    const occurrence = String(dueAt);
    const claimLocally = () => {
      if (deliveredInMemory.get(key) === occurrence) return false;
      deliveredInMemory.set(key, occurrence);
      return true;
    };
    const commit = () => {
      try {
        if (browser.localStorage.getItem(key) === occurrence) return false;
        browser.localStorage.setItem(key, occurrence);
        deliveredInMemory.set(key, occurrence);
        return true;
      } catch {
        // Storage can be blocked in private browsers. Keep this tab deduplicated.
        return claimLocally();
      }
    };
    try {
      if (browser.navigator.locks?.request) {
        return await browser.navigator.locks.request(key, commit);
      }
    } catch {
      // Fall back to an expiring claim if this browser blocks Web Locks.
    }

    const claimKey = `${CLAIM_PREFIX}${encodeURIComponent(id)}`;
    const token = `${occurrence}:${now()}:${Math.random()}`;
    try {
      if (browser.localStorage.getItem(key) === occurrence) return false;
      const existing = browser.localStorage.getItem(claimKey);
      if (existing) {
        try {
          const claim = JSON.parse(existing) as { occurrence?: string; expiresAt?: number };
          if (claim.occurrence === occurrence && (claim.expiresAt ?? 0) > now()) return false;
        } catch { /* Replace malformed or expired claims. */ }
      }
      const claim = JSON.stringify({ token, occurrence, expiresAt: now() + 2_000 });
      browser.localStorage.setItem(claimKey, claim);
      // Let competing tabs settle on one claim before displaying anything.
      await new Promise<void>(resolve => {
        const timer = browser.setTimeout(() => { claimWaits.delete(timer); resolve(); }, 40);
        claimWaits.set(timer, resolve);
      });
      if (!listeners.size || browser.localStorage.getItem(claimKey) !== claim) return false;
      return commit();
    } catch {
      return claimLocally();
    }
  }

  async function deliver(item: PendingReminder) {
    // Other tabs may have changed or disabled this reminder without hydrating this tab's store.
    if (reconcileSavedReminders()) return;
    if (!listeners.size || item.revision !== revision || now() - item.dueAt > MAX_LATENESS_MS) return;
    // The saved clock time and repeat days always use Bangladesh time, wherever this tab runs.
    const due = reminderClockParts(new Date(item.dueAt));
    const [hour, minute] = item.reminder.time.split(':').map(Number);
    if (due.hour !== hour || due.minute !== minute || !item.reminder.days.includes(due.weekday)) return;
    if (await claimOccurrence(item.reminder.id, item.dueAt)) {
      // Claiming can yield to another tab. Check the persisted schedule again before display.
      if (!reconcileSavedReminders() && listeners.size && item.revision === revision) {
        announce(getReminderMessage(item.reminder), `still-reminder:${item.reminder.id}`);
      }
    }
  }

  function schedule(reminder: Reminder, referenceTime = now()) {
    const browser = getBrowser();
    if (!browser || !listeners.size) return;
    const existing = pending.get(reminder.id);
    if (existing) browser.clearTimeout(existing.timer);
    const next = nextReminderDate(reminder, new Date(referenceTime));
    if (!next) { pending.delete(reminder.id); return; }
    const item: PendingReminder = { timer: 0, dueAt: next.getTime(), reminder, revision };
    item.timer = browser.setTimeout(() => {
      if (pending.get(reminder.id) !== item || item.revision !== revision) return;
      if (reconcileSavedReminders()) return;
      pending.delete(reminder.id);
      if (now() >= item.dueAt) {
        void deliver(item);
        if (item.revision === revision) schedule(reminder, Math.max(now(), item.dueAt) + 1);
      } else {
        // Re-evaluate the clock periodically while keeping Bangladesh as the scheduling zone.
        schedule(reminder);
      }
    }, Math.max(1, Math.min(item.dueAt - now(), HEARTBEAT_MS)));
    pending.set(reminder.id, item);
  }

  function refreshAfterWake() {
    if (reconcileSavedReminders()) return;
    const currentTime = now();
    for (const item of pending.values()) {
      if (item.dueAt <= currentTime && currentTime - item.dueAt <= MAX_LATENESS_MS) void deliver(item);
    }
    clearRecurringTimers();
    for (const reminder of reminders) schedule(reminder);
  }

  return {
    kind: 'web',
    async getPermission() { return browserPermission(getBrowser()); },
    async requestPermission() {
      const browser = getBrowser();
      const permission = browserPermission(browser);
      if (!browser || permission.status !== 'undetermined') return permission;
      // Called only by a user's explicit browser-notification action.
      await browser.Notification.requestPermission();
      return browserPermission(browser);
    },
    async sync(nextReminders) {
      replaceReminders(activeReminders(nextReminders));
      const browser = getBrowser();
      if (verificationTimer !== undefined) browser?.clearTimeout(verificationTimer);
      verificationTimer = undefined;
      const saved = readSavedReminders();
      if (browser && listeners.size && saved !== null && signature(saved) !== signature(reminders)) {
        // The controller schedules first, then persists in the same turn. Recheck on the next
        // event-loop turn so an unchanged stale tab cannot resurrect another tab's old settings.
        verificationTimer = browser.setTimeout(() => {
          verificationTimer = undefined;
          reconcileSavedReminders();
        }, 0);
      }
    },
    async test() {
      const browser = getBrowser();
      if (!browser || !listeners.size) throw new Error('Open Still in your browser to try a reminder.');
      if (testTimer !== undefined) browser.clearTimeout(testTimer);
      const attempt = ++testRevision;
      const dueAt = now() + TEST_DELAY_MS;
      testTimer = browser.setTimeout(() => {
        testTimer = undefined;
        if (attempt !== testRevision || now() - dueAt > MAX_LATENESS_MS) return;
        announce({
          title: 'A little time for yourself',
          body: 'Your reminder is working. Take a slow breath and enjoy a moment of calm.',
          route: '/meditate',
        }, 'still-reminder:test');
      }, TEST_DELAY_MS);
    },
    subscribe(listener) {
      listeners.add(listener);
      const browser = getBrowser();
      if (browser && !removeWakeListeners) {
        const onVisible = () => { if (browser.document.visibilityState === 'visible') refreshAfterWake(); };
        const onStorage = (event: StorageEvent) => {
          if (event.storageArea && event.storageArea !== browser.localStorage) return;
          if (event.key !== PROFILE_KEY && event.key !== null) return;
          hasSavedProfile = true;
          reconcileSavedReminders();
        };
        browser.addEventListener('focus', refreshAfterWake);
        browser.addEventListener('pageshow', refreshAfterWake);
        browser.addEventListener('storage', onStorage);
        browser.document.addEventListener('visibilitychange', onVisible);
        removeWakeListeners = () => {
          browser.removeEventListener('focus', refreshAfterWake);
          browser.removeEventListener('pageshow', refreshAfterWake);
          browser.removeEventListener('storage', onStorage);
          browser.document.removeEventListener('visibilitychange', onVisible);
        };
        refreshAfterWake();
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size) return;
        revision += 1;
        testRevision += 1;
        clearRecurringTimers();
        if (testTimer !== undefined) browser?.clearTimeout(testTimer);
        testTimer = undefined;
        if (verificationTimer !== undefined) browser?.clearTimeout(verificationTimer);
        verificationTimer = undefined;
        for (const [timer, resolve] of claimWaits) { browser?.clearTimeout(timer); resolve(); }
        claimWaits.clear();
        removeWakeListeners?.();
        removeWakeListeners = undefined;
      };
    },
    async openSettings() {
      throw new Error('Open your browser’s site settings for Still, then allow notifications. In-app reminders work while this page stays open.');
    },
  };
}

export const reminderDelivery = createWebReminderDelivery();
