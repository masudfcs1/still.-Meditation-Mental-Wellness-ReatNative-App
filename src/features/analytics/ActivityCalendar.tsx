import { webToggleState } from "../../utils/accessibility";
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { CalendarDays, Check, ChevronLeft, ChevronRight, Flame, Moon, Wind } from 'lucide-react-native';
import { Card, IconButton, T } from '../../components/ui';
import { useTheme } from '../../theme';
import { ActivityDay } from '../../types';
import { addDays, dateKey, emptyDay, fillDays, formatDate, formatDuration, moodLabel, parseDate } from '../../utils/analytics';

interface CalendarProps {
  activity: ActivityDay[];
  month: string;
  selectedDate: string;
  dailyGoal: number;
  todayKey: string;
  onMonthChange: (month: string) => void;
  onDateSelect: (date: string) => void;
}

export function ActivityCalendar({ activity, month, selectedDate, dailyGoal, todayKey, onMonthChange, onDateSelect }: CalendarProps) {
  const t = useTheme();
  const current = parseDate(month);
  const today = todayKey;
  const first = new Date(current.getFullYear(), current.getMonth(), 1, 12);
  const last = new Date(current.getFullYear(), current.getMonth() + 1, 0, 12);
  const selected = activity.find(day => day.date === selectedDate) || emptyDay(selectedDate);
  const activityMap = new Map(activity.map(day => [day.date, day]));
  const offset = (first.getDay() + 6) % 7;
  const totalSlots = Math.ceil((offset + last.getDate()) / 7) * 7;
  const previousDisabled = month.slice(0, 7) <= (activity[0]?.date || today).slice(0, 7);
  const nextDisabled = month.slice(0, 7) >= today.slice(0, 7);
  const changeMonth = (direction: number) => onMonthChange(dateKey(new Date(current.getFullYear(), current.getMonth() + direction, 1, 12)));

  return <Card style={{ flex: 1 }}>
    <View style={styles.heading}><View style={styles.titleWithIcon}><CalendarDays size={17} color={t.primary} /><T size={16} weight="semibold">Your mindful days</T></View><T size={10} color={t.secondary}>Select a day</T></View>
    <View style={[styles.monthRow, { marginTop: 12 }]}><T size={13} weight="semibold">{first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</T><View style={{ flexDirection: 'row' }}><IconButton icon={ChevronLeft} label="Previous month" onPress={() => !previousDisabled && changeMonth(-1)} size={16} style={{ width: 36, opacity: previousDisabled ? 0.25 : 1 }} /><IconButton icon={ChevronRight} label="Next month" onPress={() => !nextDisabled && changeMonth(1)} size={16} style={{ width: 36, opacity: nextDisabled ? 0.25 : 1 }} /></View></View>
    <View style={styles.calendarGrid}>
      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => <View key={`${day}-${index}`} style={[styles.calendarCell, { minHeight: 29 }]}><T size={10} weight="medium" color={t.muted}>{day}</T></View>)}
      {Array.from({ length: totalSlots }, (_, index) => {
        const dayNumber = index - offset + 1;
        const valid = dayNumber > 0 && dayNumber <= last.getDate();
        const key = valid ? dateKey(new Date(first.getFullYear(), first.getMonth(), dayNumber, 12)) : '';
        const record = activityMap.get(key);
        const active = !!record && record.minutes > 0;
        const selected = key === selectedDate;
        const future = key > today;
        return <View key={index} style={styles.calendarCell}>{valid && <Pressable accessibilityRole="button" accessibilityState={{ selected, disabled: future }} {...webToggleState(selected)} aria-disabled={future} accessibilityLabel={`${formatDate(key, { month: 'long', day: 'numeric' })}, ${formatDuration(record?.minutes || 0)} of meditation${(record?.minutes || 0) >= dailyGoal ? ', goal complete' : ''}`} disabled={future} onPress={() => onDateSelect(key)} style={({ pressed }) => [styles.dateButton, { backgroundColor: selected ? t.primary : active ? t.primarySoft : 'transparent', opacity: future ? 0.25 : pressed ? 0.65 : 1 }]}><T size={11} weight={active || selected ? 'semibold' : 'regular'} color={selected ? (t.isDark ? '#203025' : '#FFFFFF') : t.text}>{dayNumber}</T><View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: active ? (selected ? (t.isDark ? '#203025' : '#FFFFFF') : t.chart) : 'transparent', marginTop: 1 }} /></Pressable>}</View>;
      })}
    </View>
    <View style={[styles.daySummary, { borderTopColor: t.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><T size={11} weight="semibold">{formatDate(selectedDate, { weekday: 'short', month: 'short', day: 'numeric' })}</T>{selected.minutes >= dailyGoal ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Check size={12} color={t.primary} /><T size={10} color={t.primary}>Goal complete</T></View> : <T size={10} color={t.secondary}>{selected.minutes ? `${Math.floor(selected.minutes / dailyGoal * 100)}% of daily goal` : 'No practice recorded'}</T>}</View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, gap: 8 }}><View><T size={21} weight="semibold" style={{ letterSpacing: -0.5 }}>{formatDuration(selected.minutes)}</T><T size={10} color={t.secondary}>{selected.sessions} recorded sessions</T></View><View style={{ alignItems: 'flex-end' }}><T size={12} weight="medium">{moodLabel(selected.mood)}</T><View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 }}><Wind size={11} color={t.secondary} /><T size={10} color={t.secondary}>{formatDuration(selected.breathingMinutes)}</T><Moon size={11} color={t.secondary} style={{ marginLeft: 5 }} /><T size={10} color={t.secondary}>{formatDuration(selected.sleepMinutes)}</T></View></View></View>
    </View>
  </Card>;
}

