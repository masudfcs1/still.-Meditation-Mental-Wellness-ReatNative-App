import { webToggleState } from "../../utils/accessibility";
import React, { useState } from 'react';
import { Pressable, StyleSheet, Switch, TextInput, useWindowDimensions, View } from 'react-native';
import { ArrowLeft, Bell, Check, ChevronRight, CircleHelp, Clock3, FileText, Globe2, Heart, Info, Leaf, MessageSquare, Monitor, Moon, ShieldCheck, Sun, Volume2 } from 'lucide-react-native';
import { Button, Card, Chip, IconButton, PageTitle, SectionHeading, T } from '../../components/ui';
import { fonts, useTheme } from '../../theme';
import { Navigate, Reminder, ThemePreference } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { SettingsModal, SettingsRow } from './ProfilePrimitives';

type Dialog = 'sound' | 'language' | 'privacy' | 'about' | 'help' | 'terms' | 'feedback' | null;
const dialogTitles: Record<Exclude<Dialog, null>, string> = { sound: 'Your background sound', language: 'Language', privacy: 'Your space stays yours', about: 'A little about Still', help: 'Here to help', terms: 'Using Still', feedback: 'Your thoughts matter' };
const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const sounds = ['Forest', 'Rain', 'Ocean', 'Wind', 'Fireplace', 'White Noise', 'None'];
const displayTime = (time: string) => { const [hour, minute] = time.split(':').map(Number); return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`; };
const repeatLabel = (reminder: Reminder) => reminder.days.length === 7 ? 'Every day' : reminder.days.length === 0 ? 'No repeat days' : reminder.days.map(day => dayNames[day].slice(0, 3)).join(' · ');

export function SettingsScreen({ onNavigate }: { onNavigate: Navigate }) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const theme = useAppStore(s => s.theme);
  const setTheme = useAppStore(s => s.setTheme);
  const reminders = useAppStore(s => s.reminders);
  const updateReminder = useAppStore(s => s.updateReminder);
  const backgroundSound = useAppStore(s => s.backgroundSound);
  const setBackgroundSound = useAppStore(s => s.setBackgroundSound);
  const volume = useAppStore(s => s.volume);
  const setVolume = useAppStore(s => s.setVolume);
  const feedbackDraft = useAppStore(s => s.feedbackDraft);
  const setFeedbackDraft = useAppStore(s => s.setFeedbackDraft);
  const notify = useAppStore(s => s.notify);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [reminderError, setReminderError] = useState('');
  const [feedback, setFeedback] = useState(feedbackDraft);
  const isWide = width >= 1000;
  const inputStyle = [styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.background }];
  function openDialog(next: Dialog) { if (next === 'feedback') setFeedback(feedbackDraft); setDialog(next); }
  function saveReminder() {
    if (!editingReminder) return;
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(editingReminder.time)) { setReminderError('Use a time from 00:00 to 23:59, for example 07:30.'); return; }
    if (editingReminder.days.length === 0) { setReminderError('Choose at least one day for your reminder.'); return; }
    updateReminder(editingReminder.id, editingReminder); setEditingReminder(null); notify('Your reminder preferences have been saved.');
  }

  return <View>
    <PageTitle eyebrow="Make yourself at home" title="Your preferences" subtitle="A few thoughtful details, shaped around you." right={<IconButton icon={ArrowLeft} label="Back to Profile" onPress={() => onNavigate('Profile')} />} />
    <View style={{ flexDirection: isWide ? 'row' : 'column', gap: 22 }}>
      <View style={{ flex: 1, gap: 22 }}>
        <Card>
          <SectionHeading title="A gentle reminder" subtitle="Make a little space in your everyday." />
          {reminders.map((reminder, index) => <View key={reminder.id} style={{ paddingVertical: 18, borderBottomWidth: index === reminders.length - 1 ? 0 : 1, borderColor: t.border }}>
            <View style={styles.rowBetween}><View style={{ flex: 1 }}><T size={13} weight="semibold">{reminder.title}</T><T size={11} color={t.secondary} style={{ marginTop: 4 }}>{repeatLabel(reminder)}</T></View><Switch accessibilityLabel={`${reminder.title} reminder`} value={reminder.enabled} onValueChange={enabled => updateReminder(reminder.id, { enabled })} trackColor={{ false: t.border, true: t.primary }} thumbColor={t.surface} /></View>
            <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${reminder.title}, ${displayTime(reminder.time)}`} onPress={() => { setReminderError(''); setEditingReminder({ ...reminder, days: [...reminder.days] }); }} style={({ pressed }) => ({ marginTop: 15, flexDirection: 'row', alignItems: 'center', gap: 8, opacity: pressed ? 0.6 : 1, minHeight: 44 })}><Clock3 size={16} color={t.primary} /><T size={23} weight="medium" style={{ letterSpacing: -0.7 }}>{displayTime(reminder.time)}</T><T size={11} color={t.secondary} style={{ flex: 1, textAlign: 'right' }}>Edit</T><ChevronRight size={15} color={t.secondary} /></Pressable>
          </View>)}
          <View style={[styles.note, { backgroundColor: t.surfaceAlt }]}><Bell size={15} color={t.secondary} /><T size={11} color={t.secondary} style={{ flex: 1 }}>Saved on this device. This preview does not send scheduled notifications.</T></View>
        </Card>
        <Card>
          <SectionHeading title="Set the atmosphere" subtitle="A softer light. A familiar sound." />
          <T size={11} color={t.secondary} style={{ marginBottom: 12, letterSpacing: 0.8 }}>APPEARANCE</T>
          <View style={{ flexDirection: 'row', gap: 10 }}>{([{ value: 'light', label: 'Light', icon: Sun }, { value: 'dark', label: 'Dark', icon: Moon }, { value: 'system', label: 'System', icon: Monitor }] satisfies { value: ThemePreference; label: string; icon: typeof Sun }[]).map(item => <Pressable key={item.value} accessibilityRole="button" accessibilityState={{ selected: theme === item.value }} {...webToggleState(theme === item.value)} onPress={() => setTheme(item.value)} style={({ pressed }) => [styles.themeOption, { borderColor: theme === item.value ? t.primary : t.border, backgroundColor: theme === item.value ? t.primarySoft : t.surface, opacity: pressed ? 0.7 : 1 }]}><item.icon size={22} color={theme === item.value ? t.primary : t.secondary} strokeWidth={1.6} /><T size={12} weight="medium" color={theme === item.value ? t.primary : t.secondary}>{item.label}</T>{theme === item.value && <View style={{ position: 'absolute', top: 7, right: 7 }}><Check size={11} color={t.primary} /></View>}</Pressable>)}</View>
          <View style={{ marginTop: 16 }}><SettingsRow icon={Volume2} title="Background sound" value={backgroundSound} onPress={() => openDialog('sound')} /><SettingsRow icon={Globe2} title="Language" value="English" onPress={() => openDialog('language')} last /></View>
        </Card>
      </View>
      <View style={{ flex: 1, gap: 22 }}>
        <Card>
          <SectionHeading title="A little support" />
          <SettingsRow icon={ShieldCheck} title="Privacy" caption="How your information stays local" onPress={() => openDialog('privacy')} />
          <SettingsRow icon={CircleHelp} title="Help & getting started" caption="Find your way around Still" onPress={() => openDialog('help')} />
          <SettingsRow icon={MessageSquare} title="Share your thoughts" caption="Keep a note for the Still team" onPress={() => openDialog('feedback')} />
          <SettingsRow icon={FileText} title="Terms of use" onPress={() => openDialog('terms')} />
          <SettingsRow icon={Info} title="About Still" value="1.0.0" onPress={() => openDialog('about')} last />
        </Card>
        <Card style={{ backgroundColor: t.primarySoft, borderColor: t.primarySoft, alignItems: 'center', paddingVertical: 35 }}><Leaf size={31} color={t.primary} strokeWidth={1.2} /><T size={27} weight="display" color={t.primaryDark} style={{ marginTop: 12 }}>Room to be you.</T><T size={12} color={t.secondary} style={{ textAlign: 'center', marginTop: 10, maxWidth: 290 }}>A calmer mind begins with a little kindness. Thank you for making time for yourself.</T><View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 23 }}><T size={10} color={t.secondary} style={{ letterSpacing: 1.4 }}>MADE WITH INTENTION</T><Heart size={11} color={t.primary} /></View></Card>
      </View>
    </View>
    <SettingsModal title={dialog ? dialogTitles[dialog] : ''} visible={dialog !== null} onClose={() => setDialog(null)}>
      {dialog === 'sound' && <View style={{ gap: 14 }}><T size={13} color={t.secondary}>Choose the sound that feels like your kind of quiet. This becomes your default when a session starts.</T><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 5 }}>{sounds.map(sound => <Chip key={sound} label={sound} active={backgroundSound === sound} onPress={() => setBackgroundSound(sound)} />)}</View><T size={12} weight="medium" style={{ marginTop: 16 }}>Default volume</T><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{[0, 0.25, 0.5, 0.75, 1].map(level => <Chip key={level} label={`${level * 100}%`} active={Math.abs(volume - level) < 0.01} onPress={() => setVolume(level)} />)}</View><Button label="Done" style={{ marginTop: 16 }} onPress={() => setDialog(null)} /></View>}
      {dialog === 'language' && <View><View style={[styles.note, { backgroundColor: t.primarySoft }]}><Globe2 size={21} color={t.primary} /><T weight="semibold" style={{ flex: 1 }}>English</T><Check size={19} color={t.primary} /></View><T size={13} color={t.secondary} style={{ marginTop: 16 }}>Still is currently available in English. The dates and times follow your device&apos;s local time.</T></View>}
      {dialog === 'privacy' && <View style={{ gap: 17 }}><InfoParagraph title="Stored on your device" body="Your name, goals, saved practices, mood check-ins, reminders, and completed sessions are saved locally on this device." /><InfoParagraph title="No account required" body="This frontend preview has no sign-in, cloud database, or analytics tracking. Clearing this app’s stored data removes your personal settings and activity." /><InfoParagraph title="Your actual practice" body="Your progress comes from time practiced in the app, sessions you log, and dated mood check-ins saved on this device. New profiles start at zero; no demonstration activity is added to your history." /></View>}
      {dialog === 'about' && <View style={{ gap: 16 }}><View style={[styles.brandMark, { backgroundColor: t.primarySoft }]}><Leaf size={30} color={t.primary} /></View><T size={24} weight="display">Still</T><T size={13} color={t.secondary}>A little more space. A little more you.</T><T size={13} color={t.secondary}>Still brings meditation, breathing, sleep, and mindful progress together in one calm space. This is an interactive frontend preview with local data.</T><T size={11} color={t.muted}>Version 1.0.0 · Made with intention</T></View>}
      {dialog === 'help' && <View style={{ gap: 19 }}><InfoParagraph title="Start with a small moment" body="Open Explore, choose a practice, and tap play. You can pause, adjust background sound, or minimize the player while you browse." /><InfoParagraph title="Find your rhythm" body="Visit Breathing for a guided rhythm and choose a length. Completed practices are added to your local activity." /><InfoParagraph title="See your progress" body="Analytics lets you explore your activity over time. Choose a date or tap a chart to see the details of that day." /><InfoParagraph title="Make it personal" body="Choose a daily goal on your profile. Save your favorite practices with the heart button and find them in Favorites." /><Button label="Explore a practice" onPress={() => { setDialog(null); onNavigate('Explore'); }} /></View>}
      {dialog === 'terms' && <View style={{ gap: 17 }}><InfoParagraph title="A wellness companion" body="Still offers general mindfulness and relaxation experiences. It is not a medical service or a substitute for professional care." /><InfoParagraph title="An interactive preview" body="This version uses demonstration content and local storage. Reminders save your preferences without scheduling notifications. No payment, account, or online service is included." /><InfoParagraph title="Practice at your own pace" body="Choose a comfortable place to practice, and never use guided sessions while driving. Stop or return to your normal breath whenever an exercise feels uncomfortable." /></View>}
      {dialog === 'feedback' && <View><T size={13} color={t.secondary} style={{ marginBottom: 18 }}>What would make this space better for you? Save a private draft on this device.</T><TextInput accessibilityLabel="Feedback draft" value={feedback} onChangeText={setFeedback} multiline textAlignVertical="top" maxLength={2000} placeholder="I would love to see…" placeholderTextColor={t.muted} style={[inputStyle, { minHeight: 160 }]} /><T size={10} color={t.muted} style={{ textAlign: 'right', marginTop: 7 }}>{feedback.length} / 2000</T><Button label="Save draft" disabled={!feedback.trim()} onPress={() => { setFeedbackDraft(feedback.trim()); setDialog(null); notify('Feedback draft saved on this device.'); }} style={{ marginTop: 17 }} /><T size={11} color={t.secondary} style={{ marginTop: 12, textAlign: 'center' }}>Your draft is saved locally and is not sent to anyone.</T></View>}
    </SettingsModal>
    <SettingsModal title="Make time for yourself" visible={editingReminder !== null} onClose={() => setEditingReminder(null)}>
      {editingReminder && <View><T size={12} color={t.secondary} style={{ marginBottom: 10 }}>REMINDER TYPE</T><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{['Morning meditation', 'Evening wind-down', 'Mindful pause'].map(title => <Chip key={title} label={title} active={editingReminder.title === title} onPress={() => setEditingReminder({ ...editingReminder, title })} />)}</View><T size={12} weight="medium" style={{ marginTop: 24, marginBottom: 8 }}>Time · 24-hour format</T><TextInput accessibilityLabel="Reminder time in 24-hour format" value={editingReminder.time} onChangeText={time => { setEditingReminder({ ...editingReminder, time }); setReminderError(''); }} placeholder="07:30" placeholderTextColor={t.muted} maxLength={5} autoCorrect={false} style={[inputStyle, { fontSize: 24, letterSpacing: 1 }]} /><T size={12} weight="medium" style={{ marginTop: 22, marginBottom: 12 }}>Repeat on</T><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{days.map((label, day) => { const selected = editingReminder.days.includes(day); return <Pressable key={day} accessibilityRole="button" accessibilityLabel={dayNames[day]} accessibilityState={{ selected }} {...webToggleState(selected)} onPress={() => { setReminderError(''); setEditingReminder({ ...editingReminder, days: selected ? editingReminder.days.filter(value => value !== day) : [...editingReminder.days, day].sort() }); }} style={({ pressed }) => ({ width: 44, minHeight: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? t.primary : t.surfaceAlt, opacity: pressed ? 0.7 : 1 })}><T size={12} weight="semibold" color={selected ? (t.isDark ? '#203025' : '#fff') : t.secondary}>{label}</T></Pressable>; })}</View>{reminderError ? <T accessibilityRole="alert" size={12} color={t.danger} style={{ marginTop: 14 }}>{reminderError}</T> : null}<Button label="Save reminder" onPress={saveReminder} style={{ marginTop: 26 }} /></View>}
    </SettingsModal>
  </View>;
}

function InfoParagraph({ title, body }: { title: string; body: string }) { const t = useTheme(); return <View><T size={14} weight="semibold" style={{ marginBottom: 5 }}>{title}</T><T size={13} color={t.secondary} style={{ lineHeight: 22 }}>{body}</T></View>; }
const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'space-between' },
  note: { padding: 14, borderRadius: 11, flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 12 },
  themeOption: { flex: 1, paddingVertical: 18, borderWidth: 1, borderRadius: 12, alignItems: 'center', gap: 8 },
  input: { borderWidth: 1, borderRadius: 11, padding: 14, minHeight: 50, fontFamily: fonts.regular, fontSize: 14 },
  brandMark: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
