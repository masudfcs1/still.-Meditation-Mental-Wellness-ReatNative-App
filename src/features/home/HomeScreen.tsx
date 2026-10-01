import { webToggleState } from "../../utils/accessibility";
import React, { useMemo, useState } from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bookmark, Clock3, Flower2, Leaf, Moon, Play, Sparkles, Sun, Wind } from 'lucide-react-native';
import { PageTitle, SectionHeading, T } from '../../components/ui';
import { MeditationCard } from '../../components/MeditationCard';
import { artwork, sessions } from '../../mock/content';
import { useLocalActivity } from '../../hooks/useLocalActivity';
import { LogPracticeModal } from '../practice/LogPracticeModal';
import { PracticeHistory } from '../practice/PracticeHistory';
import { getAnalyticsByRange, parseDate } from '../../utils/analytics';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../theme';
import { Navigate, ScreenName } from '../../types';
import { GoalCard, MoodCard, StreakCard, WeeklyCard } from './HomeCards';
import { JourneyCard } from './JourneyCard';

const quickActions: { label: string; subtitle: string; icon: typeof Flower2; route: ScreenName; color: string }[] = [
  { label: 'Meditate', subtitle: 'Find your calm', icon: Flower2, route: 'Meditate', color: '#EDF2E8' },
  { label: 'Breathe', subtitle: 'Take a moment', icon: Wind, route: 'Breathing', color: '#EAF1F0' },
  { label: 'Sleep', subtitle: 'Rest a little deeper', icon: Moon, route: 'Sleep', color: '#EEEAF5' },
  { label: 'Relax', subtitle: 'Let the day go', icon: Leaf, route: 'Explore', color: '#F6EDE4' },
  { label: 'Focus', subtitle: 'Clear your mind', icon: Sun, route: 'Explore', color: '#F4F0DE' },
];
export function HomeScreen({ onNavigate }: { onNavigate: Navigate }) {
  const t = useTheme(); const { width } = useWindowDimensions(); const wide = width >= 1180; const mobile = width < 600;
  const name = useAppStore(s => s.name); const favorites = useAppStore(s => s.favorites); const toggleFavorite = useAppStore(s => s.toggleFavorite); const startSession = useAppStore(s => s.startSession);
  const goal = useAppStore(s => s.dailyGoal); const lessons = useAppStore(s => s.completedLessons);
  const { activity, todayKey, hydrated, storageError } = useLocalActivity();
  const [logVisible, setLogVisible] = useState(false);
  const summary = useMemo(() => getAnalyticsByRange('7D', activity, goal, parseDate(todayKey)), [activity, goal, todayKey]);
  const today = summary.days[summary.days.length - 1];
  const date = new Date(); const hour = date.getHours(); const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return <View><PageTitle eyebrow={date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} title={`${greeting}, ${name}`} subtitle="Take a breath. Make a little space for yourself." right={!mobile ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, padding: 10 }}><Sun size={21} strokeWidth={1.4} color="#A39B65"/><T size={11} color={t.secondary}>A fresh moment awaits</T></View> : undefined}/>
    {!wide && <View style={{ marginBottom: 24 }}><GoalCard minutes={today?.minutes || 0} sessionCount={today?.sessions || 0} onNavigate={onNavigate} onLog={() => setLogVisible(true)} hydrated={hydrated} storageError={storageError} /></View>}
    <View style={{ flexDirection: wide ? 'row' : 'column', gap: 24, alignItems: 'flex-start' }}>
      <View style={{ flex: wide ? 1 : undefined, width: wide ? undefined : '100%', gap: 27 }}>
        <ImageBackground source={artwork.forest} imageStyle={{ borderRadius: 19 }} style={{ height: mobile ? 320 : 310, borderRadius: 19, overflow: 'hidden', backgroundColor: '#334334' }}>
          <LinearGradient colors={['rgba(22,43,31,0.85)', 'rgba(24,42,29,0.55)', 'rgba(22,43,31,0.06)']} start={{ x: 0, y: 0.6 }} end={{ x: 1, y: 0.3 }} style={StyleSheet.absoluteFill}/>
          <View style={{ padding: mobile ? 25 : 32, flex: 1, alignItems: 'flex-start' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5, backgroundColor: '#FFFFFF19', borderWidth: 1, borderColor: '#FFFFFF25' }}><Sparkles size={11} color="#F2F4E9"/><T size={8} color="#F2F4E9" weight="semibold" style={{ letterSpacing: 1.5 }}>YOUR DAILY DOSE OF CALM</T></View>
            <T size={mobile ? 33 : 37} weight="display" color="#FFFFFF" style={{ lineHeight: mobile ? 45 : 49, marginTop: 18, letterSpacing: -0.8 }}>A calmer mind.{ '\n' }A brighter day.</T>
            <T size={12} color="#D6E0D1" style={{ marginTop: 8 }}>Come back to yourself with Morning stillness.</T>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 'auto' }}><Pressable accessibilityRole="button" accessibilityLabel="Begin Morning stillness meditation" onPress={() => startSession(sessions[0])} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#FCFCF7', paddingHorizontal: 17, height: 43, borderRadius: 9, opacity: pressed ? 0.8 : 1 })}><Play size={14} color="#365640" fill="#365640"/><T size={11} weight="semibold" color="#365640">Begin your practice</T></Pressable><View style={{ gap: 3 }}><View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}><Clock3 size={11} color="#E3E8DF"/><T size={10} color="#E3E8DF">15 min</T></View><T size={9} color="#C3D0BE">with Sarah Mitchell</T></View></View>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Save Morning stillness" accessibilityState={{ selected: favorites.includes(sessions[0].id) }} {...webToggleState(favorites.includes(sessions[0].id))} onPress={() => toggleFavorite(sessions[0].id)} style={{ position: 'absolute', top: 24, right: 24, width: 35, height: 35, borderRadius: 18, backgroundColor: '#FFFFFF22', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FFFFFF26' }}><Bookmark size={15} color="#FFFFFF" fill={favorites.includes(sessions[0].id) ? '#FFFFFF' : 'none'}/></Pressable>
          <View style={{ position: 'absolute', bottom: 22, right: 24, flexDirection: 'row', gap: 5 }}><View style={{ width: 16, height: 4, backgroundColor: '#FFFFFF', borderRadius: 2 }}/><View style={{ width: 4, height: 4, backgroundColor: '#FFFFFF60', borderRadius: 2 }}/><View style={{ width: 4, height: 4, backgroundColor: '#FFFFFF60', borderRadius: 2 }}/></View>
        </ImageBackground>
        <View><SectionHeading title="A little space for you"/><View style={{ flexDirection: 'row', gap: mobile ? 8 : 12 }}>{quickActions.map((item, i) => <Pressable key={item.label} accessibilityRole="button" onPress={() => { if (item.label === 'Relax') startSession(sessions[1]); else if (item.label === 'Focus') startSession(sessions[2]); else onNavigate(item.route); }} style={({ pressed }) => ({ flex: 1, alignItems: 'center', gap: 10, paddingVertical: mobile ? 14 : 16, borderRadius: 13, borderWidth: 1, borderColor: pressed ? t.primary : t.border, backgroundColor: t.surface, opacity: pressed ? 0.75 : 1 })}><View style={{ width: mobile ? 37 : 42, height: mobile ? 37 : 42, borderRadius: 13, backgroundColor: t.isDark ? t.surfaceAlt : item.color, justifyContent: 'center', alignItems: 'center' }}><item.icon size={21} color={['#6C825E', '#729A91', '#9990AA', '#B18F73', '#AAA16D'][i]} strokeWidth={1.5}/></View><T size={mobile ? 10 : 11} weight="medium">{item.label}</T></Pressable>)}</View></View>
        {!wide && <MoodCard/>}
        <PracticeHistory limit={4} onLog={() => setLogVisible(true)}/>
        <View><SectionHeading title="Picked for your peace of mind" subtitle="A little inspiration for wherever you are today." action="View all" onAction={() => onNavigate('Explore')}/><View style={{ flexDirection: mobile ? 'column' : 'row', gap: 15 }}>{sessions.slice(1, 4).map(session => <MeditationCard key={session.id} session={session} compact={mobile} style={{ flex: mobile ? undefined : 1 }} />)}</View></View>
        <View><SectionHeading title="Your journey, one day at a time" action="All programs" onAction={() => onNavigate('Programs')}/><JourneyCard completedDays={lessons.mindfulness?.length || 0} onOpen={() => onNavigate('Programs')}/></View>
        <View><SectionHeading title="Come back to a little calm" subtitle="Familiar favorites, always here for you." action="Your library" onAction={() => onNavigate('Favorites')}/><View style={{ flexDirection: mobile ? 'column' : 'row', gap: 14 }}>{[sessions[4], sessions[5]].map(session => <Pressable accessibilityRole="button" accessibilityLabel={`Play ${session.title}`} key={session.id} onPress={() => startSession(session)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, padding: 12, gap: 12, borderRadius: 13 }}><Image source={session.image} style={{ width: 52, height: 52, borderRadius: 10 }}/><View style={{ flex: 1 }}><T size={11} weight="semibold">{session.title}</T><T size={9} color={t.secondary} style={{ marginTop: 4 }}>{session.duration} min · {session.category}</T></View><Play size={16} color={t.primary}/></Pressable>)}</View></View>
      </View>
      <View style={{ width: wide ? 286 : '100%', gap: 19 }}>{wide && <><GoalCard minutes={today?.minutes || 0} sessionCount={today?.sessions || 0} onNavigate={onNavigate} onLog={() => setLogVisible(true)} hydrated={hydrated} storageError={storageError}/><MoodCard/></>}<StreakCard streak={summary.currentStreak} days={summary.days}/><WeeklyCard days={summary.days} onNavigate={onNavigate}/><View style={{ alignItems: 'center', paddingHorizontal: 23, paddingTop: 9, paddingBottom: 8, gap: 9 }}><Leaf size={18} color={t.muted} strokeWidth={1.3}/><T size={13} weight="display" color={t.secondary} style={{ textAlign: 'center', lineHeight: 23 }}>“Almost everything will work again if you unplug it for a few minutes. Including you.”</T><T size={8} color={t.muted} style={{ letterSpacing: 1.3 }}>ANNE LAMOTT</T></View></View>
    </View>
    <LogPracticeModal visible={logVisible} onClose={() => setLogVisible(false)}/>
    <View style={{ alignItems: 'center', paddingTop: 35, paddingBottom: 2 }}><T size={10} color={t.muted}>A little stillness goes a long way.</T></View>
  </View>;
}
