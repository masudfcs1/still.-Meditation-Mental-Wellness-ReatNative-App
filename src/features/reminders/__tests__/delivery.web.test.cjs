const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(compiled.outputText, filename);
};

const { createWebReminderDelivery } = require('../delivery.web.ts');
const mondayMorning = Date.UTC(2026, 9, 5, 1, 29, 50); // Monday 07:29:50 in Bangladesh (UTC+6).
const morning = { id: 'morning', title: 'Morning meditation', time: '07:30', enabled: true, days: [1, 2, 3, 4, 5] };
const flushPromises = async () => { for (let i = 0; i < 8; i += 1) await Promise.resolve(); };

function makeBrowser({ storage = new Map(), permission = 'default', locks = true } = {}) {
  let currentTime = mondayMorning;
  let timerId = 0;
  const timers = new Map();
  const windowEvents = new Map();
  const documentEvents = new Map();
  const notifications = [];
  let permissionRequests = 0;
  let focusCalls = 0;
  const eventTarget = events => ({
    addEventListener: (type, callback) => {
      if (!events.has(type)) events.set(type, new Set());
      events.get(type).add(callback);
    },
    removeEventListener: (type, callback) => events.get(type)?.delete(callback),
  });
  class FakeNotification {
    static permission = permission;
    static async requestPermission() { permissionRequests += 1; FakeNotification.permission = 'granted'; return 'granted'; }
    constructor(title, options) { this.title = title; this.options = options; notifications.push(this); }
    close() { this.closed = true; }
  }
  const browser = {
    ...eventTarget(windowEvents),
    isSecureContext: true,
    Notification: FakeNotification,
    navigator: { locks: locks ? { request: async (_key, callback) => callback() } : undefined },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    document: { ...eventTarget(documentEvents), visibilityState: 'visible' },
    setTimeout: (callback, delay) => { const id = ++timerId; timers.set(id, { callback, at: currentTime + delay }); return id; },
    clearTimeout: id => timers.delete(id),
    focus: () => { focusCalls += 1; },
  };
  const delivery = createWebReminderDelivery(() => browser, () => currentTime);
  const received = [];
  const opened = [];
  const unsubscribe = delivery.subscribe({ onReceive: message => received.push(message), onOpen: route => opened.push(route) });
  return {
    browser, delivery, received, opened, notifications, timers, unsubscribe,
    get permissionRequests() { return permissionRequests; },
    get focusCalls() { return focusCalls; },
    async advance(milliseconds) {
      const destination = currentTime + milliseconds;
      while (true) {
        const next = [...timers.entries()].filter(([, value]) => value.at <= destination).sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        currentTime = Math.max(currentTime, next[1].at);
        timers.delete(next[0]);
        next[1].callback();
        await flushPromises();
      }
      currentTime = destination;
      await flushPromises();
    },
    jump(milliseconds) { currentTime += milliseconds; },
    wake() { for (const callback of windowEvents.get('focus') ?? []) callback(); },
    saveProfile(reminders, options = {}) {
      const { emit = true } = options;
      const reminderSetupVersion = 'reminderSetupVersion' in options ? options.reminderSetupVersion : 1;
      const key = 'still-wellness-v1';
      const newValue = JSON.stringify({ version: 2, state: { reminders, reminderSetupVersion } });
      storage.set(key, newValue);
      if (emit) for (const callback of windowEvents.get('storage') ?? []) callback({ key, newValue, storageArea: browser.localStorage });
    },
    removeProfile({ emit = true } = {}) {
      const key = 'still-wellness-v1';
      storage.delete(key);
      if (emit) for (const callback of windowEvents.get('storage') ?? []) callback({ key, newValue: null, storageArea: browser.localStorage });
    },
    listenerCount() { return [...windowEvents.values(), ...documentEvents.values()].reduce((sum, callbacks) => sum + callbacks.size, 0); },
  };
}

test('browser reminders remain SSR-safe and do not request permission during setup', async () => {
  const ssr = createWebReminderDelivery(() => null);
  assert.deepEqual(await ssr.getPermission(), { status: 'unavailable', canAskAgain: false });
  await ssr.sync([morning]);
  await assert.rejects(ssr.test(), /Open Still/);
  const app = makeBrowser();
  await app.delivery.sync([morning]);
  assert.deepEqual(await app.delivery.getPermission(), { status: 'undetermined', canAskAgain: true });
  assert.equal(app.permissionRequests, 0);
  await app.delivery.requestPermission();
  assert.equal(app.permissionRequests, 1);
  assert.deepEqual(await app.delivery.getPermission(), { status: 'granted', canAskAgain: false });
  app.unsubscribe();
});

test('a saved weekday reminder delivers once at its configured Bangladesh minute without browser permission', async () => {
  const app = makeBrowser({ permission: 'denied' });
  await app.delivery.sync([morning]);
  await app.advance(9_999);
  assert.equal(app.received.length, 0);
  await app.advance(1);
  assert.equal(app.received.length, 1);
  assert.equal(app.received[0].route, '/meditate');
  assert.equal(app.notifications.length, 0);
  app.wake();
  app.wake();
  await app.advance(59_000);
  assert.equal(app.received.length, 1);
  assert.equal(app.permissionRequests, 0);
  app.unsubscribe();
});

