import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, TextInput, useWindowDimensions, View } from 'react-native';
import { Bell, BellRing, Check, ChevronRight, Clock3, Moon, RefreshCw, Sun } from 'lucide-react-native';
import { Button, Card, Chip, SectionHeading, T } from '../../components/ui';
import { useAppStore } from '../../store/useAppStore';
import { fonts, useTheme } from '../../theme';
import type { Reminder } from '../../types';
import { webToggleState } from '../../utils/accessibility';
import { SettingsModal } from '../profile/ProfilePrimitives';
import {
  openReminderSettings,
  refreshReminders,
  requestReminderPermission,
  saveReminder,
  sendTestReminder,
  useReminderState,
} from './controller';
import { reminderDelivery } from './delivery';
import { formatTime, nextReminderDate, reminderClockParts, reminderDateKey, REMINDER_TIME_ZONE, REMINDER_TIME_ZONE_LABEL, repeatLabel, validateReminder } from './model';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const reminderTitles = ['Morning meditation', 'Evening wind-down', 'Mindful pause'];
const dayPresets = [
  { label: 'Every day', days: [0, 1, 2, 3, 4, 5, 6] },
  { label: 'Weekdays', days: [1, 2, 3, 4, 5] },
  { label: 'Weekends', days: [0, 6] },
];
const isWeb = reminderDelivery.kind === 'web';

function nextLabel(reminder: Reminder, now: Date): string {
  const next = nextReminderDate(reminder, now);
  if (!next) return 'Choose your repeat days';
  const nextDay = reminderDateKey(next);
  const date = nextDay === reminderDateKey(now)
    ? 'Today'
    : nextDay === reminderDateKey(new Date(now.getTime() + 86_400_000))
      ? 'Tomorrow'
      : next.toLocaleDateString('en-US', { timeZone: REMINDER_TIME_ZONE, weekday: 'short', month: 'short', day: 'numeric' });
  return `Next · ${date}, ${formatTime(reminder.time)}`;
}

