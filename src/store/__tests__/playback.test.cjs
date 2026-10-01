const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const { test, beforeEach } = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  });
  module._compile(compiled.outputText, filename);
};
const load = Module._load;
const savedStorage = new Map();
let failReads = false, failWrites = false;
Module._load = function (id, ...rest) {
  if (id === '@react-native-async-storage/async-storage') return {
    getItem: async key => { if (failReads) throw Error('Read unavailable'); return savedStorage.get(key) ?? null; },
    setItem: async (key, value) => { if (failWrites) throw Error('Storage full'); savedStorage.set(key, value); },
    removeItem: async key => { savedStorage.delete(key); },
  };
  return load.call(this, id, ...rest);
};
const { useAppStore, localDateKey } = require('../useAppStore.ts');
Module._load = load;
const session = { id: 'practice', title: 'Quiet practice', subtitle: '', duration: 10, instructor: 'Guide', category: 'Mindfulness', image: 1, color: '#fff', difficulty: 'Beginner' };
const state = () => useAppStore.getState();
const totalSeconds = () => state().completedSessions.reduce((sum, record) => sum + record.seconds, 0);
const flush = () => useAppStore.setState({});
const persisted = () => JSON.parse(savedStorage.get('still-wellness-v1'));
beforeEach(async () => {
  failReads = false; failWrites = false;
  await useAppStore.persist.rehydrate();
  await useAppStore.setState({ ...useAppStore.getInitialState(), hasHydrated: true, storageError: null }, true);
});

async function withClock(instant, callback) {
  const RealDate = Date;
  let current = instant;
  global.Date = class extends RealDate {
    constructor(...args) { super(...(args.length ? args : [current])); }
    static now() { return current; }
  };
  try { await callback(value => { current = value; }); } finally { global.Date = RealDate; }
}

test('fresh profiles contain no earned activity, seeded lessons, or false session credit', () => {
  assert.deepEqual(state().completedSessions, []);
  assert.deepEqual(state().completedLessons, {});
  assert.equal(state().hasHydrated, true);
  state().startSession(session);
  state().finishSession();
  assert.deepEqual(state().completedSessions, []);
});

test('live practice is credited precisely and persisted before finishing', async () => {
  state().startSession(session);
  state().advance(0.25);
  const id = state().completedSessions[0].recordId;
  assert.equal(state().completedSessions[0].seconds, 0.25);
  assert.equal(state().completedSessions[0].minutes, 0.25 / 60);
  assert.equal(state().completedSessions[0].title, session.title);
  state().advance(10.125);
  await flush();
  assert.equal(state().completedSessions.length, 1);
  assert.equal(state().completedSessions[0].recordId, id);
  assert.equal(state().completedSessions[0].seconds, 10.375);
  assert.equal(persisted().state.completedSessions[0].seconds, 10.375);
  assert.equal(persisted().state.activeSession, undefined);
  assert.equal(persisted().version, 2);
});

test('pause, resume, and seeking credit only active time without rounding', () => {
  state().startSession(session);
  state().advance(29.25);
  state().togglePlaying();
  state().advance(120);
  assert.equal(state().elapsed, 29.25);
  assert.equal(totalSeconds(), 29.25);
  state().setElapsed(595);
  state().togglePlaying();
  state().advance(30);
  assert.equal(totalSeconds(), 34.25);
  assert.equal(state().completedSessions[0].minutes, 34.25 / 60);
  assert.equal(state().activeSession, null);
  state().finishSession();
  assert.equal(state().completedSessions.length, 1);
});

test('closing, replacing a session, and reloading retain already earned time', async () => {
  state().startSession(session);
  state().advance(12);
  state().closePlayer();
  assert.equal(totalSeconds(), 12);
  state().startSession(session);
  state().advance(18);
  state().startSession({ ...session, id: 'next-practice' });
  state().advance(7.5);
  await flush();
  const saved = savedStorage.get('still-wellness-v1');
  const ids = state().completedSessions.map(record => record.recordId);
  await useAppStore.setState({ completedSessions: [] });
  savedStorage.set('still-wellness-v1', saved);
  await useAppStore.persist.rehydrate();
  assert.equal(totalSeconds(), 37.5);
  assert.deepEqual(state().completedSessions.map(record => record.recordId), ids);
  assert.equal(state().activeSession, null);
  assert.equal(state().isPlaying, false);
  assert.equal(state().hasHydrated, true);
});

