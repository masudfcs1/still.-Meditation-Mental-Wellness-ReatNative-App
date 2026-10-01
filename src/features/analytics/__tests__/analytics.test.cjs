const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');

// Exercise the production TypeScript calculation layer with Node's built-in runner.
// No React Native runtime, test framework, or generated files are required.
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(compiled.outputText, filename);
};

const {
  addDays, aggregateActivity, calculateStreaks, dateKey, emptyDay, fillDays,
  formatDuration, formatMinutes, getAnalyticsByRange, mergeActivity, normalizeActivity, parseDate,
} = require('../../../utils/analytics.ts');
const { createMockActivity } = require('../../../mock/activity.ts');
const record = (date, minutes = 20, extra = {}) => ({ ...emptyDay(date), minutes, sessions: minutes ? 1 : 0, ...extra });
const fixedNow = new Date(2026, 8, 30, 12);

test('a new local profile has zero activity in every range without seeded achievements or comparisons', () => {
  for (const range of ['7D', '1M', '3M', '6M', '1Y', 'ALL']) {
    const result = getAnalyticsByRange(range, undefined, 20, fixedNow);
    assert.equal(result.totalMinutes, 0);
    assert.equal(result.totalSessions, 0);
    assert.equal(result.currentStreak, 0);
    assert.equal(result.longestStreak, 0);
    assert.equal(result.goalDays, 0);
    assert.equal(result.goalCompletion, 0);
    assert.equal(result.averageMood, 0);
    assert.equal(result.changePercent, null);
    assert.equal(result.sessionChangePercent, null);
    assert.deepEqual(result.categories, []);
    assert.ok(result.days.length > 0);
    assert.ok(result.points.every(point => point.minutes === 0 && point.sessions === 0 && point.mood === 0));
    assert.ok(Object.values(result).filter(value => typeof value === 'number').every(Number.isFinite));
  }
});

test('precise partial practice uses recorded seconds and reaches a goal only at its exact duration', () => {
  const beforeGoal = mergeActivity([], [{ date: '2026-09-30', category: 'Mindfulness', minutes: 20, seconds: 1199, sessionCount: 1 }]);
  const before = getAnalyticsByRange('7D', beforeGoal, 20, fixedNow);
  assert.equal(before.totalMinutes, 1199 / 60);
  assert.equal(before.goalDays, 0);
  assert.equal(before.totalSessions, 1);
  assert.equal(formatDuration(before.totalMinutes), '19m 59s');
  const reached = getAnalyticsByRange('7D', mergeActivity([], [{ date: '2026-09-30', category: 'Mindfulness', minutes: 20, seconds: 1200, sessionCount: 1 }]), 20, fixedNow);
  assert.equal(reached.totalMinutes, 20);
  assert.equal(reached.goalDays, 1);
  assert.equal(reached.totalSessions, 1);
});

test('live ledger snapshots and midnight continuations preserve seconds without counting a session twice', () => {
  const first = { date: '2026-09-29', category: 'Sleep', minutes: 1, seconds: 45.5, sessionCount: 1 };
  const continuation = { date: '2026-09-30', category: 'Sleep', minutes: 1, seconds: 14.5, sessionCount: 0 };
  const total = getAnalyticsByRange('7D', mergeActivity([], [first, continuation]), 20, fixedNow);
  assert.equal(total.totalMinutes, 1);
  assert.equal(total.sleepMinutes, 1);
  assert.equal(total.totalSessions, 1);
  assert.equal(total.days[6].sessions, 0);
  assert.equal(total.days[6].minutes, 14.5 / 60);
  const updated = getAnalyticsByRange('7D', mergeActivity([], [first, { ...continuation, seconds: 44.5 }]), 20, fixedNow);
  assert.equal(updated.totalMinutes, 1.5);
  assert.equal(updated.totalSessions, 1);
  assert.equal(updated.categories[0].minutes, updated.totalMinutes);
});

test('duration labels show meaningful seconds and never round near-goal minutes upward', () => {
  assert.equal(formatDuration(0), '0m');
  assert.equal(formatDuration(0.5), '30s');
  assert.equal(formatDuration(12.5), '12m 30s');
  assert.equal(formatDuration(60), '1h');
  assert.equal(formatDuration(60 + 61 / 60), '1h 1m 1s');
  assert.equal(formatDuration(0.005), '<1s');
  assert.equal(formatMinutes(19.999), '19.9');
  assert.equal(formatMinutes(0.05), '<0.1');
  assert.equal(formatMinutes(0), '0');
});

test('range filtering fills missing days, includes today, and excludes future dates', () => {
  const source = [record('2026-09-23', 100), record('2026-09-24', 10), record('2026-09-30', 30), record('2026-10-01', 900)];
  const result = getAnalyticsByRange('7D', source, 20, fixedNow);
  assert.equal(result.start, '2026-09-24');
  assert.equal(result.end, '2026-09-30');
  assert.equal(result.days.length, 7);
  assert.equal(result.totalMinutes, 40);
  assert.equal(result.totalSessions, 2);
  assert.equal(result.activeDays, 2);
  assert.equal(result.goalDays, 1);
  assert.equal(result.goalCompletion, 14);
  assert.equal(result.dailyAverage, 40 / 7);
  assert.equal(result.days[1].minutes, 0);
  assert.equal(result.previousDays.length, 7);
  assert.equal(result.previousMinutes, 100);
  assert.equal(result.changePercent, -60);
});

