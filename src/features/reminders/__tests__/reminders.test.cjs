const assert = require('node:assert/strict');
const fs = require('node:fs');
const { test } = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  module._compile(compiled.outputText, filename);
};

const { validateReminder, formatTime, repeatLabel, nextReminderDate, getReminderMessage, reminderDateKey, reminderClockParts } = require('../model.ts');
const { createReminderPlan, syncReminderSchedules, TEST_IDENTIFIER } = require('../scheduling.ts');
const reminder = overrides => ({ id: 'morning', title: 'Morning meditation', time: '07:30', enabled: true, days: [1, 2, 3, 4, 5], ...overrides });

function fakeGateway(initial = []) {
  const jobs = new Map(initial.map(job => [job.identifier, job]));
  const calls = [];
  let failSchedule = null;
  let failCancel = null;
  return {
    jobs, calls,
    setFailSchedule: value => { failSchedule = value; },
    setFailCancel: value => { failCancel = value; },
    list: async () => [...jobs.values()].map(job => ({ identifier: job.identifier, signature: job.signature, recoverable: job.signature ? job : undefined })),
    schedule: async job => {
      calls.push(['schedule', job.identifier]);
      jobs.set(job.identifier, job); // A platform may persist a job before reporting an error.
      if (failSchedule && failSchedule(job)) { failSchedule = null; throw Error('OS schedule failure'); }
    },
    cancel: async identifier => {
      calls.push(['cancel', identifier]);
      if (failCancel && failCancel(identifier)) { failCancel = null; throw Error('OS cancellation failure'); }
      jobs.delete(identifier);
    },
  };
}

test('validates Bangladesh time, day selection, unique repeat days, and reminder identity', () => {
  assert.equal(validateReminder(reminder()), null);
  for (const value of ['7:30', '24:00', '12:60', '07:30 AM', '']) assert.match(validateReminder(reminder({ time: value })), /valid time/);
  assert.match(validateReminder(reminder({ days: [] })), /at least one day/);
  for (const days of [[0, 0], [-1], [7], [1.5]]) assert.match(validateReminder(reminder({ days })), /repeat day/);
  assert.match(validateReminder(reminder({ id: '' })), /found/);
  assert.match(validateReminder(reminder({ title: '   ' })), /name/);
});

test('formats midnight, noon and repeat labels consistently', () => {
  assert.equal(formatTime('00:00'), '12:00 AM');
  assert.equal(formatTime('12:05'), '12:05 PM');
  assert.equal(formatTime('23:59'), '11:59 PM');
  assert.equal(repeatLabel(reminder()), 'Weekdays');
  assert.equal(repeatLabel(reminder({ days: [6, 0] })), 'Weekends');
  assert.equal(repeatLabel(reminder({ days: [6, 5, 4, 3, 2, 1, 0] })), 'Every day');
  assert.equal(repeatLabel(reminder({ days: [5, 1, 3] })), 'Mon, Wed, Fri');
});

test('finds the next selected day and skips already passed or exact-current minutes', () => {
  const monday = new Date('2026-10-05T01:29:59Z');
  assert.equal(nextReminderDate(reminder(), monday).toISOString(), '2026-10-05T01:30:00.000Z');
  assert.equal(nextReminderDate(reminder(), new Date('2026-10-05T01:30:00Z')).toISOString(), '2026-10-06T01:30:00.000Z');
  assert.equal(nextReminderDate(reminder(), new Date('2026-10-09T02:00:00Z')).toISOString(), '2026-10-12T01:30:00.000Z');
  assert.equal(nextReminderDate(reminder({ days: [1] }), new Date('2026-10-05T02:00:00Z')).toISOString(), '2026-10-12T01:30:00.000Z');
  assert.equal(nextReminderDate(reminder({ enabled: false }), monday), null);
  assert.equal(nextReminderDate(reminder({ days: [] }), monday), null);
});

test('Bangladesh midnight crosses the local year boundary while UTC is still December', () => {
  const result = nextReminderDate(reminder({ time: '00:00', days: [0, 1, 2, 3, 4, 5, 6] }), new Date('2026-12-31T17:59:00Z'));
  assert.equal(result.toISOString(), '2026-12-31T18:00:00.000Z');
  assert.equal(reminderDateKey(result), '2027-01-01');
  assert.deepEqual(reminderClockParts(result), { year: 2027, month: 1, day: 1, weekday: 5, hour: 0, minute: 0 });
});