export function ReminderSettings() {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const reminders = useAppStore(state => state.reminders);
  const hasHydrated = useAppStore(state => state.hasHydrated);
  const permission = useReminderState(state => state.permission);
  const busy = useReminderState(state => state.busy);
  const ready = useReminderState(state => state.ready);
  const error = useReminderState(state => state.error);
  const lastTestAt = useReminderState(state => state.lastTestAt);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [hour, setHour] = useState('07');
  const [minute, setMinute] = useState('30');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [formError, setFormError] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [testScheduled, setTestScheduled] = useState(false);
  const permissionGranted = permission?.status === 'granted';
  const canDeliver = isWeb || permissionGranted;
  const disabled = busy || !hasHydrated;
  const testRemaining = lastTestAt ? Math.max(0, Math.min(5, Math.ceil((lastTestAt + 5000 - now) / 1000))) : 0;
  const bangladeshClock = reminderClockParts(new Date(now));
  const bangladeshTime = formatTime(`${String(bangladeshClock.hour).padStart(2, '0')}:${String(bangladeshClock.minute).padStart(2, '0')}`);
  const dayRows = width < 440 ? [[0, 1, 2, 3], [4, 5, 6]] : [[0, 1, 2, 3, 4, 5, 6]];

  useEffect(() => {
    if (!lastTestAt) return;
    const timer = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= lastTestAt + 6000) clearInterval(timer);
    }, 500);
    return () => clearInterval(timer);
  }, [lastTestAt]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  function editReminder(reminder: Reminder) {
    const [savedHour, savedMinute] = reminder.time.split(':').map(Number);
    setEditing({ ...reminder, days: [...reminder.days] });
    setHour(String(savedHour % 12 || 12).padStart(2, '0'));
    setMinute(String(savedMinute).padStart(2, '0'));
    setPeriod(savedHour >= 12 ? 'PM' : 'AM');
    setFormError('');
  }

  async function saveChanges() {
    if (!editing || disabled) return;
    if (!/^\d{1,2}$/.test(hour) || Number(hour) < 1 || Number(hour) > 12 || !/^\d{1,2}$/.test(minute) || Number(minute) > 59) {
      setFormError('Enter an hour from 1 to 12 and minutes from 00 to 59.');
      return;
    }
    const next = {
      ...editing,
      time: `${String((Number(hour) % 12) + (period === 'PM' ? 12 : 0)).padStart(2, '0')}:${minute.padStart(2, '0')}`,
    };
    const validation = validateReminder(next);
    if (validation) {
      setFormError(validation);
      return;
    }
    setFormError('');
    if (await saveReminder(next)) {
      setNow(Date.now());
      setEditing(null);
    }
  }

  async function testReminder() {
    setTestScheduled(false);
    if (await sendTestReminder()) {
      setNow(Date.now());
      setTestScheduled(true);
    }
  }

  const statusTitle = error && !ready
    ? 'Reminders need your attention'
    : isWeb
      ? permissionGranted ? 'Browser notifications enabled' : 'Reminders in this tab'
      : permissionGranted ? 'Notifications are ready' : 'A small nudge, at the right time';
  const statusDescription = isWeb
    ? permissionGranted
      ? 'Your reminders appear here and as browser alerts. Keep this tab open for them to arrive.'
      : permission?.status === 'denied'
        ? 'Browser alerts are blocked. Your reminders still appear in Still while this tab is open.'
        : permission?.status === 'unavailable'
          ? 'Your reminders appear in Still while this tab is open. This browser does not support notification alerts.'
          : 'Your reminders appear in Still while this tab is open. Allow browser notifications for an alert outside the page, too.'
    : permissionGranted
      ? 'Your device will remind you on the days you choose, even when Still is closed.'
      : 'Allow notifications to receive your reminders when Still is closed. You choose the time and the days.';

  return <>
    <Card>
      <SectionHeading title="A gentle reminder" subtitle="A small promise to pause. Made on your terms." />
      <View style={[styles.statusPanel, { backgroundColor: t.primarySoft }]}>
        <View style={styles.statusHeading}>
          <View style={[styles.statusIcon, { backgroundColor: t.surface }]}><Bell size={19} color={t.primary} strokeWidth={1.6} /></View>
          <T size={13} weight="semibold" color={t.primaryDark} style={{ flex: 1 }}>{statusTitle}</T>
          {permissionGranted && <Check size={16} color={t.primary} />}
        </View>
        <T size={11} color={t.secondary} style={{ marginTop: 10, lineHeight: 18 }}>{statusDescription}</T>
        <View style={styles.currentTime}><Clock3 size={13} color={t.primary} /><T size={11} weight="medium" color={t.primary}>Bangladesh now · {bangladeshTime}</T></View>
        {!permissionGranted && permission?.status !== 'unavailable' && (isWeb ? permission?.status !== 'denied' : true) &&
          <Button
            label={!isWeb && permission?.status === 'denied' && !permission.canAskAgain ? 'Open notification settings' : isWeb ? 'Allow browser notifications' : 'Allow notifications'}
            variant="secondary"
            small
            disabled={disabled || !permission}
            onPress={() => { void (!isWeb && permission?.status === 'denied' && !permission.canAskAgain ? openReminderSettings() : requestReminderPermission()); }}
            style={[styles.permissionButton, { backgroundColor: t.surface }]}
          />}
        {isWeb && permission?.status === 'denied' && <T size={11} color={t.secondary} style={{ marginTop: 9 }}>To allow browser alerts, change this site&apos;s notification permission in your browser settings.</T>}
      </View>

      {reminders.map((reminder, index) => {
        const ReminderIcon = reminder.title === 'Evening wind-down' ? Moon : reminder.title === 'Morning meditation' ? Sun : Bell;
        const active = reminder.enabled && canDeliver && ready;
        return <View key={reminder.id} style={[styles.reminder, { borderBottomColor: t.border, borderBottomWidth: index === reminders.length - 1 ? 0 : 1 }]}>
          <View style={styles.rowBetween}>
            <View style={[styles.reminderIcon, { backgroundColor: t.surfaceAlt }]}><ReminderIcon size={18} color={t.primary} strokeWidth={1.5} /></View>
            <View style={{ flex: 1 }}><T size={13} weight="semibold">{reminder.title}</T><T size={11} color={t.secondary} style={{ marginTop: 3 }}>{repeatLabel(reminder)}</T></View>
            <View style={styles.switchTarget}><Switch accessibilityLabel={`${reminder.title} reminder`} accessibilityHint="Turn this repeating reminder on or off" disabled={disabled} value={reminder.enabled} onValueChange={enabled => { setNow(Date.now()); void saveReminder({ ...reminder, enabled }); }} trackColor={{ false: t.border, true: t.primary }} thumbColor={t.surface} /></View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit ${reminder.title}, ${formatTime(reminder.time)}, Bangladesh time`}
            disabled={disabled}
            accessibilityState={{ disabled }}
            onPress={() => editReminder(reminder)}
            style={({ pressed }) => [styles.editTime, { opacity: disabled ? 0.5 : pressed ? 0.6 : 1 }]}
          >
            <Clock3 size={16} color={t.primary} />
            <T size={24} weight="medium" style={{ letterSpacing: -0.8, flex: 1 }}>{formatTime(reminder.time)}</T>
            <T size={11} color={t.primary} weight="medium">Edit</T>
            <ChevronRight size={15} color={t.primary} />
          </Pressable>
          <View style={styles.scheduleLabel}>
            <View style={[styles.statusDot, { backgroundColor: active ? t.primary : t.muted }]} />
            <T size={10} color={active ? t.primary : t.secondary} style={{ flex: 1 }}>{!reminder.enabled ? 'Off · Your schedule is saved' : active ? nextLabel(reminder, new Date(now)) : !canDeliver ? 'Paused · Allow notifications to resume' : 'Waiting for the reminder schedule'}</T>
          </View>
        </View>;
      })}

      {error && <View style={[styles.errorPanel, { borderColor: t.danger }]}>
        <T accessibilityRole="alert" size={12} color={t.danger}>{error}</T>
        <Button label="Try again" variant="ghost" icon={RefreshCw} small disabled={disabled} onPress={() => { void refreshReminders(); }} style={{ alignSelf: 'flex-start', paddingHorizontal: 0, marginTop: 3 }} />
      </View>}

      <View style={[styles.testPanel, { borderTopColor: t.border }]}>
        <Button label={testRemaining > 0 ? `Test arriving in ${testRemaining}s` : 'Send a test reminder'} icon={BellRing} variant="secondary" small disabled={disabled || testRemaining > 0} onPress={() => { void testReminder(); }} />
        <T accessibilityLiveRegion="polite" size={10} color={t.secondary} style={{ textAlign: 'center', marginTop: 9 }}>{testScheduled ? 'Test requested. Your reminder should appear after 5 seconds.' : 'Try a gentle nudge. It arrives after 5 seconds.'}</T>
      </View>
      <T size={10} color={t.secondary} style={styles.footerNote}>{REMINDER_TIME_ZONE_LABEL}{'\n'}{isWeb ? 'For reminders with Still closed, use the iOS or Android app.' : 'Focus modes and battery settings may delay or silence alerts.'}</T>
    </Card>

    <SettingsModal title="Make time for yourself" visible={editing !== null} onClose={() => { if (!busy) setEditing(null); }}>
      {editing && <View>
        <T size={12} color={t.secondary} style={{ marginBottom: 12 }}>What would you like a moment for?</T>
        <View style={styles.chips}>{reminderTitles.map(title => <Chip key={title} label={title} active={editing.title === title} onPress={() => { if (!busy) setEditing({ ...editing, title }); }} />)}</View>

        <T size={12} weight="semibold" style={{ marginTop: 25, marginBottom: 10 }}>Time in Bangladesh</T>
        <View style={styles.timeEditor}>
          <TextInput accessibilityLabel="Reminder hour, 1 to 12" value={hour} onChangeText={value => { setHour(value.replace(/\D/g, '')); setFormError(''); }} editable={!busy} keyboardType="number-pad" maxLength={2} selectTextOnFocus placeholder="07" placeholderTextColor={t.muted} style={[styles.timeInput, { color: t.text, backgroundColor: t.surfaceAlt, borderColor: t.border }]} />
          <T size={28} color={t.secondary}>:</T>
          <TextInput accessibilityLabel="Reminder minutes, 00 to 59" value={minute} onChangeText={value => { setMinute(value.replace(/\D/g, '')); setFormError(''); }} editable={!busy} keyboardType="number-pad" maxLength={2} selectTextOnFocus placeholder="30" placeholderTextColor={t.muted} style={[styles.timeInput, { color: t.text, backgroundColor: t.surfaceAlt, borderColor: t.border }]} />
          <View style={[styles.period, { borderColor: t.border }]}>{(['AM', 'PM'] as const).map(value => <Pressable key={value} accessibilityRole="button" accessibilityLabel={value === 'AM' ? 'Morning, AM' : 'Afternoon or evening, PM'} accessibilityState={{ selected: period === value, disabled: busy }} {...webToggleState(period === value)} disabled={busy} onPress={() => { setPeriod(value); setFormError(''); }} style={({ pressed }) => [styles.periodOption, { backgroundColor: period === value ? t.primary : t.surface, opacity: pressed ? 0.7 : 1 }]}><T size={12} weight="semibold" color={period === value ? (t.isDark ? '#203025' : '#fff') : t.secondary}>{value}</T></Pressable>)}</View>
        </View>
        <T size={10} color={t.secondary} style={{ marginTop: 7 }}>{REMINDER_TIME_ZONE_LABEL}</T>

        <T size={12} weight="semibold" style={{ marginTop: 25, marginBottom: 12 }}>Repeat on</T>
        <View style={styles.chips}>{dayPresets.map(preset => <Chip key={preset.label} label={preset.label} active={editing.days.length === preset.days.length && preset.days.every(day => editing.days.includes(day))} onPress={() => { if (!busy) { setFormError(''); setEditing({ ...editing, days: [...preset.days] }); } }} />)}</View>
        <View style={{ gap: 6, marginTop: 13 }}>{dayRows.map((row, index) => <View key={index} style={styles.dayRow}>{row.map(day => {
          const selected = editing.days.includes(day);
          return <Pressable key={day} accessibilityRole="button" accessibilityLabel={dayNames[day]} accessibilityState={{ selected, disabled: busy }} {...webToggleState(selected)} disabled={busy} onPress={() => { setFormError(''); setEditing({ ...editing, days: selected ? editing.days.filter(value => value !== day) : [...editing.days, day].sort((a, b) => a - b) }); }} style={({ pressed }) => [styles.day, { backgroundColor: selected ? t.primary : t.surfaceAlt, opacity: pressed ? 0.7 : 1 }]}><T size={11} weight="semibold" color={selected ? (t.isDark ? '#203025' : '#fff') : t.secondary}>{dayNames[day].slice(0, 2)}</T></Pressable>;
        })}</View>)}</View>

        <View style={[styles.enableRow, { backgroundColor: t.surfaceAlt }]}>
          <View style={{ flex: 1 }}><T size={12} weight="semibold">Turn on this reminder</T><T size={10} color={t.secondary} style={{ marginTop: 3 }}>Repeat at your chosen time each week.</T></View>
          <View style={styles.switchTarget}><Switch accessibilityLabel="Turn on this reminder" value={editing.enabled} disabled={busy} onValueChange={enabled => setEditing({ ...editing, enabled })} trackColor={{ false: t.border, true: t.primary }} thumbColor={t.surface} /></View>
        </View>
        {(formError || error) && <T accessibilityRole="alert" size={12} color={t.danger} style={{ marginTop: 14 }}>{formError || error}</T>}
        <Button label={busy ? 'Saving reminder…' : 'Save reminder'} disabled={disabled} onPress={() => { void saveChanges(); }} style={{ marginTop: 22 }} />
        <T size={10} color={t.secondary} style={{ marginTop: 11, textAlign: 'center' }}>You can change your schedule or turn it off whenever you like.</T>
      </View>}
    </SettingsModal>
  </>;
}

const styles = StyleSheet.create({
  statusPanel: { borderRadius: 12, padding: 15, marginBottom: 6 },
  statusHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  currentTime: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, flexWrap: 'wrap' },
  permissionButton: { marginTop: 12, alignSelf: 'flex-start', paddingHorizontal: 13 },
  reminder: { paddingVertical: 21 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reminderIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  switchTarget: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  editTime: { marginTop: 12, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9 },
  scheduleLabel: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  errorPanel: { padding: 13, borderWidth: 1, borderRadius: 11, marginBottom: 15 },
  testPanel: { paddingTop: 19, borderTopWidth: 1 },
  footerNote: { textAlign: 'center', marginTop: 17, lineHeight: 17 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  timeEditor: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInput: { flex: 1, minWidth: 52, minHeight: 68, borderRadius: 11, borderWidth: 1, textAlign: 'center', fontFamily: fonts.medium, fontSize: 29, padding: 7 },
  period: { flexDirection: 'row', borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  periodOption: { minWidth: 44, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  dayRow: { flexDirection: 'row', gap: 6 },
  day: { flex: 1, minWidth: 44, minHeight: 44, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  enableRow: { padding: 13, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24 },
});