test('every rolling range has explicit day boundaries, including a leap year', () => {
  const now = new Date(2024, 2, 1, 12);
  const counts = { '7D': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };
  Object.entries(counts).forEach(([range, count]) => {
    const result = getAnalyticsByRange(range, [], 20, now);
    assert.equal(result.days.length, count);
    assert.equal(result.previousDays.length, count);
    assert.equal(result.end, '2024-03-01');
    assert.ok(result.days.some(day => day.date === '2024-02-29'));
  });
  assert.equal(dateKey(addDays(parseDate('2024-02-28'), 1)), '2024-02-29');
  assert.equal(dateKey(addDays(parseDate('2025-12-31'), 1)), '2026-01-01');
});

test('calendar day counts do not depend on DST or UTC conversion', () => {
  const days = fillDays([], parseDate('2026-03-06'), parseDate('2026-03-11'));
  assert.deepEqual(days.map(day => day.date), ['2026-03-06', '2026-03-07', '2026-03-08', '2026-03-09', '2026-03-10', '2026-03-11']);
  assert.equal(dateKey(new Date(2026, 8, 30, 0, 1)), '2026-09-30');
  assert.equal(dateKey(new Date(2026, 8, 30, 23, 59)), '2026-09-30');
});

test('streaks tolerate an unfinished today but never bridge a missing date', () => {
  const history = ['2026-09-25', '2026-09-26', '2026-09-28', '2026-09-29'].map(day => record(day));
  assert.deepEqual(calculateStreaks(history, fixedNow), { currentStreak: 2, longestStreak: 2 });
  assert.deepEqual(calculateStreaks([...history, record('2026-09-30'), record('2026-10-01')], fixedNow), { currentStreak: 3, longestStreak: 3 });
  assert.deepEqual(calculateStreaks(history, new Date(2026, 9, 1, 12)), { currentStreak: 0, longestStreak: 2 });
  assert.deepEqual(calculateStreaks([record('2026-09-30', 0)], fixedNow), { currentStreak: 0, longestStreak: 0 });
});

test('local sessions merge without mutating history or losing category totals', () => {
  const history = [record('2026-09-30', 12, { category: 'Mindfulness', mood: 3 })];
  const local = [{ date: '2026-09-30', minutes: 8, category: 'Breathwork' }, { date: '2026-09-30', minutes: 10, category: 'Sleep' }];
  const merged = mergeActivity(history, local, 'Wonderful', '2026-09-30');
  const result = getAnalyticsByRange('7D', merged, 20, fixedNow);
  assert.equal(history[0].minutes, 12);
  assert.equal(history[0].mood, 3);
  assert.equal(result.totalMinutes, 30);
  assert.equal(result.totalSessions, 3);
  assert.equal(result.breathingMinutes, 8);
  assert.equal(result.sleepMinutes, 10);
  assert.equal(result.days[6].mood, 5);
  assert.equal(result.categories.find(item => item.category === 'Breathwork').minutes, 8);
  assert.equal(result.categories.reduce((sum, item) => sum + item.minutes, 0), result.totalMinutes);
  assert.equal(normalizeActivity(merged).length, 1);
});

test('mood-only check-ins create a day and missing mood is not treated as a low score', () => {
  const merged = mergeActivity([], [], 'Good', '2026-09-30');
  const result = getAnalyticsByRange('7D', merged, 20, fixedNow);
  assert.equal(result.totalMinutes, 0);
  assert.equal(result.averageMood, 4);
  assert.equal(result.points[6].mood, 4);
  assert.equal(result.changePercent, null);
});

test('historical check-ins survive later moods and override seeded moods without duplicating activity', () => {
  const history = [record('2026-09-28', 20, { mood: 5 }), record('2026-09-30', 12, { mood: 2 })];
  const checkIns = { '2026-09-28': 'Low', '2026-09-29': 'Good', '2026-09-30': 'Okay' };
  const merged = mergeActivity(history, [], 'Wonderful', '2026-09-30', checkIns);
  const result = getAnalyticsByRange('7D', merged, 20, fixedNow);
  assert.equal(result.days.find(day => day.date === '2026-09-28').mood, 2);
  assert.equal(result.days.find(day => day.date === '2026-09-29').mood, 4);
  assert.equal(result.days.find(day => day.date === '2026-09-29').minutes, 0);
  assert.equal(result.days.find(day => day.date === '2026-09-30').mood, 5);
  assert.equal(result.totalMinutes, 32);
  assert.equal(result.totalSessions, 2);
  assert.equal(result.averageMood, 11 / 3);
  assert.equal(checkIns['2026-09-30'], 'Okay');
  assert.equal(history[0].mood, 5);
  const withoutLatestSnapshot = getAnalyticsByRange('7D', mergeActivity(history, [], null, null, checkIns), 20, fixedNow);
  assert.equal(withoutLatestSnapshot.days[6].mood, 3);
});

