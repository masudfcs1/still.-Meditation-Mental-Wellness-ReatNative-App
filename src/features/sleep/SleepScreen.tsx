import { webToggleState } from "../../utils/accessibility";
import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { ArrowRight, Clock3, Heart, Moon, MoonStar, Play, Sparkles, Timer } from 'lucide-react-native';
import { Button, Card, Chip, PageTitle, SectionHeading, T } from '../../components/ui';
import { MeditationCard } from '../../components/MeditationCard';
import { artwork, sessions } from '../../mock/content';
import { useLocalActivity } from '../../hooks/useLocalActivity';
import { useAppStore } from '../../store/useAppStore';
import { formatDuration, getAnalyticsByRange, parseDate } from '../../utils/analytics';
import { useTheme } from '../../theme';
import { Navigate } from '../../types';
import { sleepSounds, sleepSoundSession } from './data';

export function SleepScreen({ onNavigate }: { onNavigate: Navigate }) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const available = width >= 1000 ? width - 280 : width;
  const [category, setCategory] = useState('For you');
  const sleepTimer = useAppStore(s => s.sleepTimer);
  const setSleepTimer = useAppStore(s => s.setSleepTimer);
  const startSession = useAppStore(s => s.startSession);
  const { activity, todayKey, hydrated } = useLocalActivity();
  const favorites = useAppStore(s => s.favorites);
  const toggleFavorite = useAppStore(s => s.toggleFavorite);
  const setBackgroundSound = useAppStore(s => s.setBackgroundSound);
  const weeklyActivity = useMemo(() => getAnalyticsByRange('7D', activity, 20, parseDate(todayKey)), [activity, todayKey]);
  const minutes = weeklyActivity.sleepMinutes;
  const nights = weeklyActivity.days.filter(day => day.sleepMinutes > 0).length;
  const sleepMeditations = sessions.filter(s => s.category === 'Sleep' && s.id !== 'sleep-story');
  const sleepStories = sessions.filter(s => s.id === 'sleep-story');
  const featured = sessions.find(s => s.id === 'restful-sleep')!;
  return <View>
    <PageTitle eyebrow="REST IS PART OF THE JOURNEY" title="Let the day gently fade." subtitle="A softer landing for your mind. A little more room for rest." right={available > 600 ? <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: t.lavender, alignItems: 'center', justifyContent: 'center' }}><MoonStar size={23} color={t.isDark ? '#BDB2DF' : '#8B80A7'} /></View> : undefined} />
    <View style={styles.hero}><Image source={artwork.night} resizeMode="cover" style={styles.coverImage} /><View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(17,26,44,0.5)' }]} /><View style={[styles.heroContent, { padding: available < 500 ? 26 : 35 }]}><View style={{ flexDirection: 'row', gap: 7, alignItems: 'center' }}><Sparkles size={14} color="#E6E5D9" /><T size={9} color="#E6E5D9" weight="semibold" style={{ letterSpacing: 1.7 }}>TONIGHT, JUST REST</T></View><T size={available < 500 ? 29 : 35} color="#FFF" weight="display" style={{ letterSpacing: -0.8, marginTop: 16, lineHeight: available < 500 ? 38 : 45 }}>You’ve done enough.{'\n'}It’s time to unwind.</T><T size={12} color="#D5DBDE" style={{ marginTop: 12, maxWidth: 330 }}>A gentle guided practice to soften your thoughts and welcome a more peaceful night.</T><View style={{ flexDirection: 'row', gap: 17, alignItems: 'center', marginTop: 25, flexWrap: 'wrap' }}><Button label="Drift into sleep" icon={Play} onPress={() => startSession(featured)} style={{ backgroundColor: t.isDark ? '#2B4036' : '#F1F0E6' }} variant="secondary" /><View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Clock3 size={12} color="#D5DBDE" /><T size={11} color="#D5DBDE">30 min · Sarah Mitchell</T></View></View></View></View>
    <View style={{ flexDirection: available < 680 ? 'column' : 'row', gap: 20, marginBottom: 30 }}>
      <Card style={{ flex: available < 680 ? undefined : 1, flexDirection: 'row', alignItems: 'center', gap: 17, padding: 22 }}><View style={{ width: 45, height: 45, borderRadius: 14, backgroundColor: t.lavender, alignItems: 'center', justifyContent: 'center' }}><Moon size={21} color={t.isDark ? '#BDB2DF' : '#8B80A7'} /></View><View style={{ flex: 1 }}><T size={10} color={t.secondary} weight="medium">YOUR EVENING PRACTICE · THIS WEEK</T><View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 18, rowGap: 2, marginTop: 6 }}><T size={21} weight="semibold" style={{ letterSpacing: -0.6 }}>{hydrated ? formatDuration(minutes) : '…'}<T size={11} color={t.secondary}> of rest</T></T><T size={21} weight="semibold" style={{ letterSpacing: -0.6 }}>{nights}<T size={11} color={t.secondary}> {nights === 1 ? 'day' : 'days'}</T></T></View></View></Card>
      <Card style={{ flex: available < 680 ? undefined : 1, padding: 22 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 13 }}><Timer size={16} color={t.primary} /><T size={12} weight="semibold">Sleep timer</T><T size={10} color={t.secondary} style={{ flex: 1, textAlign: 'right' }}>Gently stop playback</T></View><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>{[null, 10, 20, 30, 45, 60].map(value => <Pressable key={value || 'off'} accessibilityRole="button" accessibilityLabel={value ? `Set sleep timer to ${value} minutes` : 'Stop at the end of the session'} accessibilityState={{ selected: sleepTimer === value }} {...webToggleState(sleepTimer === value)} onPress={() => setSleepTimer(value)} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 7, backgroundColor: sleepTimer === value ? t.primary : t.surfaceAlt }}><T size={10} color={sleepTimer === value ? (t.isDark ? '#203025' : '#fff') : t.secondary} weight="medium">{value ? `${value} min` : 'End of session'}</T></Pressable>)}</View></Card>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginBottom: 26 }}>{['For you', 'Sleep meditations', 'Sleep stories', 'Soundscapes'].map(value => <Chip key={value} label={value} active={category === value} onPress={() => setCategory(value)} />)}</ScrollView>
    {(category === 'For you' || category === 'Soundscapes') && <View style={{ marginBottom: 30 }}><SectionHeading title="Sounds to settle into" subtitle="Close your eyes. Let the world become a little quieter." /><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>{sleepSounds.map(sound => {
      const id = `sleep-sound:${sound.id}`;
      const saved = favorites.includes(id);
      return <View key={sound.id} style={{ width: available >= 880 ? '23.5%' : available >= 460 ? '47.5%' : '100%', borderRadius: 15, overflow: 'hidden', height: 192, backgroundColor: sound.color }}><Pressable accessibilityRole="button" accessibilityLabel={`Play ${sound.title}`} onPress={() => { setBackgroundSound(sound.sound); startSession(sleepSoundSession(sound, sleepTimer || 30)); }} style={{ flex: 1 }}><Image source={sound.image} style={styles.coverImage} resizeMode="cover" /><View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(17,30,34,0.3)' }]} /><View style={{ position: 'absolute', bottom: 19, left: 18, right: 12 }}><T size={16} color="#FFF" weight="semibold">{sound.title}</T><View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 4 }}><Play size={10} color="#ECEFEE" fill="#ECEFEE" /><T size={10} color="#ECEFEE">{sleepTimer || 30} min soundscape</T></View></View></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`${saved ? 'Remove' : 'Save'} ${sound.title}`} accessibilityState={{ selected: saved }} {...webToggleState(saved)} hitSlop={5} onPress={event => { event.stopPropagation(); toggleFavorite(id); }} style={{ position: 'absolute', right: 10, top: 10, borderRadius: 19, width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' }}><Heart size={16} color="#4E7257" fill={saved ? '#4E7257' : 'transparent'} /></Pressable></View>;
    })}</View></View>}
    {(category === 'For you' || category === 'Sleep meditations') && <View style={{ marginBottom: 29 }}><SectionHeading title="Ease into a restful night" subtitle="Gentle guidance for a mind that’s ready to slow down." /><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 18 }}>{sleepMeditations.map(session => <MeditationCard key={session.id} session={session} compact={available > 600} style={{ width: '100%' }} />)}</View></View>}
    {(category === 'For you' || category === 'Sleep stories') && <View style={{ marginBottom: 29 }}><SectionHeading title="A story to dream with" subtitle="Wander somewhere peaceful, without leaving your pillow." />{sleepStories.map(session => <MeditationCard key={session.id} session={session} compact={available > 600} style={{ width: '100%' }} />)}</View>}
    <Card style={{ backgroundColor: t.lavender, borderWidth: 0, flexDirection: available < 550 ? 'column' : 'row', gap: 20, alignItems: available < 550 ? 'flex-start' : 'center' }}><View style={{ flex: 1 }}><T size={17} weight="semibold" style={{ letterSpacing: -0.4 }}>Make rest a gentle ritual.</T><T size={12} color={t.secondary} style={{ marginTop: 7 }}>Build your evening routine with our 7-day sleep journey.</T></View><Button label="Explore the journey" variant="secondary" icon={ArrowRight} onPress={() => onNavigate('Programs')} /></Card>
  </View>;
}

const styles = StyleSheet.create({ coverImage: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }, hero: { minHeight: 310, borderRadius: 19, overflow: 'hidden', marginBottom: 22, backgroundColor: '#273348' }, heroContent: { maxWidth: 570 } });
