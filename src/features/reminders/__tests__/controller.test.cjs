const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const { test, beforeEach } = require('node:test');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, filename);
};
const storage = new Map();
let failWrites = false, failReads = false, failSyncOnce = false;
let permission = { status: 'granted', canAskAgain: true };
let requests = 0, tests = 0;
const syncs = [];
const fakeDelivery = {
  kind: 'native',
  getPermission: async () => permission,
  requestPermission: async () => { requests++; permission = { status: 'granted', canAskAgain: true }; return permission; },
  sync: async reminders => { syncs.push(structuredClone(reminders)); if (failSyncOnce) { failSyncOnce = false; throw new Error('Device scheduling failed'); } },
  test: async () => { tests++; },
  openSettings: async () => {},
};
const originalLoad = Module._load;
Module._load = function (id, ...args) {
  if (id === '@react-native-async-storage/async-storage') return {
    getItem: async key => { if (failReads) throw Error('Read failed'); return storage.get(key) ?? null; },
    setItem: async (key, value) => { if (failWrites) throw Error('Storage full'); storage.set(key, value); },
    removeItem: async key => storage.delete(key),
  };
  if (id === './delivery' && args[0]?.filename.endsWith('controller.ts')) return { reminderDelivery: fakeDelivery };
  return originalLoad.call(this, id, ...args);
};
const { useAppStore, flushAppStorage } = require('../../../store/useAppStore.ts');
const controller = require('../controller.ts');
Module._load = originalLoad;
const state = () => useAppStore.getState();
const saved = () => JSON.parse(storage.get('still-wellness-v1')).state;
beforeEach(async () => {
  failReads = false; failWrites = false; failSyncOnce = false;
  fakeDelivery.kind = 'native';
  permission = { status: 'granted', canAskAgain: true };
  await useAppStore.persist.rehydrate();
  await useAppStore.setState({ ...useAppStore.getInitialState(), hasHydrated: true, storageError: null }, true);
  controller.useReminderState.setState({ permission: null, busy: false, ready: false, error: null, lastTestAt: null });
  syncs.length = 0; requests = 0; tests = 0;
});

test('setup is explicit and an enabled reminder is durably saved after scheduling', async () => {
  assert.ok(state().reminders.every(item => !item.enabled));
  const next = { ...state().reminders[0], enabled: true, time: '08:15', days: [0, 6] };
  assert.equal(await controller.saveReminder(next), true);
  assert.deepEqual(saved().reminders[0], next);
  assert.equal(saved().reminderSetupVersion, 1);
  assert.deepEqual(syncs[0][0], next);
  assert.equal(controller.useReminderState.getState().busy, false);
  await useAppStore.persist.rehydrate();
  assert.deepEqual(state().reminders[0], next);
});

test('legacy preview preferences keep their time and days without silently sending alerts', async () => {
  const previous = { ...saved(), reminders: [{ ...state().reminders[0], enabled: true, time: '09:12' }] };
  delete previous.reminderSetupVersion;
  storage.set('still-wellness-v1', JSON.stringify({ version: 2, state: previous }));
  await useAppStore.persist.rehydrate();
  assert.equal(state().reminders[0].enabled, false);
  assert.equal(state().reminders[0].time, '09:12');
  assert.deepEqual(state().reminders[0].days, [1, 2, 3, 4, 5]);
});

test('permission refusal cannot save a falsely enabled device reminder', async () => {
  permission = { status: 'denied', canAskAgain: false };
  assert.equal(await controller.saveReminder({ ...state().reminders[0], enabled: true }), false);
  assert.equal(state().reminders[0].enabled, false);
  assert.equal(syncs.length, 0);
  assert.equal(requests, 0);
  assert.match(controller.useReminderState.getState().error, /Allow notifications/);
});

test('startup refresh never requests permission and enabling does', async () => {
  permission = { status: 'undetermined', canAskAgain: true };
  await controller.refreshReminders();
  assert.equal(requests, 0);
  assert.equal(await controller.saveReminder({ ...state().reminders[0], enabled: true }), true);
  assert.equal(requests, 1);
});

test('browser reminders can be enabled without requesting optional browser permission', async () => {
  fakeDelivery.kind = 'web';
  permission = { status: 'denied', canAskAgain: false };
  assert.equal(await controller.saveReminder({ ...state().reminders[0], enabled: true }), true);
  assert.equal(requests, 0);
  assert.equal(state().reminders[0].enabled, true);
});

test('failed storage restores the previous preferences and OS schedule', async () => {
  const previous = structuredClone(state().reminders);
  failWrites = true;
  assert.equal(await controller.saveReminder({ ...previous[0], enabled: true, time: '10:30' }), false);
  assert.deepEqual(state().reminders, previous);
  assert.deepEqual(syncs.at(-1), previous);
  assert.equal(saved().reminders[0].enabled, false);
  assert.match(controller.useReminderState.getState().error, /could not be saved/);
});

test('failed schedule never commits a new preference and re-applies the saved schedule', async () => {
  const previous = structuredClone(state().reminders);
  failSyncOnce = true;
  assert.equal(await controller.saveReminder({ ...previous[0], enabled: true }), false);
  assert.deepEqual(state().reminders, previous);
  assert.deepEqual(syncs.at(-1), previous);
});

test('rapid edits are serialized so the final stored time matches the final schedule', async () => {
  const reminder = state().reminders[0];
  const results = await Promise.all([
    controller.saveReminder({ ...reminder, enabled: true, time: '09:00' }),
    controller.saveReminder({ ...reminder, enabled: true, time: '10:00' }),
  ]);
  assert.deepEqual(results, [true, true]);
  assert.equal(state().reminders[0].time, '10:00');
  assert.equal(saved().reminders[0].time, '10:00');
  assert.equal(syncs.at(-1)[0].time, '10:00');
});

test('turning off a reminder removes it from delivery and preserves its repeat settings', async () => {
  await controller.saveReminder({ ...state().reminders[0], enabled: true });
  const on = state().reminders[0];
  assert.equal(await controller.saveReminder({ ...on, enabled: false }), true);
  assert.equal(syncs.at(-1)[0].enabled, false);
  assert.deepEqual(saved().reminders[0].days, on.days);
});

test('a test reminder does not enable schedules or create practice credit', async () => {
  const before = structuredClone(state().reminders);
  assert.equal(await controller.sendTestReminder(), true);
  await flushAppStorage();
  assert.equal(tests, 1);
  assert.deepEqual(state().reminders, before);
  assert.deepEqual(state().completedSessions, []);
  assert.ok(controller.useReminderState.getState().lastTestAt);
});

test('failed hydration does not cancel existing device schedules', async () => {
  failReads = true;
  await useAppStore.persist.rehydrate();
  await controller.refreshReminders();
  assert.equal(syncs.length, 0);
  assert.equal(controller.useReminderState.getState().ready, false);
});
