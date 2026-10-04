const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const { beforeEach, test } = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  module._compile(compiled.outputText, filename);
};

const jobs = new Map();
const calls = [];
const platform = { OS: 'android' };
let permission;
let channel;
let handler;
let responseListener;
let lastResponse;
const notifications = {
  AndroidImportance: { NONE: 0, HIGH: 4 },
  IosAuthorizationStatus: { AUTHORIZED: 2, PROVISIONAL: 3, EPHEMERAL: 4 },
  DEFAULT_ACTION_IDENTIFIER: 'default',
  SchedulableTriggerInputTypes: { WEEKLY: 'weekly', CALENDAR: 'calendar', TIME_INTERVAL: 'timeInterval' },
  setNotificationHandler: value => { handler = value; },
  setNotificationChannelAsync: async () => { calls.push('channel'); if (!channel) channel = { importance: 4 }; },
  getNotificationChannelAsync: async () => channel,
  getPermissionsAsync: async () => permission,
  requestPermissionsAsync: async () => { calls.push('request'); permission = { status: 'granted', granted: true, canAskAgain: true }; return permission; },
  getAllScheduledNotificationsAsync: async () => [...jobs.values()],
  scheduleNotificationAsync: async request => { jobs.set(request.identifier, request); return request.identifier; },
  cancelScheduledNotificationAsync: async id => { jobs.delete(id); },
  addNotificationResponseReceivedListener: listener => { responseListener = listener; return { remove: () => { responseListener = null; } }; },
  getLastNotificationResponse: () => lastResponse,
  clearLastNotificationResponse: () => { lastResponse = null; calls.push('clear-response'); },
};
const load = Module._load;
Module._load = function (id, ...rest) {
  if (id === 'expo-notifications') return notifications;
  if (id === 'react-native') return { Platform: platform, Linking: { openSettings: async () => { calls.push('settings'); } } };
  return load.call(this, id, ...rest);
};
const { reminderDelivery } = require('../delivery.ts');
const { REMINDER_OWNER, TEST_IDENTIFIER } = require('../scheduling.ts');
Module._load = load;
const reminder = { id: 'morning', title: 'Morning meditation', time: '07:30', enabled: true, days: [0, 1] };

beforeEach(() => {
  process.env.TZ = 'Asia/Dhaka';
  jobs.clear(); calls.length = 0; platform.OS = 'android'; channel = null; lastResponse = null;
  permission = { status: 'granted', granted: true, canAskAgain: true };
});

test('creates the Android channel before asking for notification permission', async () => {
  permission = { status: 'undetermined', granted: false, canAskAgain: true };
  assert.equal((await reminderDelivery.requestPermission()).status, 'granted');
  assert.deepEqual(calls, ['channel', 'request']);
});

test('recognizes provisional iOS permission and blocked Android reminder channels', async () => {
  platform.OS = 'ios';
  permission = { status: 'denied', granted: false, canAskAgain: false, ios: { status: 3 } };
  assert.equal((await reminderDelivery.getPermission()).status, 'granted');
  platform.OS = 'android';
  permission = { status: 'granted', granted: true, canAskAgain: true };
  channel = { importance: 0 };
  assert.deepEqual(await reminderDelivery.getPermission(), { status: 'denied', canAskAgain: false });
  await reminderDelivery.requestPermission();
  assert.ok(!calls.includes('request'));
});

test('schedules native weekly triggers and removes owned jobs after permission is revoked', async () => {
  jobs.set('unrelated', { identifier: 'unrelated', content: { data: {} } });
  await reminderDelivery.sync([reminder]);
  const jobsForApp = [...jobs.values()].filter(job => job.identifier !== 'unrelated');
  assert.deepEqual(jobsForApp.map(job => job.trigger.weekday), [1, 2]);
  assert.ok(jobsForApp.every(job => job.trigger.type === 'weekly' && job.trigger.channelId === 'still-reminders'));
  await reminderDelivery.sync([reminder]);
  assert.equal(jobs.size, 3);
  permission = { status: 'denied', granted: false, canAskAgain: false };
  await reminderDelivery.sync([reminder]);
  assert.deepEqual([...jobs.keys()], ['unrelated']);
});

test('iOS calendar notifications explicitly use Bangladesh time and repeat weekly', async () => {
  platform.OS = 'ios';
  process.env.TZ = 'America/New_York';
  await reminderDelivery.sync([reminder]);
  assert.deepEqual([...jobs.values()].map(job => job.trigger), [1, 2].map(weekday => ({
    type: 'calendar', timezone: 'Asia/Dhaka', weekday, hour: 7, minute: 30, second: 0, repeats: true,
  })));
});

test('Android maps Bangladesh early Monday to Sunday on a UTC device without changing saved hours', async () => {
  process.env.TZ = 'UTC';
  await reminderDelivery.sync([{ ...reminder, days: [1], time: '00:15' }]);
  const [request] = jobs.values();
  assert.deepEqual(request.trigger, { type: 'weekly', weekday: 1, hour: 18, minute: 15, channelId: 'still-reminders' });
  assert.equal(request.content.data.weekday, 2);
  assert.equal(request.content.data.hour, 0);
  assert.equal(request.content.data.timeZone, 'Asia/Dhaka');
});

test('repeated tests replace one pending five-second test and require notification permission', async () => {
  await reminderDelivery.test();
  await reminderDelivery.test();
  assert.equal(jobs.size, 1);
  assert.equal(jobs.get(TEST_IDENTIFIER).trigger.seconds, 5);
  assert.equal(jobs.get(TEST_IDENTIFIER).trigger.repeats, false);
  permission = { status: 'denied', granted: false, canAskAgain: false };
  await assert.rejects(reminderDelivery.test(), /Allow notifications/);
});

test('the foreground handler presents Still notifications without emitting a duplicate in-app alert', async () => {
  const behavior = await handler.handleNotification({ request: { content: { data: { owner: REMINDER_OWNER } } } });
  assert.deepEqual(behavior, { shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false });
  assert.equal((await handler.handleNotification({ request: { content: { data: {} } } })).shouldShowBanner, false);
});

test('cold and warm taps navigate once, accept only owned requests and safe routes, and unsubscribe', async () => {
  const opened = [];
  const response = route => ({ actionIdentifier: 'default', notification: { date: 100, request: { identifier: TEST_IDENTIFIER, content: { data: { owner: REMINDER_OWNER, route } } } } });
  lastResponse = response('/breathing');
  const stop = reminderDelivery.subscribe({ onOpen: route => opened.push(route), onReceive: () => assert.fail('Native uses the OS banner') });
  await new Promise(resolve => setTimeout(resolve, 5));
  responseListener(response('/breathing'));
  responseListener(response('https://attacker.example'));
  responseListener({ ...response('/sleep'), notification: { ...response('/sleep').notification, request: { identifier: 'another-feature', content: { data: { owner: REMINDER_OWNER, route: '/sleep' } } } } });
  assert.deepEqual(opened, ['/breathing']);
  assert.equal(lastResponse, null);
  stop();
  assert.equal(responseListener, null);
});