test('completion clamps delayed updates and never adds duplicate ledger entries', () => {
  state().startSession({ ...session, duration: 1 });
  state().advance(59.5);
  state().advance(20);
  assert.equal(totalSeconds(), 60);
  assert.equal(state().completedSessions[0].minutes, 1);
  assert.equal(state().activeSession, null);
  state().advance(100);
  state().finishSession();
  state().closePlayer();
  assert.equal(state().completedSessions.length, 1);
});

test('sleep timer tracks active time, ignores seeking, and resets when changed', () => {
  state().startSession(session);
  state().advance(90);
  state().setSleepTimer(1);
  state().setElapsed(400);
  state().advance(30);
  assert.equal(state().sleepTimerElapsed, 30);
  state().togglePlaying();
  state().advance(500);
  assert.equal(state().sleepTimerElapsed, 30);
  state().togglePlaying();
  state().setSleepTimer(2);
  assert.equal(state().sleepTimerElapsed, 0);
  state().advance(120);
  assert.equal(state().activeSession, null);
  assert.equal(totalSeconds(), 240);
  assert.equal(state().sleepTimer, 2);
});

test('program completion requires full actual practice and survives hydration', async () => {
  const lesson = { ...session, id: 'program:mindfulness:0', duration: 1 };
  state().completeLesson('mindfulness', 0);
  assert.deepEqual(state().completedLessons, {});
  state().startSession(lesson);
  state().setElapsed(59);
  state().advance(1);
  assert.deepEqual(state().completedLessons, {});
  state().startSession(lesson);
  state().advance(60);
  assert.deepEqual(state().completedLessons, { mindfulness: [0] });
  assert.equal(state().completedSessions[1].lessonCompleted, true);
  await useAppStore.persist.rehydrate();
  assert.deepEqual(state().completedLessons, { mindfulness: [0] });
  assert.equal(totalSeconds(), 61);
});

test('rewinding increases actual practiced time while preserving one session per run', () => {
  state().startSession(session);
  state().advance(45);
  state().setElapsed(15);
  state().advance(15);
  assert.equal(state().elapsed, 30);
  assert.equal(totalSeconds(), 60);
  assert.equal(state().completedSessions.length, 1);
  assert.equal(state().completedSessions[0].sessionCount, 1);
  state().closePlayer();
  assert.equal(state().elapsed, 0);
  assert.equal(state().listenedSeconds, 0);
  assert.equal(totalSeconds(), 60);
});

test('midnight practice splits local dates while counting the session only once', async () => {
  const beforeMidnight = new Date(2026, 8, 29, 23, 59, 50).getTime();
  await withClock(beforeMidnight, async setClock => {
    state().startSession(session);
    setClock(beforeMidnight + 20000);
    state().advance(20);
    assert.deepEqual(state().completedSessions.map(({ date, seconds, sessionCount }) => ({ date, seconds, sessionCount })), [
      { date: '2026-09-29', seconds: 10, sessionCount: 1 }, { date: '2026-09-30', seconds: 10, sessionCount: 0 },
    ]);
    setClock(beforeMidnight + 30000);
    state().advance(10);
    assert.equal(state().completedSessions.length, 2);
    assert.equal(state().completedSessions[1].seconds, 20);
    assert.equal(totalSeconds(), 30);
  });
});

test('manual practice validates actual local dates, duration, and category', async () => {
  await withClock(new Date(2026, 8, 30, 1).getTime(), async () => {
    const input = { date: '2026-09-30', minutes: 10, category: 'Mindfulness', title: '  Park meditation  ' };
    for (const minutes of [0, 0.5, -1, 180.1, NaN, Infinity]) assert.equal(state().logPractice({ ...input, minutes }), false);
    for (const date of ['2026-10-01', '2026-02-30', '2025-02-29', '2026-13-01', '2026-09-00', 'September 30', '2026-9-3']) assert.equal(state().logPractice({ ...input, date }), false);
    assert.equal(state().logPractice({ ...input, category: 'Unknown' }), false);
    assert.equal(state().completedSessions.length, 0);
    assert.equal(state().logPractice({ ...input, minutes: 1.5 }), true);
    assert.equal(state().logPractice({ ...input, date: '2024-02-29', minutes: 180 }), true);
    assert.equal(state().completedSessions[0].seconds, 90);
    assert.equal(state().completedSessions[0].title, 'Park meditation');
    assert.equal(state().completedSessions[0].source, 'manual');
    assert.equal(state().completedSessions[0].hour, undefined);
    assert.notEqual(state().completedSessions[0].recordId, state().completedSessions[1].recordId);
  });
});

