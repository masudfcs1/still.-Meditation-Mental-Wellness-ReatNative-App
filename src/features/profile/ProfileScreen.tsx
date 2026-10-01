import React, { useState } from 'react';
import { StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { ArrowRight, Bell, BookHeart, Check, Clock3, Flame, Heart, Leaf, Pencil, Settings, Target, Volume2 } from 'lucide-react-native';
import { Button, Card, Chip, PageTitle, ProgressRing, SectionHeading, T } from '../../components/ui';
import { fonts, useTheme } from '../../theme';
import { Navigate } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { formatDuration } from '../../utils/analytics';
import { SettingsModal, SettingsRow } from './ProfilePrimitives';
import { useProfileStats } from './useProfileStats';

export function ProfileScreen({ onNavigate }: { onNavigate: Navigate }) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const name = useAppStore(s => s.name);
  const goal = useAppStore(s => s.dailyGoal);
  const setName = useAppStore(s => s.setName);
  const setGoal = useAppStore(s => s.setDailyGoal);
  const favorites = useAppStore(s => s.favorites);
  const notify = useAppStore(s => s.notify);
  const { stats, achievements, earned, todayKey, hydrated } = useProfileStats();
  const today = stats.days.find(day => day.date === todayKey);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [nameError, setNameError] = useState('');
  const isWide = width > 1000;
  function saveName() {
    const next = draftName.trim();
    if (next.length < 1) { setNameError('Please enter the name you would like us to use.'); return; }
    setName(next); setEditingName(false); notify('Your profile has been updated.');
  }

  if (!hydrated) return <View><PageTitle eyebrow="Your personal space" title="A practice that's yours." /><Card><T size={13} color={t.secondary}>Loading your saved progress…</T></Card></View>;

  return <View>
    <PageTitle eyebrow="Your personal space" title="A practice that's yours." subtitle="Small moments. Meaningful progress. All at your own pace." />
    <Card style={{ padding: width < 550 ? 20 : 28 }}>
      <View style={{ flexDirection: width < 550 ? 'column' : 'row', alignItems: width < 550 ? 'flex-start' : 'center', gap: 20 }}>
        <View style={[styles.avatar, { backgroundColor: t.primarySoft }]}><T size={28} weight="display" color={t.primaryDark}>{name.slice(0, 1).toUpperCase()}</T><View style={[styles.avatarLeaf, { backgroundColor: t.surface, borderColor: t.border }]}><Leaf size={14} color={t.primary} /></View></View>
        <View style={{ flex: 1 }}><T size={25} weight="semibold" style={{ letterSpacing: -0.7 }}>{name}</T><T size={12} color={t.secondary} style={{ marginTop: 4 }}>Making room for a little more stillness.</T><View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 10 }}><Check size={13} color={t.primary} /><T size={11} color={t.primary}>Your personal wellness journey</T></View></View>
        <Button label="Edit profile" icon={Pencil} variant="secondary" small onPress={() => { setDraftName(name); setNameError(''); setEditingName(true); }} />
      </View>
      <View style={[styles.stats, { borderColor: t.border }]}>{[{ label: 'Current streak', value: `${stats.currentStreak} days`, icon: Flame }, { label: 'Mindful time', value: formatDuration(stats.totalMinutes), icon: Clock3 }, { label: 'Sessions', value: stats.totalSessions.toLocaleString(), icon: Leaf }].map(item => <View key={item.label} style={{ flex: 1, gap: 5 }}><item.icon size={18} color={t.primary} strokeWidth={1.7} /><T size={width < 450 ? 20 : 25} weight="semibold" style={{ letterSpacing: -0.5 }}>{item.value}</T><T size={11} color={t.secondary}>{item.label}</T></View>)}</View>
    </Card>
    <View style={{ flexDirection: isWide ? 'row' : 'column', gap: 22, marginTop: 22 }}>
      <View style={{ flex: 1, gap: 22 }}>
        <Card>
          <SectionHeading title="Your daily intention" subtitle="Consistency starts with a goal that feels good." />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 22, marginBottom: 22 }}><ProgressRing progress={(today?.minutes || 0) / goal} size={90} stroke={7}><Target size={22} color={t.primary} /></ProgressRing><View style={{ flex: 1 }}><T size={25} weight="semibold" style={{ letterSpacing: -0.7 }}>{formatDuration(today?.minutes || 0)}<T size={14} color={t.secondary}> / {goal} min</T></T><T size={12} color={t.secondary}>of time for yourself today</T><T size={11} color={t.primary} style={{ marginTop: 6 }}>{(today?.minutes || 0) >= goal ? 'Your daily goal is complete.' : `${formatDuration(Math.max(0, goal - (today?.minutes || 0)))} left to your goal`}</T></View></View>
          <T size={11} color={t.secondary} style={{ marginBottom: 10 }}>DAILY GOAL</T><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{[5, 10, 15, 20, 30, 45, 60].map(minutes => <Chip key={minutes} label={`${minutes} min`} active={goal === minutes} onPress={() => { setGoal(minutes); notify(`Daily intention set to ${minutes} minutes.`); }} />)}</View>
        </Card>
        <Card>
          <SectionHeading title="Little milestones" subtitle={`${earned} of ${achievements.length} achievements collected`} action="View all" onAction={() => onNavigate('Achievements')} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', gap: 12, paddingVertical: 5 }}>{achievements.slice(0, 3).map(item => <View key={item.id} style={{ alignItems: 'center', flex: 1, gap: 9 }}><View style={[styles.badge, { backgroundColor: item.current >= item.target ? (item.color === 'peach' ? t.peach : t.primarySoft) : t.surfaceAlt, borderColor: t.border }]}><item.icon size={25} color={item.current >= item.target ? t.primary : t.muted} strokeWidth={1.4} /></View><T size={11} weight="medium" style={{ textAlign: 'center' }}>{item.title}</T><T size={9} color={t.secondary}>{item.current >= item.target ? 'Earned' : 'Not yet earned'}</T></View>)}</View>
          <View style={{ marginTop: 21, borderTopWidth: 1, borderColor: t.border, paddingTop: 16 }}><T size={12} color={t.secondary}>Every milestone is a reminder of the time you&apos;ve given yourself.</T></View>
        </Card>
      </View>
      <View style={{ flex: 1, gap: 22 }}>
        <Card>
          <SectionHeading title="Made for your rhythm" />
          <SettingsRow icon={Heart} title="Your favorites" caption="The practices you keep coming back to" value={`${favorites.length}`} onPress={() => onNavigate('Favorites')} />
          <SettingsRow icon={Bell} title="Meditation reminders" caption="A gentle nudge to pause" onPress={() => onNavigate('Settings')} />
          <SettingsRow icon={Volume2} title="Sound & appearance" caption="Create your own quiet space" onPress={() => onNavigate('Settings')} />
          <SettingsRow icon={Settings} title="Settings & preferences" caption="Make Still feel like you" onPress={() => onNavigate('Settings')} last />
        </Card>
        <Card style={{ backgroundColor: t.primarySoft, borderColor: t.primarySoft }}><View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 13 }}><BookHeart size={22} color={t.primary} strokeWidth={1.5} /><T size={16} weight="semibold" color={t.primaryDark} style={{ flex: 1 }}>A little time, for yourself.</T></View><T size={13} color={t.secondary} style={{ lineHeight: 22 }}>Your practice is more than a number. See the patterns, moments, and small steps that make it yours.</T><Button label="Explore your journey" icon={ArrowRight} variant="ghost" style={{ alignSelf: 'flex-start', paddingHorizontal: 0, marginTop: 10 }} onPress={() => onNavigate('Analytics')} /></Card>
      </View>
    </View>
    <SettingsModal title="What should we call you?" visible={editingName} onClose={() => setEditingName(false)}><T size={13} color={t.secondary} style={{ marginBottom: 20 }}>A little detail that makes this space your own.</T><T size={12} weight="medium" style={{ marginBottom: 7 }}>Your name</T><TextInput accessibilityLabel="Your name" value={draftName} onChangeText={text => { setDraftName(text); setNameError(''); }} maxLength={36} autoCapitalize="words" autoFocus returnKeyType="done" onSubmitEditing={saveName} style={[styles.input, { backgroundColor: t.background, borderColor: nameError ? t.danger : t.border, color: t.text }]} />{nameError ? <T size={12} color={t.danger} style={{ marginTop: 8 }}>{nameError}</T> : null}<Button label="Save changes" onPress={saveName} style={{ marginTop: 24 }} /></SettingsModal>
  </View>;
}

const styles = StyleSheet.create({
  avatar: { width: 82, height: 82, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarLeaf: { position: 'absolute', right: -3, bottom: -3, width: 27, height: 27, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stats: { borderTopWidth: 1, marginTop: 26, paddingTop: 24, flexDirection: 'row', gap: 12 },
  badge: { width: 64, height: 70, borderRadius: 23, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 14, fontFamily: fonts.regular, minHeight: 48 },
});
