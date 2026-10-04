import type { Reminder } from '../../types';
import type { ReminderMessage } from './delivery.types';
import { REMINDER_TIME_ZONE, currentTimeZone, getReminderMessage, nextReminderDate, validateReminder } from './model';

export const REMINDER_OWNER = 'still-reminders';
export const REMINDER_PREFIX = 'still.reminder.v1:';
export const TEST_IDENTIFIER = 'still.reminder.test.v1';
export const REMINDER_CHANNEL = 'still-reminders';

export type ReminderSchedule = ReminderMessage & {
  identifier: string;
  reminderId: string;
  weekday: number;
  hour: number;
  minute: number;
  timeZone: string;
  triggerKind: 'calendar' | 'weekly';
  triggerWeekday: number;
  triggerHour: number;
  triggerMinute: number;
  signature: string;
};
export type ReminderScheduleOptions = { platform?: 'ios' | 'android'; now?: Date; deviceTimeZone?: string };
export type ExistingSchedule = {
  identifier: string;
  signature?: string;
  recoverable?: ReminderSchedule;
};
export type ScheduleGateway = {
  list(): Promise<ExistingSchedule[]>;
  schedule(schedule: ReminderSchedule): Promise<void>;
  cancel(identifier: string): Promise<void>;
};

export function isReminderIdentifier(identifier: string): boolean {
  return identifier.startsWith(REMINDER_PREFIX);
}

export function createReminderPlan(reminders: Reminder[], options: ReminderScheduleOptions = {}): ReminderSchedule[] {
  const now = options.now ?? new Date();
  const android = options.platform === 'android';
  const deviceTimeZone = options.deviceTimeZone ?? currentTimeZone();
  const seen = new Set<string>();
  return reminders.flatMap(reminder => {
    if (seen.has(reminder.id)) throw new Error('Two reminders have the same ID. Reopen reminder settings and try again.');
    seen.add(reminder.id);
    if (!reminder.enabled) return [];
    const error = validateReminder(reminder);
    if (error) throw new Error(error);
    const [hour, minute] = reminder.time.split(':').map(Number);
    const message = getReminderMessage(reminder);
    return [...reminder.days].sort((a, b) => a - b).map(day => {
      const identifier = `${REMINDER_PREFIX}${encodeURIComponent(reminder.id)}:${day}`;
      const weekday = day + 1;
      const occurrence = nextReminderDate({ ...reminder, days: [day] }, now);
      if (!occurrence) throw new Error('The next reminder time could not be calculated. Check the device date and try again.');
      // Android has no timezone-aware weekly trigger. Convert this Bangladesh occurrence
      // to the device calendar; foreground reconciliation updates it after travel or DST.
      const triggerKind = android ? 'weekly' : 'calendar';
      const triggerWeekday = android ? occurrence.getDay() + 1 : weekday;
      const triggerHour = android ? occurrence.getHours() : hour;
      const triggerMinute = android ? occurrence.getMinutes() : minute;
      const deviceContext = android ? [deviceTimeZone, now.getTimezoneOffset(), occurrence.getTimezoneOffset()] : null;
      const signature = JSON.stringify([2, reminder.id, weekday, hour, minute, message.title, message.body, message.route, REMINDER_TIME_ZONE, triggerKind, triggerWeekday, triggerHour, triggerMinute, deviceContext]);
      return { ...message, identifier, reminderId: reminder.id, weekday, hour, minute, timeZone: REMINDER_TIME_ZONE, triggerKind, triggerWeekday, triggerHour, triggerMinute, signature };
    });
  });
}

/** Only changed jobs touch the OS; a failed edit restores the previous schedule. */
export async function syncReminderSchedules(reminders: Reminder[], gateway: ScheduleGateway, options: ReminderScheduleOptions = {}): Promise<void> {
  const desired = createReminderPlan(reminders, options);
  const existing = await gateway.list();
  const owned = existing.filter(item => isReminderIdentifier(item.identifier));
  // iOS allows 64 pending requests. Leave room for unrelated notifications and the test.
  if (desired.length + existing.filter(item => !isReminderIdentifier(item.identifier) && item.identifier !== TEST_IDENTIFIER).length > 63) {
    throw new Error('There are too many scheduled notifications on this device. Turn off another reminder and try again.');
  }
  const byId = new Map(owned.map(item => [item.identifier, item]));
  const newIdentifiers = desired.filter(item => !byId.has(item.identifier)).length;
  if (existing.filter(item => item.identifier !== TEST_IDENTIFIER).length + newIdentifiers > 63) {
    throw new Error('Turn off a reminder before adding more repeat days, then try again. This device is near its notification limit.');
  }
  const desiredIds = new Set(desired.map(item => item.identifier));
  const changes = desired.filter(item => byId.get(item.identifier)?.signature !== item.signature);
  const obsolete = owned.filter(item => !desiredIds.has(item.identifier));
  const attempted: ReminderSchedule[] = [];
  const removed: ExistingSchedule[] = [];
  try {
    for (const item of changes) {
      attempted.push(item);
      await gateway.schedule(item);
    }
    for (const item of obsolete) {
      removed.push(item);
      await gateway.cancel(item.identifier);
    }
  } catch (cause) {
    const rollback: Promise<void>[] = [];
    for (const item of attempted.reverse()) {
      const old = byId.get(item.identifier)?.recoverable;
      rollback.push((async () => {
        await gateway.cancel(item.identifier);
        if (old) await gateway.schedule(old);
      })());
    }
    for (const item of removed) {
      if (item.recoverable) rollback.push(gateway.schedule(item.recoverable));
    }
    const result = await Promise.allSettled(rollback);
    if (result.some(item => item.status === 'rejected')) {
      throw new Error('The device could not finish updating your reminders. Reopen the app and check your reminder settings.', { cause });
    }
    throw new Error('Your reminder could not be scheduled. The previous schedule was restored. Please try again.', { cause });
  }
}