test('editing a reminder replaces its old timer and turning it off cancels the new time', async () => {
  const app = makeBrowser();
  await app.delivery.sync([morning]);
  await app.delivery.sync([{ ...morning, time: '07:31' }]);
  await app.advance(10_000);
  assert.equal(app.received.length, 0);
  await app.delivery.sync([{ ...morning, time: '07:31', enabled: false }]);
  await app.advance(60_000);
  assert.equal(app.received.length, 0);
  assert.equal(app.timers.size, 0);
  app.unsubscribe();
});

test('a page waking hours after the scheduled time skips stale reminders', async () => {
  const app = makeBrowser();
  await app.delivery.sync([morning]);
  app.jump(2 * 60 * 60_000);
  app.wake();
  await app.advance(0);
  assert.equal(app.received.length, 0);
  assert.equal(app.timers.size, 1);
  app.unsubscribe();
});

test('a short browser delay still delivers the due reminder once', async () => {
  const app = makeBrowser();
  await app.delivery.sync([morning]);
  app.jump(25_000);
  app.wake();
  await app.advance(0);
  assert.equal(app.received.length, 1);
  app.wake();
  await app.advance(0);
  assert.equal(app.received.length, 1);
  app.unsubscribe();
});

test('two open tabs share an occurrence claim so only one displays the reminder', async () => {
  const storage = new Map();
  const first = makeBrowser({ storage });
  const second = makeBrowser({ storage });
  await Promise.all([first.delivery.sync([morning]), second.delivery.sync([morning])]);
  await Promise.all([first.advance(10_000), second.advance(10_000)]);
  assert.equal(first.received.length + second.received.length, 1);
  first.unsubscribe();
  second.unsubscribe();
});

test('browsers without Web Locks elect one storage claim across tabs', async () => {
  const storage = new Map();
  const first = makeBrowser({ storage, locks: false });
  const second = makeBrowser({ storage, locks: false });
  await Promise.all([first.delivery.sync([morning]), second.delivery.sync([morning])]);
  await Promise.all([first.advance(10_100), second.advance(10_100)]);
  assert.equal(first.received.length + second.received.length, 1);
  first.unsubscribe();
  second.unsubscribe();
});

test('a refreshed page restores its schedule and remembers an already delivered occurrence', async () => {
  const storage = new Map();
  const first = makeBrowser({ storage });
  await first.delivery.sync([morning]);
  await first.advance(10_000);
  first.unsubscribe();
  const refreshed = makeBrowser({ storage });
  await refreshed.delivery.sync([morning]);
  await refreshed.advance(10_000);
  assert.equal(first.received.length, 1);
  assert.equal(refreshed.received.length, 0);
  refreshed.unsubscribe();
});

test('test reminders are delivered after five seconds and OS clicks open the intended screen', async () => {
  const app = makeBrowser({ permission: 'granted' });
  await app.delivery.test();
  await app.advance(4_999);
  assert.equal(app.received.length, 0);
  await app.advance(1);
  assert.equal(app.received.length, 1);
  assert.equal(app.notifications.length, 1);
  app.notifications[0].onclick();
  assert.deepEqual(app.opened, ['/meditate']);
  assert.equal(app.focusCalls, 1);
  assert.equal(app.notifications[0].closed, true);
  assert.equal(app.permissionRequests, 0);
  app.unsubscribe();
});

test('unmounting clears recurring and test timers as well as wake listeners', async () => {
  const app = makeBrowser();
  await app.delivery.sync([morning]);
  await app.delivery.test();
  assert.equal(app.timers.size, 2);
  assert.equal(app.listenerCount(), 4);
  app.unsubscribe();
  assert.equal(app.timers.size, 0);
  assert.equal(app.listenerCount(), 0);
  await app.advance(60_000);
  assert.equal(app.received.length, 0);
});

test('invalid times and empty repeat days never create a browser timer', async () => {
  const app = makeBrowser();
  await app.delivery.sync([{ ...morning, time: '25:99' }, { ...morning, id: 'empty', days: [] }]);
  assert.equal(app.timers.size, 0);
  app.unsubscribe();
});

test('turning a reminder off in another tab immediately cancels this tab’s schedule', async () => {
  const app = makeBrowser();
  app.saveProfile([morning], { emit: false });
  await app.delivery.sync([morning]);
  app.saveProfile([{ ...morning, enabled: false }]);
  assert.equal(app.timers.size, 0);
  await app.advance(10_000);
  assert.equal(app.received.length, 0);
  app.unsubscribe();
});

test('an edited time from another tab replaces the old schedule with its new Bangladesh minute', async () => {
  const app = makeBrowser();
  app.saveProfile([morning], { emit: false });
  await app.delivery.sync([morning]);
  app.saveProfile([{ ...morning, time: '07:31' }]);
  await app.advance(10_000);
  assert.equal(app.received.length, 0);
  await app.advance(60_000);
  assert.equal(app.received.length, 1);
  app.unsubscribe();
});

