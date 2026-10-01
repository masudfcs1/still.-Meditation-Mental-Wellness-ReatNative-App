import { webToggleState } from "../../utils/accessibility";
import React from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { ArrowUpRight, Check, CheckCheck, Flame, Plus, Play, ShieldCheck, Smile } from 'lucide-react-native';
import { Button, Card, IconButton, ProgressRing, T } from '../../components/ui';
import { PracticeProgress } from '../../components/PracticeProgress';
import { formatDuration, parseDate } from '../../utils/analytics';
import { useTodayKey } from '../../hooks/useLocalActivity';
import { useTheme } from '../../theme';
import { useAppStore } from '../../store/useAppStore';
import { ActivityDay, Mood, Navigate } from '../../types';

const moods: Mood[] = ['Wonderful', 'Good', 'Okay', 'Low', 'Stressed'];
export function MoodFace({ index, selected, color }: { index: number; selected?: boolean; color: string }) {
  return <Svg width={37} height={37} viewBox="0 0 40 40"><Circle cx={20} cy={20} r={17} stroke={color} strokeWidth={1.5} fill={selected ? color : 'none'} /><Path d={index === 0 ? 'M11 16q3-4 6 0M24 16q3-4 6 0' : 'M13 15v2M26 15v2'} stroke={selected ? '#FFFFFF' : color} strokeWidth={1.8} strokeLinecap="round" fill="none"/><Path d={index === 0 ? 'M12 23q8 12 16 0Z' : index === 1 ? 'M13 23q7 8 14 0' : index === 2 ? 'M14 26h12' : index === 3 ? 'M13 28q7-8 14 0' : 'M13 26q3-4 6 0t8 0'} stroke={selected ? '#FFFFFF' : color} strokeWidth={1.5} strokeLinecap="round" fill="none"/></Svg>;
}
export function MoodCard() {
  const t = useTheme(); const todayKey = useTodayKey(); const mood = useAppStore(s => s.moodDate === todayKey ? s.mood : null); const setMood = useAppStore(s => s.setMood);
  return <Card style={{ padding: 21 }}><View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 12 }}><Smile size={17} color={t.primary}/><T size={10} weight="semibold" color={t.secondary} style={{ letterSpacing: 1.25 }}>DAILY CHECK-IN</T></View><T size={17} weight="semibold" style={{ letterSpacing: -0.5 }}>How are you feeling?</T><T size={11} color={t.secondary} style={{ marginTop: 4 }}>Every feeling has a place here.</T><View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 3, marginTop: 22 }}>{moods.map((m, i) => <Pressable key={m} accessibilityRole="button" accessibilityLabel={`Feeling ${m}`} accessibilityState={{ selected: mood === m }} {...webToggleState(mood === m)} onPress={() => setMood(m)} style={({ pressed }) => ({ flex: 1, alignItems: 'center', gap: 7, opacity: pressed ? 0.6 : 1 })}><MoodFace index={i} selected={mood === m} color={mood === m ? t.primary : ['#91A07C', '#A6AA84', '#B5AD91', '#B8A292', '#AD9898'][i]}/><T size={8.5} color={mood === m ? t.primary : t.secondary} weight={mood === m ? 'semibold' : 'regular'}>{m}</T></Pressable>)}</View>{mood && <T accessibilityLiveRegion="polite" size={10} color={t.primary} style={{ marginTop: 12, textAlign: 'center' }}>Check-in saved. Thank you for showing up.</T>}</Card>;
}
export function GoalCard({ minutes, sessionCount, onNavigate, onLog, hydrated, storageError }: {
  minutes: number; sessionCount: number; onNavigate: Navigate; onLog: () => void;
  hydrated: boolean; storageError: string | null;
}) {
  const t = useTheme();
  const goal = useAppStore(s => s.dailyGoal);
  const playing = useAppStore(s => s.isPlaying);
  const activeSession = useAppStore(s => s.activeSession);
  const setPlayerExpanded = useAppStore(s => s.setPlayerExpanded);
  const reached = minutes >= goal;
  const percentage = Math.min(100, Math.floor(minutes / goal * 100));
  const remaining = Math.max(0, goal - minutes);
  return <Card style={{ padding: 21, borderColor: t.isDark ? t.border : '#DDE7D9' }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
      <View><T size={9} color={t.primary} weight="semibold" style={{ letterSpacing: 1.4 }}>TODAY, FOR YOU</T><T size={17} weight="semibold" style={{ marginTop: 4, letterSpacing: -0.4 }}>Your daily practice</T></View>
      <IconButton icon={ArrowUpRight} label="Change your daily goal" onPress={() => onNavigate('Profile')} size={17} />
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 21, marginBottom: 20 }}>
      <View style={{ flex: 1 }}><T size={minutes >= 60 ? 25 : 29} weight="semibold" style={{ letterSpacing: -1, fontVariant: ['tabular-nums'] }}>{hydrated ? formatDuration(minutes) : '—'}</T><T size={11} color={t.secondary} style={{ marginTop: 2 }}>of {goal} min daily goal</T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9 }}>
          <View style={{ height: 5, width: 5, borderRadius: 3, backgroundColor: playing ? t.primary : t.muted }} />
          <T size={10} color={playing ? t.primary : t.secondary}>{playing ? 'Practice in progress' : `${sessionCount} ${sessionCount === 1 ? 'practice' : 'practices'} today`}</T>
        </View>
      </View>
      <ProgressRing size={77} stroke={5} progress={minutes / goal}>
        {reached ? <CheckCheck size={23} color={t.primary} /> : <T size={19} weight="semibold" color={t.primary} style={{ letterSpacing: -0.7 }}>{percentage}<T size={10} color={t.primary}>%</T></T>}
      </ProgressRing>
    </View>
    <PracticeProgress minutes={minutes} goal={goal} />
    <T size={11} color={reached ? t.primary : t.secondary} weight={reached ? 'semibold' : 'regular'} style={{ marginTop: 11 }}>
      {!hydrated ? 'Loading your saved practice…' : reached ? 'Daily goal complete. Take this feeling with you.' : minutes > 0 ? `${formatDuration(remaining)} left. One quiet moment at a time.` : 'A fresh start. Every minute belongs to you.'}
    </T>
    <View style={{ flexDirection: 'row', gap: 8, marginTop: 19 }}>
      <Button label={activeSession ? 'Return' : 'Practice'} icon={Play} small onPress={() => activeSession ? setPlayerExpanded(true) : onNavigate('Meditate')} style={{ flex: 1, paddingHorizontal: 10 }} />
      <Button label="Log time" icon={Plus} variant="secondary" small onPress={onLog} style={{ flex: 1, paddingHorizontal: 10 }} />
    </View>
    <View style={{ borderTopWidth: 1, borderTopColor: t.border, marginTop: 18, paddingTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <ShieldCheck size={12} color={storageError ? t.danger : t.secondary} />
      <T size={9} color={storageError ? t.danger : t.secondary} style={{ flex: 1 }}>{storageError || (hydrated ? 'Your practice, saved on this device.' : 'Opening your practice journal…')}</T>
    </View>
  </Card>;
}

export function StreakCard({ streak, days }: { streak: number; days: ActivityDay[] }) {
  const t = useTheme();
  const today = useTodayKey();
  return <Card style={{ backgroundColor: t.primarySoft, borderColor: 'transparent', padding: 21 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ height: 38, width: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface }}><Flame size={21} color="#B68550" fill="#B6855020" /></View>
      <View style={{ flex: 1 }}><T size={18} weight="semibold" style={{ letterSpacing: -0.5 }}>{streak} day{streak === 1 ? '' : 's'} of practice</T><T size={10} color={t.secondary}>{streak ? 'Your current streak. Keep it gentle.' : 'Your first day is a good place to begin.'}</T></View>
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 19 }}>
      {days.map(day => {
        const active = day.minutes > 0;
        const isToday = day.date === today;
        const label = parseDate(day.date).toLocaleDateString('en-US', { weekday: 'narrow' });
        return <View key={day.date} accessible accessibilityLabel={`${parseDate(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}: ${active ? `${formatDuration(day.minutes)} practiced` : 'no practice yet'}`} style={{ alignItems: 'center', gap: 7 }}>
          <View style={{ width: 25, height: 25, borderRadius: 13, backgroundColor: active ? t.primary : t.surface, alignItems: 'center', justifyContent: 'center', borderWidth: isToday ? 1.5 : 0, borderColor: t.primary }}>
            {active ? <Check size={12} color={t.isDark ? '#203025' : '#fff'} /> : <View style={{ height: 3, width: 3, borderRadius: 2, backgroundColor: t.muted }} />}
          </View><T size={9} weight={isToday ? 'bold' : 'regular'} color={isToday ? t.primary : t.secondary}>{label}</T>
        </View>;
      })}
    </View>
  </Card>;
}