export function StreakHeatmap({ activity, currentStreak, longestStreak, dailyGoal, todayKey, onDateSelect }: { activity: ActivityDay[]; currentStreak: number; longestStreak: number; dailyGoal: number; todayKey: string; onDateSelect: (date: string) => void }) {
  const t = useTheme();
  const end = parseDate(todayKey);
  const start = addDays(end, -91 - ((end.getDay() + 6) % 7));
  const days = fillDays(activity, start, end);
  const weeks = Array.from({ length: Math.ceil(days.length / 7) }, (_, i) => days.slice(i * 7, i * 7 + 7));
  const shades = t.isDark ? ['#2C3B30', '#40573D', '#617E52', '#8DAB74', '#B8CF9E'] : ['#EDF1E8', '#DCE7CE', '#B8CDA3', '#8CAC74', '#587B4D'];
  const level = (minutes: number) => minutes === 0 ? 0 : Math.min(4, Math.max(1, Math.ceil(minutes / dailyGoal * 2)));

  return <View>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}><View style={[styles.flameBadge, { backgroundColor: t.peach }]}><Flame size={24} strokeWidth={1.6} color={t.isDark ? '#D7B08D' : '#B89777'} /></View><View><T size={22} weight="semibold" style={{ letterSpacing: -0.7 }}>{currentStreak} day streak</T><T size={11} color={t.secondary}>{currentStreak ? 'A little time, one day at a time.' : 'Your next practice can be day one.'}</T></View></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 19 }} contentContainerStyle={{ gap: 4 }}>
      <View style={{ width: 21, paddingTop: 17, justifyContent: 'space-between', paddingBottom: 2 }}><T size={8} color={t.muted}>Mon</T><T size={8} color={t.muted}>Wed</T><T size={8} color={t.muted}>Fri</T><T size={8} color={t.muted}>Sun</T></View>
      {weeks.map((week, i) => <View key={week[0].date} style={{ gap: 4 }}><T size={8} color={t.secondary} style={{ height: 13, width: 16, overflow: 'visible' }}>{i === 0 || parseDate(week[0].date).getDate() <= 7 ? formatDate(week[0].date, { month: 'short' }) : ''}</T>{week.map(day => <Pressable key={day.date} accessibilityRole="button" accessibilityLabel={`${formatDate(day.date)}, ${formatDuration(day.minutes)} of mindful practice`} onPress={() => onDateSelect(day.date)} style={({ pressed }) => ({ width: 16, height: 13, borderRadius: 3, backgroundColor: shades[level(day.minutes)], opacity: pressed ? 0.6 : 1 })} />)}</View>)}
    </ScrollView>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, gap: 10 }}><T size={10} color={t.secondary}>Longest streak <T size={10} weight="semibold">{longestStreak} days</T></T><View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><T size={8} color={t.muted} style={{ marginRight: 3 }}>Less</T>{shades.map(color => <View key={color} style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: color }} />)}<T size={8} color={t.muted} style={{ marginLeft: 3 }}>More</T></View></View>
  </View>;
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  titleWithIcon: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarCell: { width: '14.285714%', minHeight: 39, alignItems: 'center', justifyContent: 'center' },
  dateButton: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  daySummary: { borderTopWidth: 1, marginTop: 13, paddingTop: 15 },
  flameBadge: { width: 49, height: 49, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
});
