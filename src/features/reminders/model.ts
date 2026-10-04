import type { Reminder } from '../../types';
import type { ReminderMessage } from './delivery.types';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
export const REMINDER_TIME_ZONE = 'Asia/Dhaka';
export const REMINDER_TIME_ZONE_LABEL = 'Bangladesh time (UTC+6)';
const bangladeshOffsetMs = 6 * 60 * 60 * 1000;

/** Bangladesh uses UTC+6 year-round. These helpers never use the device's calendar. */
export function reminderClockParts(date: Date) {
  const shifted = new Date(date.getTime() + bangladeshOffsetMs);
  return {
    year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(), hour: shifted.getUTCHours(), minute: shifted.getUTCMinutes(),
  };
}

export function reminderDateKey(date: Date): string {
  const { year, month, day } = reminderClockParts(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function validateReminder(reminder: Reminder): string | null {
  if (!reminder || typeof reminder.id !== 'string' || !reminder.id.trim()) return 'This reminder could not be found. Please reopen its settings.';
  if (typeof reminder.title !== 'string' || !reminder.title.trim() || reminder.title.trim().length > 80) return 'Give your reminder a name of 1–80 characters.';
  if (typeof reminder.time !== 'string' || !timePattern.test(reminder.time)) return 'Enter a valid time, such as 07:30 or 21:00.';
  if (!Array.isArray(reminder.days) || reminder.days.length === 0) return 'Choose at least one day for your reminder.';
  if (reminder.days.some(day => !Number.isInteger(day) || day < 0 || day > 6) || new Set(reminder.days).size !== reminder.days.length) return 'Choose each repeat day only once.';
  if (typeof reminder.enabled !== 'boolean') return 'Choose whether this reminder is on or off.';
  return null;
}

export function formatTime(time: string): string {
  if (!timePattern.test(time)) return 'Choose a time';
  const [hour, minute] = time.split(':').map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
}

export function repeatLabel(reminder: Reminder): string {
  const days = [...new Set(reminder.days)].filter(day => Number.isInteger(day) && day >= 0 && day <= 6).sort((a, b) => a - b);
  if (days.length === 7) return 'Every day';
  if (days.join(',') === '1,2,3,4,5') return 'Weekdays';
  if (days.join(',') === '0,6') return 'Weekends';
  return days.length ? days.map(day => dayNames[day]).join(', ') : 'No days selected';
}

/** Stored hours and weekdays always describe Bangladesh time, regardless of travel. */
export function nextReminderDate(reminder: Reminder, now = new Date()): Date | null {
  if (!reminder.enabled || validateReminder(reminder) || !Number.isFinite(now.getTime())) return null;
  const [hour, minute] = reminder.time.split(':').map(Number);
  const today = reminderClockParts(now);
  for (let offset = 0; offset <= 7; offset += 1) {
    const candidate = new Date(Date.UTC(today.year, today.month - 1, today.day + offset, hour, minute) - bangladeshOffsetMs);
    if (reminder.days.includes(reminderClockParts(candidate).weekday) && candidate.getTime() > now.getTime()) return candidate;
  }
  return null;
}

export function getReminderMessage(reminder: Reminder): ReminderMessage {
  const title = reminder.title.trim();
  if (/pause|breath/i.test(title)) return { title, body: 'Pause, soften your shoulders, and take a slow breath. A little calm is waiting.', route: '/breathing' };
  if (/evening|sleep|wind.?down/i.test(title)) return { title, body: 'Let the day settle. Ease into a little rest and a calmer evening.', route: '/sleep' };
  return { title, body: 'Make a little time for yourself. Your next mindful moment is waiting.', route: '/meditate' };
}

export function currentTimeZone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'local'; } catch { return 'local'; }
}
