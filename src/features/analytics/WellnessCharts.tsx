import { webToggleState } from "../../utils/accessibility";
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { PieChart } from 'react-native-gifted-charts';
import { Smile, Sparkles } from 'lucide-react-native';
import { Button, Card, T } from '../../components/ui';
import { useTheme } from '../../theme';
import { CategorySummary, ChartPoint, formatDuration, moodLabel } from '../../utils/analytics';

const categoryColors: Record<string, string> = { Mindfulness: '#719162', Sleep: '#A9A2C5', Focus: '#A9BD97', 'Stress relief': '#CBB99C', Breathwork: '#91B2AC', 'Self love': '#C8AEB2' };

export function CategoryDonut({ categories, totalMinutes }: { categories: CategorySummary[]; totalMinutes: number }) {
  const t = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const selected = categories.find(item => item.category === selectedCategory);
  const centerLabel = () => <View style={{ alignItems: 'center' }}><T size={22} weight="semibold" style={{ letterSpacing: -0.8 }}>{selected ? `${selected.percentage}%` : formatDuration(totalMinutes)}</T><T size={10} color={t.secondary}>{selected?.category || 'mindful moments'}</T></View>;
  const circumference = 2 * Math.PI * 76.5;
  return <Card style={{ flex: 1, minWidth: 0 }}>
    <T size={16} weight="semibold">Your practice mix</T><T size={11} color={t.secondary} style={{ marginTop: 3 }}>{categories.length ? 'How you make space for yourself' : 'Your practice categories will appear here'}</T>
    <View style={{ alignItems: 'center', marginTop: 23, marginBottom: 23 }}>
      {Platform.OS === 'web' ? <Pressable accessibilityRole="button" accessibilityLabel="Explore category distribution" disabled={!categories.length} accessibilityState={{ disabled: !categories.length }} onPress={event => {
        const { locationX, locationY } = event.nativeEvent;
        const fraction = ((Math.atan2(locationY - 85, locationX - 85) + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2);
        let cumulative = 0;
        const hit = categories.find(item => { cumulative += item.minutes / Math.max(Number.EPSILON, totalMinutes); return fraction <= cumulative; });
        if (hit) setSelectedCategory(hit.category);
      }} style={{ width: 170, height: 170, justifyContent: 'center', alignItems: 'center' }}>
        <Svg width={170} height={170} style={StyleSheet.absoluteFill}>
          <Circle cx={85} cy={85} r={76.5} fill="none" stroke={t.border} strokeWidth={17} />
          {categories.map((item, index) => {
            const length = totalMinutes ? item.minutes / totalMinutes * circumference : 0;
            const precedingMinutes = categories.slice(0, index).reduce((sum, category) => sum + category.minutes, 0);
            const offset = totalMinutes ? -precedingMinutes / totalMinutes * circumference : 0;
            return <Circle key={item.category} cx={85} cy={85} r={76.5} fill="none" stroke={categoryColors[item.category]} strokeWidth={17} strokeDasharray={`${Math.max(0, length - 3)} ${circumference - Math.max(0, length - 3)}`} strokeDashoffset={offset} transform="rotate(-90 85 85)" />;
          })}
        </Svg>
        {centerLabel()}
      </Pressable> : <PieChart donut radius={85} innerRadius={68} innerCircleColor={t.surface} strokeWidth={3} strokeColor={t.surface} data={categories.length ? categories.map(item => ({ value: item.minutes, color: categoryColors[item.category], onPress: () => setSelectedCategory(item.category) })) : [{ value: 1, color: t.border }]} centerLabelComponent={centerLabel} />}
    </View>
    <View style={{ gap: 3 }}>{categories.map(item => <Pressable key={item.category} accessibilityRole="button" accessibilityState={{ selected: item.category === selectedCategory }} {...webToggleState(item.category === selectedCategory)} accessibilityLabel={`${item.category}, ${item.percentage} percent, ${formatDuration(item.minutes)}`} onPress={() => setSelectedCategory(item.category === selectedCategory ? null : item.category)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', minHeight: 32, gap: 9, opacity: pressed ? 0.6 : 1 })}><View style={{ width: 7, height: 7, borderRadius: 3, backgroundColor: categoryColors[item.category] }} /><T size={11} color={t.secondary} style={{ flex: 1 }}>{item.category}</T><T size={11} weight="medium">{item.percentage}%</T></Pressable>)}</View>
    {!categories.length && <T size={12} color={t.secondary} style={{ textAlign: 'center', paddingHorizontal: 8, marginBottom: 10 }}>Meditation, breathing, and rest — recorded as you practice.</T>}
  </Card>;
}

export function MoodTrend({ points, averageMood, onCheckIn }: { points: ChartPoint[]; averageMood: number; onCheckIn?: () => void }) {
  const t = useTheme();
  const [width, setWidth] = useState(400);
  const logged = points.map((point, index) => ({ point, index })).filter(({ point }) => point.mood > 0);
  const coords = logged.map(({ point, index }) => ({ x: 6 + index * (width - 12) / Math.max(1, points.length - 1), y: 75 - (point.mood - 1) / 4 * 62 }));
  const d = coords.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  return <Card style={{ flex: 1 }}>
    <View style={styles.moodHeading}><View><T size={16} weight="semibold">Your mood, over time</T><T size={11} color={t.secondary} style={{ marginTop: 3 }}>From your own daily check-ins</T></View><View style={[styles.moodBadge, { backgroundColor: t.peach }]}><Smile size={18} color={t.isDark ? '#D6BB99' : '#AD9270'} /></View></View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: 9, marginTop: 15 }}><T size={23} weight="semibold" style={{ letterSpacing: -0.8 }}>{moodLabel(averageMood)}</T><T size={11} color={t.secondary}>{averageMood ? `${averageMood.toFixed(1)} / 5 average mood` : 'Check in to build your picture'}</T></View>
    <View onLayout={event => setWidth(Math.max(120, event.nativeEvent.layout.width))} style={{ height: 96, marginTop: 9 }} accessibilityLabel={`Mood trend: ${logged.length} logged periods. Average mood ${moodLabel(averageMood)}.`}>
      <Svg width={width} height={94}><Line x1={0} y1={77} x2={width} y2={77} stroke={t.border} strokeDasharray="3 5" /><Line x1={0} y1={43} x2={width} y2={43} stroke={t.border} strokeDasharray="3 5" /><Path d={d} stroke={t.chart} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />{coords.filter((_, index) => index === 0 || index === coords.length - 1).map((point, index) => <Circle key={index} cx={point.x} cy={point.y} r={4} fill={t.chart} stroke={t.surface} strokeWidth={2} />)}</Svg>
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><T size={10} color={t.muted}>{points[0]?.label}</T><T size={10} color={t.muted}>{points[points.length - 1]?.label}</T></View>
    {!logged.length && onCheckIn ? <Button label="Check in on Home" variant="secondary" small onPress={onCheckIn} style={{ marginTop: 16 }} /> : <View style={[styles.insight, { backgroundColor: t.primarySoft }]}><Sparkles size={14} color={t.primary} /><T size={11} color={t.primary} style={{ flex: 1 }}>Every check-in is a small act of self-awareness.</T></View>}
  </Card>;
}

const styles = StyleSheet.create({
  moodHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  moodBadge: { width: 37, height: 37, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  insight: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 9, padding: 12, marginTop: 16 },
});
