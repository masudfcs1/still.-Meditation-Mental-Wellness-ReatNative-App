import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, useWindowDimensions, View } from 'react-native';
import { ArrowUpRight, CalendarDays, Clock3, Flame, Leaf, Moon, Sparkles, Target, Wind, type LucideIcon } from 'lucide-react-native';
import { Button, Card, PageTitle, ProgressRing, T } from '../../components/ui';
import { useLocalActivity } from '../../hooks/useLocalActivity';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../theme';
import { AnalyticsRange, Navigate } from '../../types';
import { dateKey, formatDate, formatDuration, formatMinutes, getAnalyticsByRange, normalizeActivity, parseDate } from '../../utils/analytics';
import { ActivityChart, ChangePill } from './ActivityChart';
import { ActivityCalendar, StreakHeatmap } from './ActivityCalendar';
import { CategoryDonut, MoodTrend } from './WellnessCharts';
import { LogPracticeModal } from '../practice/LogPracticeModal';

const ranges: AnalyticsRange[] = ['7D', '1M', '3M', '6M', '1Y', 'ALL'];
const rangeLabels: Record<AnalyticsRange, string> = { '7D': 'Last 7 days', '1M': '1 month', '3M': '3 months', '6M': '6 months', '1Y': '1 year', ALL: 'All' };