test('the same Bangladesh reminder fires at the same instant in UTC, Dhaka and New York device zones', () => {
  const prior = process.env.TZ;
  try {
    for (const zone of ['UTC', 'Asia/Dhaka', 'America/New_York']) {
      process.env.TZ = zone;
      const next = nextReminderDate(reminder({ days: [1], time: '00:15' }), new Date('2026-10-04T18:14:00Z'));
      assert.equal(next.toISOString(), '2026-10-04T18:15:00.000Z');
      assert.equal(reminderDateKey(next), '2026-10-05');
      assert.equal(reminderClockParts(next).weekday, 1);
    }
  } finally { if (prior === undefined) delete process.env.TZ; else process.env.TZ = prior; }
});

test('Bangladesh daily reminders remain 24 hours apart across device daylight-saving changes', () => {
  const prior = process.env.TZ;
  process.env.TZ = 'America/New_York';
  try {
    const daily = reminder({ days: [0, 1, 2, 3, 4, 5, 6] });
    const first = nextReminderDate(daily, new Date('2026-03-08T01:29:00Z'));
    const second = nextReminderDate(daily, first);
    assert.equal(first.toISOString(), '2026-03-08T01:30:00.000Z');
    assert.equal(second.toISOString(), '2026-03-09T01:30:00.000Z');
    assert.equal(second - first, 24 * 60 * 60 * 1000);
  } finally { if (prior === undefined) delete process.env.TZ; else process.env.TZ = prior; }
});

test('routes selected reminder purposes to the appropriate practice screen', () => {
  assert.equal(getReminderMessage(reminder()).route, '/meditate');
  assert.equal(getReminderMessage(reminder({ title: 'Evening wind-down' })).route, '/sleep');
  assert.equal(getReminderMessage(reminder({ title: 'Mindful pause' })).route, '/breathing');
});

test('weekly plans map JS Sunday zero to native Sunday one and use stable per-day IDs', () => {
  const plan = createReminderPlan([reminder({ days: [6, 0], time: '21:05' })]);
  assert.deepEqual(plan.map(job => [job.weekday, job.hour, job.minute]), [[1, 21, 5], [7, 21, 5]]);
  assert.equal(plan[0].identifier, 'still.reminder.v1:morning:0');
  assert.equal(plan[1].timeZone, 'Asia/Dhaka');
  assert.deepEqual(createReminderPlan([reminder({ enabled: false })]), []);
  assert.throws(() => createReminderPlan([reminder(), reminder()]), /same ID/);
});

test('restoring a matching schedule is idempotent and does not touch unrelated jobs or tests', async () => {
  const initial = createReminderPlan([reminder()]);
  const gateway = fakeGateway([...initial, { identifier: 'another-feature' }, { identifier: TEST_IDENTIFIER }]);
  await syncReminderSchedules([reminder()], gateway);
  assert.deepEqual(gateway.calls, []);
  assert.equal(gateway.jobs.size, 7);
});

test('editing time replaces stable jobs; changing days cancels only removed repeat days', async () => {
  const gateway = fakeGateway(createReminderPlan([reminder()]));
  await syncReminderSchedules([reminder({ time: '08:15', days: [1, 3] })], gateway);
  assert.equal(gateway.jobs.size, 2);
  assert.deepEqual([...gateway.jobs.values()].map(job => job.hour), [8, 8]);
  assert.equal(gateway.calls.filter(call => call[0] === 'schedule').length, 2);
  assert.equal(gateway.calls.filter(call => call[0] === 'cancel').length, 3);
  gateway.calls.length = 0;
  await syncReminderSchedules([reminder({ enabled: false })], gateway);
  assert.equal(gateway.jobs.size, 0);
  assert.equal(gateway.calls.length, 2);
});

