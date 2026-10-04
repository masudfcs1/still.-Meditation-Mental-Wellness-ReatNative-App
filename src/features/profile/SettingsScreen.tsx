import { webToggleState } from "../../utils/accessibility";
import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { ArrowLeft, Check, CircleHelp, FileText, Globe2, Heart, Info, Leaf, MessageSquare, Monitor, Moon, ShieldCheck, Sun, Volume2 } from 'lucide-react-native';
import { Button, Card, Chip, IconButton, PageTitle, SectionHeading, T } from '../../components/ui';
import { fonts, useTheme } from '../../theme';
import { Navigate, ThemePreference } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { SettingsModal, SettingsRow } from './ProfilePrimitives';
import { ReminderSettings } from '../reminders/ReminderSettings';

type Dialog = 'sound' | 'language' | 'privacy' | 'about' | 'help' | 'terms' | 'feedback' | null;
const dialogTitles: Record<Exclude<Dialog, null>, string> = { sound: 'Your background sound', language: 'Language', privacy: 'Your space stays yours', about: 'A little about Still', help: 'Here to help', terms: 'Using Still', feedback: 'Your thoughts matter' };
const sounds = ['Forest', 'Rain', 'Ocean', 'Wind', 'Fireplace', 'White Noise', 'None'];

export function SettingsScreen({ onNavigate }: { onNavigate: Navigate }) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const theme = useAppStore(s => s.theme);
  const setTheme = useAppStore(s => s.setTheme);
  const backgroundSound = useAppStore(s => s.backgroundSound);
  const setBackgroundSound = useAppStore(s => s.setBackgroundSound);
  const volume = useAppStore(s => s.volume);
  const setVolume = useAppStore(s => s.setVolume);
  const feedbackDraft = useAppStore(s => s.feedbackDraft);
  const setFeedbackDraft = useAppStore(s => s.setFeedbackDraft);
  const notify = useAppStore(s => s.notify);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [feedback, setFeedback] = useState(feedbackDraft);
  const isWide = width >= 1000;
  const inputStyle = [styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.background }];
  function openDialog(next: Dialog) { if (next === 'feedback') setFeedback(feedbackDraft); setDialog(next); }

  return <View>
    <PageTitle eyebrow="Make yourself at home" title="Your preferences" subtitle="A few thoughtful details, shaped around you." right={<IconButton icon={ArrowLeft} label="Back to Profile" onPress={() => onNavigate('Profile')} />} />
    <View style={{ flexDirection: isWide ? 'row' : 'column', gap: 22 }}>
      <View style={{ flex: 1, gap: 22 }}>
        <ReminderSettings />
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
      {dialog === 'language' && <View><View style={[styles.note, { backgroundColor: t.primarySoft }]}><Globe2 size={21} color={t.primary} /><T weight="semibold" style={{ flex: 1 }}>English</T><Check size={19} color={t.primary} /></View><T size={13} color={t.secondary} style={{ marginTop: 16 }}>Still is currently available in English. Reminders follow Bangladesh time (UTC+6). Your practice history uses your device&apos;s local dates.</T></View>}
      {dialog === 'privacy' && <View style={{ gap: 17 }}><InfoParagraph title="Stored on your device" body="Your name, goals, saved practices, mood check-ins, reminders, and completed sessions are saved locally on this device." /><InfoParagraph title="No account required" body="This frontend preview has no sign-in, cloud database, or analytics tracking. Clearing this app’s stored data removes your personal settings and activity." /><InfoParagraph title="Your actual practice" body="Your progress comes from time practiced in the app, sessions you log, and dated mood check-ins saved on this device. New profiles start at zero; no demonstration activity is added to your history." /></View>}
      {dialog === 'about' && <View style={{ gap: 16 }}><View style={[styles.brandMark, { backgroundColor: t.primarySoft }]}><Leaf size={30} color={t.primary} /></View><T size={24} weight="display">Still</T><T size={13} color={t.secondary}>A little more space. A little more you.</T><T size={13} color={t.secondary}>Still brings meditation, breathing, sleep, and mindful progress together in one calm space. This is an interactive frontend preview with local data.</T><T size={11} color={t.muted}>Version 1.0.0 · Made with intention</T></View>}
      {dialog === 'help' && <View style={{ gap: 19 }}><InfoParagraph title="Start with a small moment" body="Open Explore, choose a practice, and tap play. You can pause, adjust background sound, or minimize the player while you browse." /><InfoParagraph title="Find your rhythm" body="Visit Breathing for a guided rhythm and choose a length. Completed practices are added to your local activity." /><InfoParagraph title="See your progress" body="Analytics lets you explore your activity over time. Choose a date or tap a chart to see the details of that day." /><InfoParagraph title="A gentle nudge" body="Choose a reminder time and repeat days in Settings, then turn it on. All reminders follow Bangladesh time (UTC+6). Allow notifications on your phone for reminders when Still is closed. In the browser, keep this tab open. Send a test reminder to try it in 5 seconds." /><InfoParagraph title="Make it personal" body="Choose a daily goal on your profile. Save your favorite practices with the heart button and find them in Favorites." /><Button label="Explore a practice" onPress={() => { setDialog(null); onNavigate('Explore'); }} /></View>}
      {dialog === 'terms' && <View style={{ gap: 17 }}><InfoParagraph title="A wellness companion" body="Still offers general mindfulness and relaxation experiences. It is not a medical service or a substitute for professional care." /><InfoParagraph title="An interactive preview" body="This version uses demonstration content and local storage. The iOS and Android app schedules local reminder notifications with your permission. Browser reminders need Still to stay open. No payment, account, or online service is included." /><InfoParagraph title="Practice at your own pace" body="Choose a comfortable place to practice, and never use guided sessions while driving. Stop or return to your normal breath whenever an exercise feels uncomfortable." /></View>}
      {dialog === 'feedback' && <View><T size={13} color={t.secondary} style={{ marginBottom: 18 }}>What would make this space better for you? Save a private draft on this device.</T><TextInput accessibilityLabel="Feedback draft" value={feedback} onChangeText={setFeedback} multiline textAlignVertical="top" maxLength={2000} placeholder="I would love to see…" placeholderTextColor={t.muted} style={[inputStyle, { minHeight: 160 }]} /><T size={10} color={t.muted} style={{ textAlign: 'right', marginTop: 7 }}>{feedback.length} / 2000</T><Button label="Save draft" disabled={!feedback.trim()} onPress={() => { setFeedbackDraft(feedback.trim()); setDialog(null); notify('Feedback draft saved on this device.'); }} style={{ marginTop: 17 }} /><T size={11} color={t.secondary} style={{ marginTop: 12, textAlign: 'center' }}>Your draft is saved locally and is not sent to anyone.</T></View>}
    </SettingsModal>
  </View>;
}

function InfoParagraph({ title, body }: { title: string; body: string }) { const t = useTheme(); return <View><T size={14} weight="semibold" style={{ marginBottom: 5 }}>{title}</T><T size={13} color={t.secondary} style={{ lineHeight: 22 }}>{body}</T></View>; }
const styles = StyleSheet.create({
  note: { padding: 14, borderRadius: 11, flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 12 },
  themeOption: { flex: 1, paddingVertical: 18, borderWidth: 1, borderRadius: 12, alignItems: 'center', gap: 8 },
  input: { borderWidth: 1, borderRadius: 11, padding: 14, minHeight: 50, fontFamily: fonts.regular, fontSize: 14 },
  brandMark: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
