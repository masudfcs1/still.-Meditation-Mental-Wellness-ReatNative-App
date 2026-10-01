import { ActivityDay, AnalyticsRange, Category, Mood } from '../types';

export const dateKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const parseDate = (key: string) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d, 12); };
export function addDays(date: Date, amount: number): Date { const next = new Date(date); next.setDate(next.getDate() + amount); return next; }
const calendarDay = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000;
const dayCount = (start: Date, end: Date) => Math.round(calendarDay(end) - calendarDay(start)) + 1;
const rangeLengths: Record<Exclude<AnalyticsRange, 'ALL'>, number> = { '7D': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };
export const moodLabel = (mood: number) => mood > 0 ? ['Stressed', 'Low', 'Okay', 'Good', 'Wonderful'][Math.min(4, Math.max(0, Math.round(mood) - 1))] : 'Not logged';
/** Display whole seconds without rounding a partial practice up to a goal. */
export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '0m';
  const seconds = Math.floor(minutes * 60 + 1e-7);
  if (!seconds) return '<1s';
  const hours = Math.floor(seconds / 3600);
  const remainderMinutes = Math.floor((seconds % 3600) / 60);
  const remainderSeconds = seconds % 60;
  return [hours ? `${hours}h` : '', remainderMinutes ? `${remainderMinutes}m` : '', remainderSeconds ? `${remainderSeconds}s` : ''].filter(Boolean).join(' ');
}
export function formatMinutes(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '0';
  const tenths = Math.floor(minutes * 10 + 1e-9) / 10;
  return tenths ? String(tenths) : '<0.1';
}
export const formatDate = (key: string, options?: Intl.DateTimeFormatOptions) => parseDate(key).toLocaleDateString('en-US', options || { month: 'short', day: 'numeric' });
export const emptyDay = (date: string): ActivityDay => ({ date, minutes: 0, sessions: 0, breathingMinutes: 0, sleepMinutes: 0, mood: 0, category: 'Mindfulness' });
const moodScores: Record<Mood, number> = { Wonderful: 5, Good: 4, Okay: 3, Low: 2, Stressed: 1 };

export interface CompletedActivity { date: string; minutes: number; category: Category; seconds?: number; sessionCount?: number }
/** Keep category-level entries intact; the calculation layer coalesces calendar days. */
export function mergeActivity(activity: ActivityDay[], completed: CompletedActivity[], mood?: Mood | null, moodDate?: string | null, moodHistory: Record<string, Mood> = {}): ActivityDay[] {
  const records = [...activity, ...completed.map(session => {
    const minutes = session.seconds !== undefined ? session.seconds / 60 : session.minutes;
    return {
      ...emptyDay(session.date), minutes, sessions: session.sessionCount ?? 1, category: session.category,
      breathingMinutes: session.category === 'Breathwork' ? minutes : 0,
      sleepMinutes: session.category === 'Sleep' ? minutes : 0,
    };
  })];
  // The latest explicit check-in takes precedence over an older saved entry.
  const checkIns = { ...moodHistory, ...(mood && moodDate ? { [moodDate]: mood } : {}) };
  const recordedDates = new Set(records.map(day => day.date));
  // A check-in can exist even on a day without a meditation session.
  Object.keys(checkIns).forEach(date => { if (!recordedDates.has(date)) records.push(emptyDay(date)); });
  return records.map(day => checkIns[day.date] ? { ...day, mood: moodScores[checkIns[day.date]] } : day);
}