test('Android converts Bangladesh weekdays to device weekdays and refreshes after travel without duplicates', async () => {
  const prior = process.env.TZ;
  const options = { platform: 'android', now: new Date('2026-10-04T12:00:00Z') };
  const earlyMonday = reminder({ days: [1], time: '00:15' });
  try {
    process.env.TZ = 'Asia/Dhaka';
    const gateway = fakeGateway(createReminderPlan([earlyMonday], options));
    process.env.TZ = 'America/New_York';
    await syncReminderSchedules([earlyMonday], gateway, options);
    const [job] = gateway.jobs.values();
    assert.equal(gateway.jobs.size, 1);
    assert.equal(gateway.calls.length, 1);
    assert.equal(job.timeZone, 'Asia/Dhaka');
    assert.deepEqual([job.weekday, job.hour, job.minute], [2, 0, 15]);
    assert.deepEqual([job.triggerWeekday, job.triggerHour, job.triggerMinute], [1, 14, 15]);
    gateway.calls.length = 0;
    await syncReminderSchedules([earlyMonday], gateway, options);
    assert.equal(gateway.calls.length, 0);
  } finally { if (prior === undefined) delete process.env.TZ; else process.env.TZ = prior; }
});

test('iOS calendar plans remain anchored to Bangladesh time after device timezone changes', () => {
  const before = createReminderPlan([reminder()], { platform: 'ios', deviceTimeZone: 'Asia/Dhaka' });
  const after = createReminderPlan([reminder()], { platform: 'ios', deviceTimeZone: 'America/New_York' });
  assert.deepEqual(before, after);
  assert.ok(after.every(job => job.triggerKind === 'calendar' && job.timeZone === 'Asia/Dhaka'));
});

test('a partially failed edit restores the old schedule and removes newly attempted jobs', async () => {
  const original = createReminderPlan([reminder({ days: [1] })]);
  const gateway = fakeGateway(original);
  gateway.setFailSchedule(job => job.weekday === 3);
  await assert.rejects(syncReminderSchedules([reminder({ days: [1, 2], time: '09:30' })], gateway), /previous schedule was restored/);
  assert.deepEqual([...gateway.jobs.values()], original);
});

test('failed cancellation restores jobs already removed in that operation', async () => {
  const original = createReminderPlan([reminder({ days: [1, 2] })]);
  const gateway = fakeGateway(original);
  gateway.setFailCancel(identifier => identifier.endsWith(':2'));
  await assert.rejects(syncReminderSchedules([], gateway), /previous schedule was restored/);
  assert.deepEqual([...gateway.jobs.values()].sort((a, b) => a.weekday - b.weekday), original);
});

test('invalid input and platform capacity failures leave existing scheduled notifications untouched', async () => {
  const gateway = fakeGateway(Array.from({ length: 62 }, (_, i) => ({ identifier: `unrelated-${i}` })));
  await assert.rejects(syncReminderSchedules([reminder()], gateway), /too many/);
  assert.equal(gateway.calls.length, 0);
  await assert.rejects(syncReminderSchedules([reminder({ time: '25:00' })], gateway), /valid time/);
  assert.equal(gateway.calls.length, 0);
});

test('a full notification queue never blocks turning reminders off or permission-revocation cleanup', async () => {
  const owned = createReminderPlan([reminder()]);
  const unrelated = Array.from({ length: 64 }, (_, index) => ({ identifier: `unrelated-${index}` }));
  for (const next of [[reminder({ enabled: false })], []]) {
    const gateway = fakeGateway([...owned, ...unrelated]);
    await syncReminderSchedules(next, gateway);
    assert.deepEqual([...gateway.jobs.keys()], unrelated.map(job => job.identifier));
    assert.deepEqual(gateway.calls, owned.map(job => ['cancel', job.identifier]));
  }
});

test('an unchanged schedule above the reserved capacity remains an idempotent no-op', async () => {
  const owned = createReminderPlan([reminder()]);
  const unrelated = Array.from({ length: 59 }, (_, index) => ({ identifier: `unrelated-${index}` }));
  const gateway = fakeGateway([...owned, ...unrelated]);
  await syncReminderSchedules([reminder()], gateway);
  assert.equal(gateway.jobs.size, 64);
  assert.deepEqual(gateway.calls, []);
});