export function WeeklyCard({ days, onNavigate }: { days: ActivityDay[]; onNavigate: Navigate }) {
  const t = useTheme();
  const goal = useAppStore(s => s.dailyGoal);
  const total = days.reduce((sum, day) => sum + day.minutes, 0);
  const max = Math.max(goal, ...days.map(day => day.minutes));
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const selected = days.find(day => day.date === selectedDate);
  return <Card style={{ padding: 21 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><T size={15} weight="semibold">Your last seven days</T><IconButton icon={ArrowUpRight} onPress={() => onNavigate('Analytics')} label="View your analytics" size={16} /></View>
    <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 6, marginTop: 9 }}><T size={26} weight="semibold" style={{ letterSpacing: -1 }}>{formatDuration(selected ? selected.minutes : total)}</T><T size={10} color={t.secondary}>{selected ? parseDate(selected.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'of real practice'}</T></View>
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 105, gap: 13, marginTop: 10 }}>{days.map(day => <Pressable key={day.date} accessibilityRole="button" accessibilityLabel={`${day.date}: ${formatDuration(day.minutes)} practiced`} accessibilityState={{ selected: selectedDate === day.date }} {...webToggleState(selectedDate === day.date)} onPress={() => setSelectedDate(selectedDate === day.date ? null : day.date)} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 8 }}>
      <View style={{ width: '100%', maxWidth: 23, height: day.minutes ? Math.max(5, day.minutes / max * 76) : 3, borderRadius: 5, backgroundColor: day.minutes ? selectedDate === day.date || day.date === days[days.length - 1]?.date ? t.primary : t.isDark ? '#516849' : '#CBD8BE' : t.border }} />
      <T size={9} color={t.secondary}>{parseDate(day.date).toLocaleDateString('en-US', { weekday: 'narrow' })}</T>
    </Pressable>)}</View>
    {total === 0 && <T size={10} color={t.secondary} style={{ marginTop: 15 }}>Your practice will appear here as you make time for it.</T>}
  </Card>;
}
