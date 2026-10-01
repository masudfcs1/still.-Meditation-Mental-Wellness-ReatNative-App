import { Category } from '../types';

export type PracticeSource = 'timer' | 'breathing' | 'manual';
export interface PracticeInterval { startTime: number; seconds: number }
export interface PracticeRecord {
  id: string; date: string; minutes: number; category: Category; hour?: number;
  recordId?: string; title?: string; seconds?: number; source?: PracticeSource; recordedAt?: string;
  /** A practice spanning midnight counts once, on its starting day. */
  sessionCount?: number;
  /** Explicit proof that the complete program lesson duration was practiced. */
  lessonCompleted?: boolean;
}
export interface LogPracticeInput { minutes: number; date: string; category: Category; title?: string }
export const allowedGoals = [5, 10, 15, 20, 30, 45, 60] as const;
export const categories: readonly Category[] = ['Mindfulness', 'Sleep', 'Focus', 'Stress relief', 'Breathwork', 'Self love'];
export const localDateKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const isCategory = (value: unknown): value is Category => typeof value === 'string' && categories.includes(value as Category);
export const isValidLocalDate = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const parsed = new Date(0);
  parsed.setFullYear(year, month - 1, day);
  parsed.setHours(12, 0, 0, 0);
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day;
};
export function validManualPractice(input: LogPracticeInput, now = new Date()): boolean {
  return !!input && Number.isFinite(input.minutes) && input.minutes >= 1 && input.minutes <= 180
    && isValidLocalDate(input.date) && input.date <= localDateKey(now) && isCategory(input.category)
    && (input.title === undefined || typeof input.title === 'string');
}
let sequence = 0;
const processNonce = Math.random().toString(36).slice(2, 10);
export const createPracticeId = (source: PracticeSource) => `${source}-${Date.now().toString(36)}-${processNonce}-${(++sequence).toString(36)}`;
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' ? value as Record<string, unknown> : {};

export function normalizePracticeRecords(value: unknown): PracticeRecord[] {
  if (!Array.isArray(value)) return [];
  const usedIds = new Set<string>();
  return value.flatMap((entry, index): PracticeRecord[] => {
    const item = object(entry);
    const seconds = typeof item.seconds === 'number' && Number.isFinite(item.seconds) && item.seconds > 0
      ? item.seconds : typeof item.minutes === 'number' && Number.isFinite(item.minutes) && item.minutes > 0 ? item.minutes * 60 : 0;
    if (!Number.isFinite(seconds) || seconds <= 0 || !isValidLocalDate(item.date)) return [];
    const id = typeof item.id === 'string' ? item.id : 'practice';
    let recordId = typeof item.recordId === 'string' && item.recordId ? item.recordId : `legacy:${item.date}:${index}:${id}`;
    while (usedIds.has(recordId)) recordId = `${recordId}:${index}`;
    usedIds.add(recordId);
    const source: PracticeSource = item.source === 'manual' || item.source === 'breathing' || item.source === 'timer'
      ? item.source : id.startsWith('breathing') ? 'breathing' : 'timer';
    return [{ id, date: item.date, minutes: seconds / 60, seconds, recordId, source,
      category: isCategory(item.category) ? item.category : 'Mindfulness',
      hour: typeof item.hour === 'number' && Number.isInteger(item.hour) && item.hour >= 0 && item.hour <= 23 ? item.hour : undefined,
      title: typeof item.title === 'string' ? item.title : undefined,
      recordedAt: typeof item.recordedAt === 'string' ? item.recordedAt : undefined,
      sessionCount: item.sessionCount === 0 ? 0 : 1, lessonCompleted: item.lessonCompleted === true,
    }];
  });
}
interface CreditInput { runId: string; id: string; title: string; category: Category; source: PracticeSource; startTime: number; seconds: number; alreadyCounted: boolean }
/** Split a credited interval at local midnight, including daylight-saving boundaries. */
export function creditPractice(records: PracticeRecord[], input: CreditInput): PracticeRecord[] {
  if (!Number.isFinite(input.seconds) || input.seconds <= 0 || !Number.isFinite(input.startTime)) return records;
  const next = [...records];
  let remaining = input.seconds, cursor = input.startTime, counted = input.alreadyCounted;
  while (remaining > 0) {
    const start = new Date(cursor), midnight = new Date(cursor);
    if (!Number.isFinite(start.getTime())) break;
    midnight.setHours(24, 0, 0, 0);
    const part = Math.min(remaining, (midnight.getTime() - cursor) / 1000);
    if (part <= 0) break;
    const date = localDateKey(start), recordId = `${input.runId}:${date}`;
    const index = next.findIndex(record => record.recordId === recordId);
    if (index >= 0) {
      const previous = next[index], seconds = (previous.seconds ?? previous.minutes * 60) + part;
      next[index] = { ...previous, seconds, minutes: seconds / 60 };
    } else {
      next.push({ recordId, id: input.id, title: input.title, category: input.category, source: input.source,
        date, hour: start.getHours(), recordedAt: start.toISOString(), seconds: part, minutes: part / 60, sessionCount: counted ? 0 : 1 });
    }
    counted = true; remaining -= part; cursor += part * 1000;
  }
  return next;
}
export function backedLessons(value: unknown, records: PracticeRecord[], legacy: boolean): Record<string, number[]> {
  const completed: Record<string, number[]> = {};
  for (const [id, valueDays] of Object.entries(object(value))) {
    if (!Array.isArray(valueDays)) continue;
    const days = valueDays.filter((day): day is number => typeof day === 'number' && Number.isInteger(day) && day >= 0
      && (!legacy || records.some(record => record.id === `program:${id}:${day}` && record.source === 'timer')));
    if (days.length) completed[id] = [...new Set(days)];
  }
  records.forEach(record => {
    const match = record.lessonCompleted && record.id.match(/^program:([^:]+):(\d+)$/);
    if (match) completed[match[1]] = [...new Set([...(completed[match[1]] || []), Number(match[2])])];
  });
  return completed;
}