function StatCard({ title, value, unit, icon: Icon, tint, footer, change }: { title: string; value: string; unit?: string; icon: LucideIcon; tint: string; footer?: string; change?: number | null }) {
  const t = useTheme();
  const compact = useWindowDimensions().width < 400;
  return <Card style={{ flex: 1, padding: compact ? 14 : 20, minWidth: 0 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5 }}><T size={11} color={t.secondary} style={{ flex: 1 }}>{title}</T><View style={{ width: 31, height: 31, backgroundColor: tint, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}><Icon size={15} color={t.primary} strokeWidth={1.6} /></View></View>
    <T size={compact ? (value.length > 6 ? 18 : 23) : 28} weight="semibold" style={{ letterSpacing: -0.8, marginTop: 8 }} numberOfLines={1} adjustsFontSizeToFit>{value}{unit && <T size={compact ? 10 : 12} color={t.secondary}> {unit}</T>}</T>
    <View style={{ marginTop: 9 }}>{change !== undefined ? <ChangePill percent={change} /> : <T size={10} color={t.secondary}>{footer}</T>}</View>
  </Card>;
}

export function AnalyticsScreen({ onNavigate }: { onNavigate: Navigate }) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const [range, setRange] = useState<AnalyticsRange>('7D');
  const [compare, setCompare] = useState(false);
  const [logging, setLogging] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dateKey());
  const [month, setMonth] = useState(dateKey());
  const dailyGoal = useAppStore(state => state.dailyGoal);
  const { activity, todayKey, hydrated, storageError } = useLocalActivity();
  const dailyActivity = useMemo(() => normalizeActivity(activity), [activity]);
  const analytics = useMemo(() => getAnalyticsByRange(range, activity, dailyGoal, parseDate(todayKey)), [range, activity, dailyGoal, todayKey]);
  const wide = width >= 1120;
  const compact = width < 600;
  const fourStats = width >= 1000;
  const todayMinutes = dailyActivity.find(day => day.date === todayKey)?.minutes || 0;
  const hasPractice = dailyActivity.some(day => day.minutes > 0);
  const canCompare = range !== 'ALL' && analytics.previousMinutes > 0;
  const selectDay = (date: string) => { setSelectedDate(date); setMonth(date); };
  const crossesYear = analytics.start.slice(0, 4) !== analytics.end.slice(0, 4);
  const periodText = `${formatDate(analytics.start, { month: 'short', day: 'numeric', year: crossesYear ? 'numeric' : undefined })} – ${formatDate(analytics.end, { month: 'short', day: 'numeric', year: 'numeric' })}`;

  if (!hydrated) return <View><PageTitle eyebrow="Your wellness, in perspective" title="Your mindful journey" /><Card><T size={13} color={t.secondary}>Loading your saved practice…</T></Card></View>;

  return <View>
    <PageTitle eyebrow="Your wellness, in perspective" title="Your mindful journey" subtitle="A clear picture of the time you make for yourself." right={width > 800 ? <View style={[styles.titleTag, { backgroundColor: t.primarySoft }]}><Sparkles size={13} color={t.primary} /><T size={11} weight="medium" color={t.primary}>{storageError ? 'Storage needs attention' : 'Saved on this device'}</T></View> : undefined} />
    {storageError && <Card style={{ marginBottom: 18, padding: 16 }}><T size={12} color={t.danger}>Your device couldn’t save or load progress. Visit Home to review the storage message before continuing.</T></Card>}
    <Card style={{ marginBottom: 22, minWidth: 0, padding: compact ? 18 : 24 }}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, minWidth: 150 }}><T size={21} weight="semibold" style={{ letterSpacing: -0.5 }}>Time for yourself</T><T size={12} color={t.secondary} style={{ marginTop: 5 }}>{range === '7D' || range === '1M' ? 'Every day, a little space for you.' : range === '3M' || range === '6M' ? 'Your practice, one week at a time.' : 'See how your practice grows, month by month.'}</T></View>
        {!compact && <Button label="Log a practice" variant="secondary" small onPress={() => setLogging(true)} />}
      </View>
      <View style={styles.periodRow}>
        <View accessibilityRole="tablist" accessibilityLabel="Practice date range" style={[styles.rangeSelector, { backgroundColor: t.surfaceAlt, borderColor: t.border }, compact && { width: '100%' }]}>{ranges.map(item => <Pressable key={item} accessibilityRole="tab" accessibilityLabel={rangeLabels[item]} accessibilityState={{ selected: range === item }} aria-selected={range === item} onPress={() => setRange(item)} hitSlop={4} style={({ pressed }) => [styles.rangeTab, compact && { flexBasis: '31%', minWidth: 0, paddingHorizontal: 4 }, { backgroundColor: range === item ? t.primary : 'transparent', opacity: pressed ? 0.65 : 1 }]}><T size={10} weight={range === item ? 'semibold' : 'medium'} color={range === item ? (t.isDark ? '#203025' : '#FFFFFF') : t.secondary}>{rangeLabels[item]}</T></Pressable>)}</View>
        <View style={styles.dateLabel}><CalendarDays size={13} color={t.secondary} /><T size={11} color={t.secondary}>{periodText}</T></View>
      </View>
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 9, flexWrap: 'wrap' }}><T size={28} weight="semibold" style={{ letterSpacing: -1 }}>{formatDuration(analytics.totalMinutes)}</T><T size={11} color={t.secondary}>across {analytics.activeDays} {analytics.activeDays === 1 ? 'active day' : 'active days'}</T></View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, opacity: canCompare ? 1 : 0.4 }}><T size={10} color={t.secondary}>Compare</T><Switch accessibilityLabel={canCompare ? 'Compare with previous period' : 'Comparison available after a previous period of practice'} value={compare && canCompare} onValueChange={setCompare} disabled={!canCompare} aria-disabled={!canCompare} trackColor={{ false: t.border, true: t.chart }} thumbColor="#FFFFFF" style={{ transform: [{ scale: 0.7 }], marginRight: -5, marginLeft: -5 }} /></View>
      </View>
      <View style={{ marginTop: 14 }}><ActivityChart key={range} points={analytics.points} previousPoints={analytics.previousPoints} dailyGoal={dailyGoal} compare={compare && canCompare} onSelect={point => selectDay(point.endDate)} /></View>
      <View style={[styles.chartFootnote, { borderTopColor: t.border }]}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: t.chart }} /><T size={10} color={t.secondary}>{range === '7D' || range === '1M' ? 'Daily totals' : range === '3M' || range === '6M' ? 'Weekly totals' : 'Monthly totals'} · Tap a date to explore</T></View><T size={10} color={t.secondary}>{analytics.goalDays} {analytics.goalDays === 1 ? 'goal' : 'goals'} reached</T></View>
      {compact && <Button label="Log a practice" variant="secondary" small onPress={() => setLogging(true)} style={{ marginTop: 16 }} />}
    </Card>

    <View style={[styles.stats, { flexDirection: fourStats ? 'row' : 'column' }]}>
      <View style={styles.statPair}><StatCard title="Mindful time" value={formatDuration(analytics.totalMinutes)} icon={Clock3} tint={t.primarySoft} change={range === 'ALL' ? undefined : analytics.changePercent ?? undefined} footer={analytics.totalMinutes ? 'Time you practiced this period' : 'Your practice will appear here'} /><StatCard title="Sessions recorded" value={String(analytics.totalSessions)} icon={Leaf} tint={t.lavender} change={range === 'ALL' ? undefined : analytics.sessionChangePercent ?? undefined} footer={analytics.totalSessions ? 'From your local practice history' : 'Ready when you are'} /></View>
      <View style={styles.statPair}><StatCard title="Daily average" value={formatDuration(analytics.dailyAverage)} icon={Target} tint={t.blue} footer={`Across ${analytics.days.length} days in this period`} /><StatCard title="Current streak" value={String(analytics.currentStreak)} unit={analytics.currentStreak === 1 ? 'day' : 'days'} icon={Flame} tint={t.peach} footer={analytics.longestStreak ? `Your longest streak is ${analytics.longestStreak} ${analytics.longestStreak === 1 ? 'day' : 'days'}.` : 'Begin with one mindful moment'} /></View>
    </View>

    {analytics.totalMinutes === 0 && <Card style={{ marginBottom: 22, backgroundColor: t.primarySoft, borderColor: t.primarySoft }}><View style={{ flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'center' : 'flex-start', gap: 18 }}><View style={{ flex: 1 }}><T size={18} weight="semibold">{hasPractice ? 'A little space for a fresh start.' : 'Your first moment starts here.'}</T><T size={12} color={t.secondary} style={{ marginTop: 5, maxWidth: 520 }}>{hasPractice ? 'No practice is recorded in this period. Choose another range or make time for a new session.' : 'Start a timed practice or log a session. Your actual time, daily goals, and progress will grow here.'}</T></View><Button label="Begin a practice" icon={Leaf} onPress={() => onNavigate('Meditate')} small /></View></Card>}

    <View style={[styles.row, { flexDirection: wide ? 'row' : 'column' }]}>
      <View style={{ flex: 1, minWidth: 0 }}><ActivityCalendar activity={dailyActivity} month={month} selectedDate={selectedDate} dailyGoal={dailyGoal} todayKey={todayKey} onMonthChange={setMonth} onDateSelect={setSelectedDate} /></View>
      <Card style={{ flex: 1, minWidth: 0 }}>
        <T size={16} weight="semibold" style={{ marginBottom: 19 }}>Consistency over perfection</T>
        <StreakHeatmap activity={dailyActivity} currentStreak={analytics.currentStreak} longestStreak={analytics.longestStreak} dailyGoal={dailyGoal} todayKey={todayKey} onDateSelect={selectDay} />
        <View style={[styles.goalSection, { borderTopColor: t.border }]}>
          <View style={{ flex: 1 }}><T size={13} weight="semibold">Your daily intention</T><T size={11} color={t.secondary} style={{ marginTop: 5 }}>{todayMinutes >= dailyGoal ? 'You made space for yourself today.' : `${formatDuration(dailyGoal - todayMinutes)} left for your goal today.`}</T><Pressable accessibilityRole="button" onPress={() => onNavigate('Profile')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 37, marginTop: 2 }}><T size={10} color={t.primary} weight="semibold">Adjust your goal</T><ArrowUpRight size={12} color={t.primary} /></Pressable></View>
          <ProgressRing progress={todayMinutes / dailyGoal} size={85} stroke={6}><T size={17} weight="semibold">{formatMinutes(todayMinutes)}<T size={10} color={t.secondary}>/{dailyGoal}</T></T><T size={8} color={t.secondary}>MIN TODAY</T></ProgressRing>
        </View>
        <View style={[styles.goalFooter, { backgroundColor: t.primarySoft }]}><Target size={14} color={t.primary} /><T size={11} color={t.primary} style={{ flex: 1 }}>You reached your goal on <T size={11} weight="semibold" color={t.primary}>{analytics.goalDays} of {analytics.days.length} days</T> this period.</T></View>
      </Card>
    </View>

    <View style={[styles.row, { flexDirection: wide ? 'row' : 'column' }]}>
      <View style={{ flex: 1, minWidth: 0 }}><CategoryDonut key={range} categories={analytics.categories} totalMinutes={analytics.totalMinutes} /></View>
      <MoodTrend points={analytics.points} averageMood={analytics.averageMood} onCheckIn={() => onNavigate('Home')} />
    </View>
    <View style={styles.row}>
      <Card style={{ flex: 1, minWidth: 0 }}>
        <T size={16} weight="semibold">A well-rounded practice</T><T size={11} color={t.secondary} style={{ marginTop: 3 }}>Different ways to find your balance</T>
        <View style={{ flexDirection: 'row', gap: 14, marginTop: 22 }}>
          <View style={[styles.practiceMetric, { backgroundColor: t.blue }]}><Wind size={20} strokeWidth={1.5} color={t.primary} /><T size={21} weight="semibold" style={{ marginTop: 10, letterSpacing: -0.6 }}>{formatDuration(analytics.breathingMinutes)}</T><T size={10} color={t.secondary}>Breathing practice</T></View>
          <View style={[styles.practiceMetric, { backgroundColor: t.lavender }]}><Moon size={20} strokeWidth={1.5} color={t.primary} /><T size={21} weight="semibold" style={{ marginTop: 10, letterSpacing: -0.6 }}>{formatDuration(analytics.sleepMinutes)}</T><T size={10} color={t.secondary}>Sleep & wind-down</T></View>
        </View>
        <View style={{ flexDirection: 'row', marginTop: 20, marginBottom: 18, gap: 10 }}>{[{ label: 'Avg. session', value: formatDuration(analytics.averageSession) }, { label: 'Weekly average', value: formatDuration(analytics.weeklyAverage) }, { label: 'Monthly average', value: formatDuration(analytics.monthlyAverage) }].map((item, index) => <View key={item.label} style={{ flex: 1, borderLeftWidth: index ? 1 : 0, borderLeftColor: t.border, paddingLeft: index ? 13 : 0 }}><T size={12} weight="semibold">{item.value}</T><T size={9} color={t.secondary} style={{ marginTop: 3 }}>{item.label}</T></View>)}</View>
        <Button label="Make a little space today" variant="secondary" icon={Leaf} onPress={() => onNavigate('Meditate')} small />
      </Card>
    </View>
    <T size={10} color={t.muted} style={{ textAlign: 'center', marginTop: 3, marginBottom: 6 }}>Your practice is personal. Progress looks different every day.</T>
    <LogPracticeModal visible={logging} onClose={() => setLogging(false)} />
  </View>;
}

export default AnalyticsScreen;

const styles = StyleSheet.create({
  titleTag: { borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  periodRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 18, marginBottom: 18 },
  rangeSelector: { padding: 3, borderWidth: 1, borderRadius: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 2, maxWidth: '100%' },
  rangeTab: { flexGrow: 1, minWidth: 58, minHeight: 32, paddingHorizontal: 9, borderRadius: 7, justifyContent: 'center', alignItems: 'center' },
  dateLabel: { flexDirection: 'row', gap: 7, alignItems: 'center' },
  stats: { gap: 16, marginBottom: 22 },
  statPair: { flex: 1, flexDirection: 'row', gap: 16 },
  row: { gap: 22, marginBottom: 22 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  chartFootnote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, borderTopWidth: 1, paddingTop: 15, marginTop: 18 },
  goalSection: { flexDirection: 'row', alignItems: 'center', gap: 18, borderTopWidth: 1, marginTop: 22, paddingTop: 21 },
  goalFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 11, borderRadius: 9, marginTop: 17 },
  practiceMetric: { flex: 1, borderRadius: 12, padding: 15 },
});