test('weekly and monthly aggregation conserve totals and retain drill-down bounds', () => {
  const history = fillDays([], parseDate('2026-08-29'), parseDate('2026-09-10')).map(day => record(day.date, 10, { mood: 4 }));
  const weekly = aggregateActivity(history, '3M');
  assert.equal(weekly.length, 2);
  assert.equal(weekly[0].minutes, 70);
  assert.equal(weekly[0].date, '2026-08-29');
  assert.equal(weekly[0].endDate, '2026-09-04');
  assert.equal(weekly[1].minutes, 60);
  const monthly = aggregateActivity(history, '1Y');
  assert.equal(monthly.length, 2);
  assert.equal(monthly[0].minutes, 30);
  assert.equal(monthly[1].minutes, 100);
  assert.equal(monthly[1].sessions, 10);
  assert.equal(monthly[1].mood, 4);
});

test('leap-year comparisons preserve every prior day and compare equal-sized date spans', () => {
  const history = fillDays([], parseDate('2022-03-02'), parseDate('2024-02-29'))
    .map(day => record(day.date, day.date === '2023-03-01' ? 99 : 1));
  const result = getAnalyticsByRange('1Y', history, 20, parseDate('2024-02-29'));
  assert.equal(result.start, '2023-03-02');
  assert.equal(result.points.length, 12);
  // The previous 365 days touch 13 calendar months. Its final March 1 entry
  // must stay in the last comparison bucket instead of being truncated.
  assert.equal(result.previousDays[0].date, '2022-03-02');
  assert.equal(result.previousDays.at(-1).date, '2023-03-01');
  assert.equal(result.previousPoints.length, result.points.length);
  assert.deepEqual(result.previousPoints.map(point => point.count), result.points.map(point => point.count));
  assert.equal(result.previousPoints.at(-1).date, '2023-02-01');
  assert.equal(result.previousPoints.at(-1).endDate, '2023-03-01');
  assert.equal(result.previousPoints.at(-1).minutes, 127);
  assert.equal(result.previousPoints.reduce((sum, point) => sum + point.minutes, 0), result.previousMinutes);
  assert.equal(result.previousPoints.reduce((sum, point) => sum + point.sessions, 0), result.previousSessions);
  assert.equal(result.previousMinutes, 463);
  assert.equal(result.totalMinutes, 365);
});

test('chart labels identify individual dates and distinguish the same month across years', () => {
  const week = getAnalyticsByRange('7D', [], 20, fixedNow);
  assert.deepEqual(week.points.map(point => point.label), ['Sep 24', 'Sep 25', 'Sep 26', 'Sep 27', 'Sep 28', 'Sep 29', 'Sep 30']);
  const history = [record('2025-01-01'), record('2026-01-01')];
  const all = getAnalyticsByRange('ALL', history, 20, parseDate('2026-01-01'));
  assert.equal(all.points[0].label, 'Jan 2025');
  assert.equal(all.points.at(-1).label, 'Jan 2026');
  assert.equal(new Set(all.points.map(point => point.label)).size, all.points.length);
});

test('demo history is deterministic, complete, and spans at least eighteen months', () => {
  const first = createMockActivity(fixedNow);
  assert.deepEqual(first, createMockActivity(fixedNow));
  assert.ok(first.length >= 540);
  assert.equal(first[first.length - 1].date, '2026-09-30');
  assert.equal(first[first.length - 1].minutes, 12);
  const all = getAnalyticsByRange('ALL', first, 20, fixedNow);
  assert.equal(all.days.length, first.length);
  assert.equal(all.currentStreak, 7);
  assert.equal(all.points.reduce((sum, point) => sum + point.minutes, 0), all.totalMinutes);
  assert.equal(new Set(first.map(day => day.date)).size, first.length);
});

test('demo activity varies day to day without periodic duration ramps or attendance blocks', () => {
  const history = createMockActivity(fixedNow);
  const earlier = history.slice(0, -8);
  const changes = earlier.slice(1).map((day, index) => day.minutes - earlier[index].minutes);
  assert.ok(changes.filter(value => value > 0).length > 150);
  assert.ok(changes.filter(value => value < 0).length > 150);
  const isolatedRestDays = earlier.filter((day, index) => index > 0 && index < earlier.length - 1 && day.minutes === 0 && earlier[index - 1].minutes > 0 && earlier[index + 1].minutes > 0);
  assert.ok(isolatedRestDays.length > 30);
  assert.deepEqual(history.slice(-7).map(day => day.minutes), [22, 18, 25, 30, 15, 35, 12]);
  assert.equal(history[history.length - 8].minutes, 0);
});
