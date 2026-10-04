import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';
import type { ReminderDelivery, ReminderListeners, ReminderMessage, ReminderPermission } from './delivery.types';
import {
  REMINDER_CHANNEL, REMINDER_OWNER, TEST_IDENTIFIER, isReminderIdentifier, syncReminderSchedules,
  type ExistingSchedule, type ReminderSchedule, type ScheduleGateway,
} from './scheduling';

const allowedRoutes = new Set<ReminderMessage['route']>(['/meditate', '/sleep', '/breathing']);
let operation: Promise<void> = Promise.resolve();
let handledResponse: string | null = null;

Notifications.setNotificationHandler({
  handleNotification: async notification => {
    const owned = notification.request.content.data?.owner === REMINDER_OWNER;
    return { shouldShowBanner: owned, shouldShowList: owned, shouldPlaySound: owned, shouldSetBadge: false };
  },
});

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
    name: 'Mindful reminders',
    description: 'The meditation and wind-down reminders you choose in Still.',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 150],
    lightColor: '#718A74',
  });
}

async function readPermission(): Promise<ReminderPermission> {
  const permission = await Notifications.getPermissionsAsync();
  const authorizedIos = permission.ios && [Notifications.IosAuthorizationStatus.AUTHORIZED, Notifications.IosAuthorizationStatus.PROVISIONAL, Notifications.IosAuthorizationStatus.EPHEMERAL].includes(permission.ios.status);
  if (permission.granted || authorizedIos) {
    if (Platform.OS === 'android') {
      const channel = await Notifications.getNotificationChannelAsync(REMINDER_CHANNEL);
      if (channel?.importance === Notifications.AndroidImportance.NONE) return { status: 'denied', canAskAgain: false };
    }
    return { status: 'granted', canAskAgain: permission.canAskAgain };
  }
  return { status: permission.status === 'undetermined' ? 'undetermined' : 'denied', canAskAgain: permission.canAskAgain };
}

function dataFor(schedule: ReminderSchedule): Record<string, unknown> {
  return {
    owner: REMINDER_OWNER, reminderId: schedule.reminderId, route: schedule.route, signature: schedule.signature,
    weekday: schedule.weekday, hour: schedule.hour, minute: schedule.minute, timeZone: schedule.timeZone,
    triggerKind: schedule.triggerKind, triggerWeekday: schedule.triggerWeekday, triggerHour: schedule.triggerHour, triggerMinute: schedule.triggerMinute,
  };
}

function existingSchedule(request: Notifications.NotificationRequest): ExistingSchedule {
  const data = request.content.data;
  const base: ExistingSchedule = { identifier: request.identifier };
  if (!isReminderIdentifier(request.identifier) || data?.owner !== REMINDER_OWNER) return base;
  const { signature, reminderId, route, weekday, hour, minute, timeZone } = data;
  if (typeof signature !== 'string' || typeof reminderId !== 'string' || typeof route !== 'string' || !allowedRoutes.has(route as ReminderMessage['route'])
    || typeof weekday !== 'number' || !Number.isInteger(weekday) || weekday < 1 || weekday > 7
    || typeof hour !== 'number' || !Number.isInteger(hour) || hour < 0 || hour > 23
    || typeof minute !== 'number' || !Number.isInteger(minute) || minute < 0 || minute > 59
    || typeof timeZone !== 'string' || typeof request.content.title !== 'string' || typeof request.content.body !== 'string') return base;
  const triggerKind = data.triggerKind === 'calendar' ? 'calendar' : 'weekly';
  const triggerWeekday = data.triggerWeekday ?? weekday;
  const triggerHour = data.triggerHour ?? hour;
  const triggerMinute = data.triggerMinute ?? minute;
  if (typeof triggerWeekday !== 'number' || !Number.isInteger(triggerWeekday) || triggerWeekday < 1 || triggerWeekday > 7
    || typeof triggerHour !== 'number' || !Number.isInteger(triggerHour) || triggerHour < 0 || triggerHour > 23
    || typeof triggerMinute !== 'number' || !Number.isInteger(triggerMinute) || triggerMinute < 0 || triggerMinute > 59) return base;
  return {
    ...base, signature,
    recoverable: { identifier: request.identifier, signature, reminderId, route: route as ReminderMessage['route'], weekday, hour, minute, timeZone, triggerKind, triggerWeekday, triggerHour, triggerMinute, title: request.content.title, body: request.content.body },
  };
}