test('only manual records can be removed and deletion remains saved', async () => {
  state().logPractice({ date: localDateKey(), minutes: 5, category: 'Focus' });
  const manualId = state().completedSessions[0].recordId;
  state().startSession(session);
  state().advance(2);
  const timerId = state().completedSessions[1].recordId;
  state().removePractice(timerId);
  assert.equal(state().completedSessions.length, 2);
  state().removePractice(manualId);
  await useAppStore.persist.rehydrate();
  assert.equal(state().completedSessions.length, 1);
  assert.equal(state().completedSessions[0].recordId, timerId);
});

test('breathing credit is precise and can span midnight without duplicate session counts', async () => {
  await withClock(new Date(2026, 8, 30, 0, 0, 30).getTime(), async () => {
    state().recordBreathing(1.25);
    assert.equal(totalSeconds(), 75);
    assert.deepEqual(state().completedSessions.map(record => record.seconds), [45, 30]);
    assert.equal(state().completedSessions.reduce((sum, record) => sum + record.sessionCount, 0), 1);
    assert.ok(state().completedSessions.every(record => record.source === 'breathing'));
  });
});

test('paused breathing keeps active intervals on their actual dates and persists one session', async () => {
  const beforeMidnight = new Date(2026, 8, 29, 23, 59, 30).getTime();
  const afterPause = new Date(2026, 8, 30, 0, 15).getTime();
  await withClock(afterPause + 40_000, async () => {
    state().recordBreathing(1, [
      { startTime: beforeMidnight, seconds: 20 },
      { startTime: afterPause, seconds: 40 },
    ]);
    await useAppStore.persist.rehydrate();
    assert.deepEqual(state().completedSessions.map(({ date, seconds, sessionCount }) => ({ date, seconds, sessionCount })), [
      { date: '2026-09-29', seconds: 20, sessionCount: 1 },
      { date: '2026-09-30', seconds: 40, sessionCount: 0 },
    ]);
    assert.equal(totalSeconds(), 60);
  });
});

test('breathing intervals combine resumed time without counting pauses or additional sessions', () => {
  const start = new Date(2026, 8, 29, 12).getTime();
  state().recordBreathing(1, [
    { startTime: start, seconds: 10.125 },
    { startTime: start + 120_000, seconds: 49.875 },
  ]);
  assert.equal(totalSeconds(), 60);
  assert.equal(state().completedSessions.length, 1);
  assert.equal(state().completedSessions[0].sessionCount, 1);
});

test('invalid or incomplete breathing intervals never create practice credit', () => {
  const start = new Date(2026, 8, 29, 12).getTime();
  for (const intervals of [[], [{ startTime: start, seconds: 59 }], [{ startTime: NaN, seconds: 60 }],
    [{ startTime: Number.MAX_VALUE, seconds: 60 }], [{ startTime: start, seconds: Infinity }],
    [{ startTime: start, seconds: -1 }, { startTime: start, seconds: 61 }]]) {
    state().recordBreathing(1, intervals);
  }
  assert.deepEqual(state().completedSessions, []);
});

test('legacy migration preserves all real time and only backed lesson progress', async () => {
  const legacy = { version: 0, state: { name: 'Amina', dailyGoal: 15, mood: 'Good', moodDate: '2026-09-29', favorites: ['calm'],
    completedLessons: { mindfulness: [0, 1, 2], sleep: [0] }, completedSessions: [
      { id: 'practice', date: '2026-09-25', minutes: 12, category: 'Focus', hour: 7 },
      { id: 'program:mindfulness:2', date: '2026-09-26', minutes: 10, category: 'Mindfulness' },
      { id: 'breathing-practice', date: '2026-09-27', minutes: 3, category: 'Breathwork' },
    ] } };
  savedStorage.set('still-wellness-v1', JSON.stringify(legacy));
  await useAppStore.persist.rehydrate();
  assert.equal(totalSeconds(), 25 * 60);
  assert.equal(state().name, 'Amina');
  assert.equal(state().dailyGoal, 15);
  assert.deepEqual(state().completedLessons, { mindfulness: [2] });
  assert.deepEqual(state().moodHistory, { '2026-09-29': 'Good' });
  const ids = state().completedSessions.map(record => record.recordId);
  assert.equal(new Set(ids).size, 3);
  await useAppStore.persist.rehydrate();
  assert.deepEqual(state().completedSessions.map(record => record.recordId), ids);
  assert.equal(persisted().version, 2);
});