export function normalizeActivity(activity: ActivityDay[]): ActivityDay[] {
  const grouped = new Map<string, ActivityDay>();
  for (const item of activity) {
    const previous = grouped.get(item.date);
    grouped.set(item.date, previous ? {
      ...previous, minutes: previous.minutes + item.minutes, sessions: previous.sessions + item.sessions,
      breathingMinutes: previous.breathingMinutes + item.breathingMinutes, sleepMinutes: previous.sleepMinutes + item.sleepMinutes,
      mood: item.mood || previous.mood,
      category: item.minutes > previous.minutes ? item.category : previous.category,
    } : { ...item });
  }
  return [...grouped.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function fillDays(activity: ActivityDay[], start: Date, end: Date): ActivityDay[] {
  const byDate = new Map(normalizeActivity(activity).map(day => [day.date, day]));
  return Array.from({ length: Math.max(0, dayCount(start, end)) }, (_, i) => {
    const date = dateKey(addDays(start, i)); return byDate.get(date) || emptyDay(date);
  });
}

export function calculateStreaks(activity: ActivityDay[], now = new Date()) {
  const today = dateKey(now);
  const active = new Set(activity.filter(day => day.date <= today && day.minutes > 0).map(day => day.date));
  let current = 0;
  let cursor = parseDate(today);
  // A streak is still alive before the user has practiced today.
  if (!active.has(today)) cursor = addDays(cursor, -1);
  while (active.has(dateKey(cursor))) { current++; cursor = addDays(cursor, -1); }
  const ordered = [...active].sort();
  let longest = 0, run = 0, previous: string | undefined;
  for (const date of ordered) {
    run = previous && dateKey(addDays(parseDate(previous), 1)) === date ? run + 1 : 1;
    longest = Math.max(longest, run); previous = date;
  }
  return { currentStreak: current, longestStreak: longest };
}

export interface ChartPoint {
  date: string;
  endDate: string;
  label: string;
  minutes: number;
  sessions: number;
  mood: number;
  count: number;
}

function summarizeBucket(group: ActivityDay[], range: AnalyticsRange): ChartPoint {
  const moods = group.filter(day => day.mood > 0);
  const date = group[0].date;
  return {
    date, endDate: group[group.length - 1].date, minutes: group.reduce((sum, day) => sum + day.minutes, 0),
    sessions: group.reduce((sum, day) => sum + day.sessions, 0),
    mood: moods.length ? moods.reduce((sum, day) => sum + day.mood, 0) / moods.length : 0,
    count: group.length,
    label: formatDate(date, range === '1Y' || range === 'ALL' ? { month: 'short', year: 'numeric' } : { month: 'short', day: 'numeric' }),
  };
}

export function aggregateActivity(days: ActivityDay[], range: AnalyticsRange): ChartPoint[] {
  const buckets = new Map<string, ActivityDay[]>();
  days.forEach((day, index) => {
    const key = range === '7D' || range === '1M' ? day.date : range === '3M' || range === '6M' ? String(Math.floor(index / 7)) : day.date.slice(0, 7);
    buckets.set(key, [...(buckets.get(key) || []), day]);
  });
  return [...buckets.values()].map(group => summarizeBucket(group, range));
}

export interface CategorySummary { category: Category; minutes: number; percentage: number }

export function getAnalyticsByRange(range: AnalyticsRange, activity: ActivityDay[] = [], dailyGoal = 20, now = new Date()) {
  const end = parseDate(dateKey(now));
  const available = activity.filter(day => day.date <= dateKey(end));
  const ordered = normalizeActivity(available);
  const start = range === 'ALL' ? parseDate(ordered[0]?.date || dateKey(end)) : addDays(end, 1 - rangeLengths[range]);
  const days = fillDays(ordered, start, end);
  const previousEnd = addDays(start, -1);
  const previousStart = addDays(previousEnd, 1 - days.length);
  const previousDays = fillDays(ordered, previousStart, previousEnd);
  const points = aggregateActivity(days, range);
  // Compare equal day spans. Independent calendar-month buckets can differ in
  // length or number across leap years and would omit days when paired by index.
  let previousOffset = 0;
  const previousPoints = points.map(point => {
    const group = previousDays.slice(previousOffset, previousOffset + point.count);
    previousOffset += point.count;
    return summarizeBucket(group, range);
  });
  const totalMinutes = days.reduce((sum, day) => sum + day.minutes, 0);
  const totalSessions = days.reduce((sum, day) => sum + day.sessions, 0);
  const previousMinutes = previousDays.reduce((sum, day) => sum + day.minutes, 0);
  const previousSessions = previousDays.reduce((sum, day) => sum + day.sessions, 0);
  const goalDays = days.filter(day => day.minutes >= dailyGoal).length;
  const activeDays = days.filter(day => day.minutes > 0).length;
  const categoryMap = new Map<Category, number>();
  available.filter(day => day.date >= dateKey(start)).forEach(day => {
    categoryMap.set(day.category, (categoryMap.get(day.category) || 0) + day.minutes);
  });
  const categories: CategorySummary[] = [...categoryMap].filter(([, minutes]) => minutes > 0).map(([category, minutes]) => ({ category, minutes, percentage: totalMinutes ? Math.round(minutes / totalMinutes * 100) : 0 })).sort((a, b) => b.minutes - a.minutes);
  const moods = days.filter(day => day.mood > 0);
  return {
    days, previousDays, totalMinutes, totalSessions, previousMinutes, previousSessions,
    averageSession: totalSessions ? totalMinutes / totalSessions : 0,
    dailyAverage: totalMinutes / days.length, weeklyAverage: totalMinutes / days.length * 7,
    monthlyAverage: totalMinutes / days.length * 30,
    ...calculateStreaks(ordered, now),
    goalCompletion: Math.round(goalDays / days.length * 100), goalDays, activeDays,
    consistency: Math.round(activeDays / days.length * 100),
    breathingMinutes: days.reduce((sum, day) => sum + day.breathingMinutes, 0),
    sleepMinutes: days.reduce((sum, day) => sum + day.sleepMinutes, 0),
    averageMood: moods.length ? moods.reduce((sum, day) => sum + day.mood, 0) / moods.length : 0,
    categories, points, previousPoints,
    changePercent: previousMinutes ? Math.round((totalMinutes - previousMinutes) / previousMinutes * 100) : null,
    sessionChangePercent: previousSessions ? Math.round((totalSessions - previousSessions) / previousSessions * 100) : null,
    start: dateKey(start), end: dateKey(end),
  };
}

export type AnalyticsSummary = ReturnType<typeof getAnalyticsByRange>;