test('a missed storage event cannot let a disabled or deleted reminder fire', async () => {
  for (const after of [[{ ...morning, enabled: false }], []]) {
    const app = makeBrowser();
    app.saveProfile([morning], { emit: false });
    await app.delivery.sync([morning]);
    app.saveProfile(after, { emit: false });
    await app.advance(10_000);
    assert.equal(app.received.length, 0);
    assert.equal(app.timers.size, 0);
    app.unsubscribe();
  }
});

test('a stale store refresh cannot resurrect an externally disabled reminder', async () => {
  const app = makeBrowser();
  app.saveProfile([morning], { emit: false });
  await app.delivery.sync([morning]);
  app.saveProfile([{ ...morning, enabled: false }]);
  await app.delivery.sync([morning]);
  await app.advance(0);
  assert.equal(app.timers.size, 0);
  await app.advance(10_000);
  assert.equal(app.received.length, 0);
  app.unsubscribe();
});

test('scheduling before the controller persists its candidate still keeps the newly saved time', async () => {
  const app = makeBrowser();
  app.saveProfile([morning], { emit: false });
  await app.delivery.sync([morning]);
  const edited = { ...morning, time: '07:31' };
  await app.delivery.sync([edited]);
  app.saveProfile([edited], { emit: false });
  await app.advance(0);
  await app.advance(10_000);
  assert.equal(app.received.length, 0);
  await app.advance(60_000);
  assert.equal(app.received.length, 1);
  app.unsubscribe();
});

test('a settings change during the cross-tab claim suppresses delivery before anything is displayed', async () => {
  const app = makeBrowser({ locks: false });
  app.saveProfile([morning], { emit: false });
  await app.delivery.sync([morning]);
  await app.advance(10_000);
  app.saveProfile([{ ...morning, enabled: false }], { emit: false });
  await app.advance(40);
  assert.equal(app.received.length, 0);
  app.unsubscribe();
});

test('removing a known saved profile stops reminders even when its storage event was missed', async () => {
  for (const emit of [true, false]) {
    const app = makeBrowser();
    app.saveProfile([morning], { emit: false });
    await app.delivery.sync([morning]);
    app.removeProfile({ emit });
    await app.advance(10_000);
    assert.equal(app.received.length, 0);
    assert.equal(app.timers.size, 0);
    app.unsubscribe();
  }
});

test('preview preferences without notification opt-in never become active through a storage event', async () => {
  const app = makeBrowser();
  await app.delivery.sync([morning]);
  app.saveProfile([morning], { reminderSetupVersion: undefined });
  await app.advance(10_000);
  assert.equal(app.received.length, 0);
  app.unsubscribe();
});

test('moving the clock backward recalculates the due time without repeating an already delivered occurrence', async () => {
  const app = makeBrowser();
  await app.delivery.sync([morning]);
  app.jump(-60_000);
  app.wake();
  await app.advance(69_999);
  assert.equal(app.received.length, 0);
  await app.advance(1);
  assert.equal(app.received.length, 1);
  app.jump(-30_000);
  app.wake();
  await app.advance(30_000);
  assert.equal(app.received.length, 1);
  app.unsubscribe();
});

test('cross-tab preference changes do not cancel the explicitly requested five-second test', async () => {
  const app = makeBrowser();
  await app.delivery.test();
  app.saveProfile([{ ...morning, enabled: false }]);
  await app.advance(5_000);
  assert.equal(app.received.length, 1);
  assert.match(app.received[0].body, /reminder is working/);
  app.unsubscribe();
});

test('Bangladesh reminders fire at the same instant in UTC and New York browsers, including the correct weekday', async () => {
  const originalZone = process.env.TZ;
  try {
    for (const [zone, localHour, localWeekday] of [['UTC', 1, 1], ['America/New_York', 21, 0]]) {
      // This changes only this isolated Node test process, never the computer or browser settings.
      process.env.TZ = zone;
      assert.equal(new Date(mondayMorning).getHours(), localHour);
      assert.equal(new Date(mondayMorning).getDay(), localWeekday);
      const app = makeBrowser();
      await app.delivery.sync([morning]);
      await app.advance(9_999);
      assert.equal(app.received.length, 0, zone);
      await app.advance(1);
      assert.equal(app.received.length, 1, zone);
      app.unsubscribe();
    }
  } finally {
    if (originalZone === undefined) delete process.env.TZ;
    else process.env.TZ = originalZone;
  }
});

test('a device time-zone change while a reminder is pending does not move its Bangladesh schedule', async () => {
  const originalZone = process.env.TZ;
  const app = makeBrowser();
  try {
    process.env.TZ = 'Asia/Dhaka';
    await app.delivery.sync([morning]);
    process.env.TZ = 'America/New_York';
    app.wake();
    await app.advance(10_000);
    assert.equal(app.received.length, 1);
  } finally {
    app.unsubscribe();
    if (originalZone === undefined) delete process.env.TZ;
    else process.env.TZ = originalZone;
  }
});