test('a legacy profile with only seeded lesson state becomes an honest empty history', async () => {
  savedStorage.set('still-wellness-v1', JSON.stringify({ version: 0, state: { completedSessions: [], completedLessons: { mindfulness: [0, 1] } } }));
  await useAppStore.persist.rehydrate();
  assert.deepEqual(state().completedLessons, {});
  assert.deepEqual(state().completedSessions, []);
});

test('invalid clocks and unsupported goals cannot corrupt the ledger', () => {
  state().startSession(session);
  [NaN, Infinity, Number.MAX_VALUE, -10, 0].forEach(value => state().advance(value));
  state().setElapsed(NaN);
  state().setSleepTimer(-1);
  [-4, 0, NaN, Infinity].forEach(value => state().recordBreathing(value));
  assert.equal(totalSeconds(), 0);
  assert.equal(state().elapsed, 0);
  assert.equal(state().sleepTimer, null);
  [NaN, Infinity, -1, 0, 12, 120].forEach(value => state().setDailyGoal(value));
  assert.equal(state().dailyGoal, 20);
  [5, 10, 15, 20, 30, 45, 60].forEach(value => { state().setDailyGoal(value); assert.equal(state().dailyGoal, value); });
});

test('storage failures are visible without recursion and a later write can recover', async () => {
  failWrites = true;
  state().startSession(session);
  state().advance(5);
  await flush();
  assert.match(state().storageError, /could not be saved/);
  assert.equal(totalSeconds(), 5);
  failWrites = false;
  state().advance(2);
  await flush();
  assert.equal(state().storageError, null);
  assert.equal(persisted().state.completedSessions[0].seconds, 7);
});

test('read failure never overwrites a previously saved ledger with empty defaults', async () => {
  state().logPractice({ date: localDateKey(), minutes: 10, category: 'Focus' });
  await flush();
  const saved = savedStorage.get('still-wellness-v1');
  await useAppStore.setState({ ...useAppStore.getInitialState(), hasHydrated: false }, true);
  savedStorage.set('still-wellness-v1', saved);
  failReads = true;
  await useAppStore.persist.rehydrate();
  assert.equal(state().hasHydrated, true);
  assert.match(state().storageError, /could not be loaded/);
  assert.deepEqual(state().completedSessions, []);
  state().notify('Checking storage');
  await flush();
  assert.equal(savedStorage.get('still-wellness-v1'), saved);
  failReads = false;
  await useAppStore.persist.rehydrate();
  assert.equal(state().storageError, null);
  assert.equal(totalSeconds(), 600);
});

test('a failed migration write remains visible after hydration completes', async () => {
  savedStorage.set('still-wellness-v1', JSON.stringify({ version: 0, state: { completedSessions: [{ id: 'old', date: '2026-09-29', minutes: 5, category: 'Focus' }] } }));
  failWrites = true;
  await useAppStore.persist.rehydrate();
  assert.equal(state().hasHydrated, true);
  assert.equal(totalSeconds(), 300);
  assert.match(state().storageError, /could not be saved/);
  failWrites = false;
  await flush();
  assert.equal(state().storageError, null);
  assert.equal(persisted().version, 2);
});

test('mood history keeps daily check-ins and restores them from local storage', async () => {
  await withClock(new Date(2026, 8, 29, 12).getTime(), async setClock => {
    state().setMood('Good');
    setClock(new Date(2026, 8, 30, 12).getTime());
    state().setMood('Okay');
    state().setMood('Wonderful');
    await useAppStore.persist.rehydrate();
    assert.equal(state().mood, 'Wonderful');
    assert.deepEqual(state().moodHistory, { '2026-09-29': 'Good', '2026-09-30': 'Wonderful' });
  });
});