const gateway: ScheduleGateway = {
  list: async () => (await Notifications.getAllScheduledNotificationsAsync()).map(existingSchedule),
  cancel: identifier => Notifications.cancelScheduledNotificationAsync(identifier),
  schedule: async schedule => {
    await Notifications.scheduleNotificationAsync({
      identifier: schedule.identifier,
      content: { title: schedule.title, body: schedule.body, sound: 'default', data: dataFor(schedule) },
      trigger: schedule.triggerKind === 'calendar'
        ? { type: Notifications.SchedulableTriggerInputTypes.CALENDAR, timezone: schedule.timeZone, weekday: schedule.triggerWeekday, hour: schedule.triggerHour, minute: schedule.triggerMinute, second: 0, repeats: true }
        : { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: schedule.triggerWeekday, hour: schedule.triggerHour, minute: schedule.triggerMinute, channelId: REMINDER_CHANNEL },
    });
  },
};

function enqueue(work: () => Promise<void>): Promise<void> {
  const result = operation.then(work, work);
  operation = result.catch(() => undefined);
  return result;
}

function subscribe(listeners: ReminderListeners): () => void {
  let active = true;
  const open = (response: Notifications.NotificationResponse | null) => {
    if (!active || !response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const { request, date } = response.notification;
    const data = request.content.data;
    if (data?.owner !== REMINDER_OWNER || (!isReminderIdentifier(request.identifier) && request.identifier !== TEST_IDENTIFIER)
      || typeof data.route !== 'string' || !allowedRoutes.has(data.route as ReminderMessage['route'])) return;
    const key = `${request.identifier}:${date}`;
    if (key === handledResponse) return;
    handledResponse = key;
    Notifications.clearLastNotificationResponse();
    listeners.onOpen(data.route as ReminderMessage['route']);
  };
  const subscription = Notifications.addNotificationResponseReceivedListener(open);
  const initial = setTimeout(() => open(Notifications.getLastNotificationResponse()), 0);
  return () => { active = false; clearTimeout(initial); subscription.remove(); };
}

export const reminderDelivery: ReminderDelivery = {
  kind: 'native',
  getPermission: readPermission,
  requestPermission: async () => {
    await ensureChannel();
    const current = await readPermission();
    if (current.status === 'granted' || !current.canAskAgain) return current;
    await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
    return readPermission();
  },
  sync: reminders => enqueue(async () => {
    await ensureChannel();
    const permission = await readPermission();
    await syncReminderSchedules(permission.status === 'granted' ? reminders : [], gateway, { platform: Platform.OS === 'android' ? 'android' : 'ios' });
    if (permission.status !== 'granted') await Notifications.cancelScheduledNotificationAsync(TEST_IDENTIFIER);
  }),
  test: () => enqueue(async () => {
    await ensureChannel();
    if ((await readPermission()).status !== 'granted') throw new Error('Allow notifications in your device settings before sending a test reminder.');
    await Notifications.cancelScheduledNotificationAsync(TEST_IDENTIFIER);
    await Notifications.scheduleNotificationAsync({
      identifier: TEST_IDENTIFIER,
      content: { title: 'A little calm, right on time', body: 'Your Still reminders are ready. Take one slow breath for yourself.', sound: 'default', data: { owner: REMINDER_OWNER, route: '/breathing', test: true } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, repeats: false, channelId: REMINDER_CHANNEL },
    });
  }),
  subscribe,
  openSettings: () => Linking.openSettings(),
};
