import { ActivityDay, Category } from '../types';

const categories: Category[] = ['Mindfulness', 'Mindfulness', 'Focus', 'Sleep', 'Stress relief', 'Mindfulness', 'Breathwork', 'Self love'];
const key = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
// Independently mix date and channel so attendance, duration, and mood do not
// rise together or repeat in a visible monthly cycle.
const sample = (day: number, channel: number) => {
  let value = day ^ Math.imul(channel, 0x9e3779b1);
  value = Math.imul(value ^ (value >>> 16), 0x85ebca6b);
  value = Math.imul(value ^ (value >>> 13), 0xc2b2ae35);
  return ((value ^ (value >>> 16)) >>> 0) / 0x100000000;
};

/** Deterministic demo history. Local noon avoids DST and UTC date boundaries. */
export function createMockActivity(now = new Date()): ActivityDay[] {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  const start = new Date(end.getFullYear(), end.getMonth() - 18, 1, 12);
  const lastDayInStartMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  start.setDate(Math.min(end.getDate(), lastDayInStartMonth) + 1);
  const records: ActivityDay[] = [];
  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const serial = Math.floor(Date.UTC(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()) / 86_400_000);
    const age = Math.round((Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) - Date.UTC(cursor.getFullYear(), cursor.getMonth(), cursor.getDate())) / 86_400_000);
    const growth = Math.max(0, 1 - age / 600);
    const weekday = cursor.getDay();
    const attendance = 0.64 + growth * 0.18 + (weekday === 0 ? 0.06 : weekday === 5 ? -0.06 : 0);
    const active = age < 7 || (age !== 7 && sample(serial, 1) < attendance);
    const baseMinutes = [5, 8, 10, 12, 15, 18, 20, 25][Math.floor(sample(serial, 2) * 8)];
    const minutes = age < 7 ? [12, 35, 15, 30, 25, 18, 22][age] : active ? Math.max(5, Math.round(baseMinutes + growth * 5 + (weekday === 0 ? 3 : weekday === 5 ? -2 : 0))) : 0;
    const category = categories[Math.floor(sample(serial, 3) * categories.length)];
    records.push({
      date: key(cursor), minutes, sessions: minutes ? (minutes > 24 ? 2 : 1) : 0,
      breathingMinutes: active && sample(serial, 4) > 0.65 ? [3, 5, 8][Math.floor(sample(serial, 5) * 3)] : 0,
      sleepMinutes: active && sample(serial, 6) > 0.6 ? [10, 15, 20, 30][Math.floor(sample(serial, 7) * 4)] : 0,
      mood: active ? Math.min(5, Math.max(2, Math.round(3.2 + growth * 0.65 + (sample(serial, 8) - 0.5) * 1.7))) : 0,
      category,
    });
  }
  return records;
}

export const mockActivity = createMockActivity();
