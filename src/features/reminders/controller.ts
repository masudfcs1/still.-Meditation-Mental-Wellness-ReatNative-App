import { create } from 'zustand';
import { flushAppStorage, isAppStorageReady, useAppStore } from '../../store/useAppStore';
import type { Reminder } from '../../types';
import { reminderDelivery } from './delivery';
import type { ReminderPermission } from './delivery.types';
import { formatTime, validateReminder } from './model';

interface ReminderState {
  permission: ReminderPermission | null;
  busy: boolean;
  ready: boolean;
  error: string | null;
  lastTestAt: number | null;
}
export const useReminderState = create<ReminderState>(() => ({
  permission: null, busy: false, ready: false, error: null, lastTestAt: null,
}));

let work: Promise<unknown> = Promise.resolve();
let pending = 0;
let refresh: Promise<void> | null = null;

// Permission prompts, OS scheduling and storage writes must finish in the same order as user actions.
function serial<T>(action: () => Promise<T>): Promise<T> {
  pending += 1;
  useReminderState.setState({ busy: true });
  const result = work.then(action, action);
  work = result.catch(() => {});
  return result.finally(() => {
    pending -= 1;
    useReminderState.setState({ busy: pending > 0 });
  });
}

function explain(error: unknown): string {
  return error instanceof Error ? error.message : 'Your reminders could not be updated. Please try again.';
}

function requireSavedProfile() {
  if (!useAppStore.getState().hasHydrated || !isAppStorageReady()) {
    throw new Error('Your saved settings are not available yet. Reload Still before setting a reminder.');
  }
}

async function readPermission() {
  const permission = await reminderDelivery.getPermission();
  useReminderState.setState({ permission });
  return permission;
}

async function allowNativeDelivery() {
  let permission = await readPermission();
  if (reminderDelivery.kind === 'web') return;
  if (permission.status !== 'granted' && permission.canAskAgain) {
    permission = await reminderDelivery.requestPermission();
    useReminderState.setState({ permission });
  }
  if (permission.status !== 'granted') {
    throw new Error(permission.status === 'unavailable'
      ? 'Notifications are unavailable in this build. Install a development build of Still to set device reminders.'
      : 'Allow notifications for Still in your device settings, then turn this reminder on.');
  }
}

async function reconcile() {
  requireSavedProfile();
  await readPermission();
  await reminderDelivery.sync(useAppStore.getState().reminders);
  useReminderState.setState({ ready: true, error: null });
}

export function refreshReminders(): Promise<void> {
  if (refresh) return refresh;
  refresh = serial(async () => {
    try { await reconcile(); }
    catch (error) { useReminderState.setState({ ready: false, error: explain(error) }); }
  }).finally(() => { refresh = null; });
  return refresh;
}

export function saveReminder(reminder: Reminder): Promise<boolean> {
  // Copy the edit before queuing; subsequent form changes cannot mutate a pending operation.
  const candidate = { ...reminder, title: reminder.title.trim(), days: [...reminder.days].sort() };
  return serial(async () => {
    useReminderState.setState({ error: null });
    const previous = useAppStore.getState().reminders;
    const original = previous.find(item => item.id === candidate.id);
    let touchedSchedule = false;
    let touchedPreferences = false;
    try {
      requireSavedProfile();
      const validation = validateReminder(candidate);
      if (validation) throw new Error(validation);
      if (!original) throw new Error('This reminder no longer exists. Reopen settings and try again.');
      if (candidate.enabled) await allowNativeDelivery();
      else await readPermission();

      const next = previous.map(item => item.id === candidate.id ? candidate : item);
      touchedSchedule = true;
      await reminderDelivery.sync(next);
      touchedPreferences = true;
      useAppStore.getState().updateReminder(candidate.id, candidate);
      if (!await flushAppStorage()) {
        throw new Error('This reminder could not be saved on your device. Free some storage and try again.');
      }
      useReminderState.setState({ ready: true, error: null });
      useAppStore.getState().notify(candidate.enabled
        ? reminderDelivery.kind === 'web' ? 'Reminder saved. Keep Still open for your gentle nudge.' : `Reminder set for ${formatTime(candidate.time)}.`
        : 'Reminder turned off. Your time and repeat days are saved.');
      return true;
    } catch (error) {
      let message = explain(error);
      let restored = !touchedSchedule;
      if (touchedPreferences && original) {
        useAppStore.getState().updateReminder(original.id, original);
        await flushAppStorage();
      }
      if (touchedSchedule) {
        try { await reminderDelivery.sync(previous); restored = true; }
        catch { message += ' The previous schedule could not be restored. Try again before relying on this reminder.'; }
      }
      useReminderState.setState({ ready: restored && useReminderState.getState().ready, error: message });
      return false;
    }
  });
}

export function requestReminderPermission(): Promise<void> {
  return serial(async () => {
    try {
      requireSavedProfile();
      const permission = await reminderDelivery.requestPermission();
      useReminderState.setState({ permission });
      await reminderDelivery.sync(useAppStore.getState().reminders);
      useReminderState.setState({ ready: true, error: permission.status === 'granted' ? null
        : reminderDelivery.kind === 'web'
          ? 'Browser notifications are not allowed. Your reminders can still appear inside Still while it is open.'
          : 'Notifications are not allowed yet. You can enable them for Still in your device settings.' });
    } catch (error) { useReminderState.setState({ ready: false, error: explain(error) }); }
  });
}

export function sendTestReminder(): Promise<boolean> {
  return serial(async () => {
    try {
      requireSavedProfile();
      await allowNativeDelivery();
      await reminderDelivery.test();
      useReminderState.setState({ error: null, lastTestAt: Date.now() });
      useAppStore.getState().notify('Your test reminder will arrive in about 5 seconds.');
      return true;
    } catch (error) {
      useReminderState.setState({ error: explain(error) });
      return false;
    }
  });
}

export async function openReminderSettings(): Promise<void> {
  try { await reminderDelivery.openSettings(); }
  catch (error) { useReminderState.setState({ error: explain(error) }); }
}
