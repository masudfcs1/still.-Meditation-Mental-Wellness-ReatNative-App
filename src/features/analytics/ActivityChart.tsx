import { webToggleState } from "../../utils/accessibility";
import React, { useId, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { ArrowDownRight, ArrowUpRight, BarChart3, ChevronLeft, ChevronRight, LineChart } from 'lucide-react-native';
import { T } from '../../components/ui';
import { fonts, useTheme } from '../../theme';
import { ChartPoint, formatDate, formatDuration, moodLabel } from '../../utils/analytics';

interface Props {
  points: ChartPoint[];
  previousPoints: ChartPoint[];
  compare: boolean;
  dailyGoal: number;
  onSelect: (point: ChartPoint) => void;
}
const HEIGHT = 240;
const TOP = 18;
const BASE = 190;
const curve = (coordinates: { x: number; y: number }[]) => coordinates.reduce((path, point, index) => {
  if (!index) return `M ${point.x} ${point.y}`;
  const previous = coordinates[index - 1];
  const mid = (point.x + previous.x) / 2;
  return `${path} C ${mid} ${previous.y}, ${mid} ${point.y}, ${point.x} ${point.y}`;
}, '');

export function ActivityChart({ points, previousPoints, compare, dailyGoal, onSelect }: Props) {
  const t = useTheme();
  const gradientId = useId().replace(/:/g, '');
  const [width, setWidth] = useState(560);
  const [selectedIndex, setSelectedIndex] = useState(Math.max(0, points.length - 1));
  const [mode, setMode] = useState<'line' | 'bar'>('bar');
  const selected = Math.min(selectedIndex, points.length - 1);
  const point = points[selected];
  const chartWidth = Math.max(width, points.length * 28);
  const slotWidth = (chartWidth - 16) / Math.max(1, points.length);
  const barWidth = Math.min(48, slotWidth * 0.56);
  const showEveryDate = points.length === 7 && points.every(item => item.count === 1);
  const values = useMemo(() => [...points, ...(compare ? previousPoints : [])].map(item => item.minutes), [points, previousPoints, compare]);
  const largest = Math.max(...values, 0);
  const useSeconds = largest > 0 && largest < 1;
  const unitScale = useSeconds ? 60 : 1;
  const largestUnit = largest * unitScale;
  const maxUnit = largestUnit > 20 ? Math.ceil(largestUnit / 20) * 20 : largestUnit > 0 ? Math.max(4, Math.ceil(largestUnit / 4) * 4) : dailyGoal;
  const max = maxUnit / unitScale;
  const x = (index: number) => 8 + (index + 0.5) * slotWidth;
  const y = (minutes: number) => BASE - minutes / max * (BASE - TOP);
  const coordinates = points.map((item, index) => ({ x: x(index), y: y(item.minutes) }));
  const linePath = curve(coordinates);
  const previousPath = curve(previousPoints.slice(0, points.length).map((item, index) => ({ x: x(index), y: y(item.minutes) })));
  const areaPath = `${linePath} L ${x(points.length - 1)} ${BASE} L ${x(0)} ${BASE} Z`;
  const select = (index: number) => {
    if (!Number.isFinite(index) || !points.length) return;
    const next = Math.max(0, Math.min(points.length - 1, Math.floor(index)));
    setSelectedIndex(next);
    onSelect(points[next]);
  };
  const tickStep = showEveryDate ? 1 : Math.max(1, Math.ceil(points.length / (chartWidth / 80)));
  const pointCrossesYear = point && point.date.slice(0, 4) !== point.endDate.slice(0, 4);
  const period = point?.count > 1 ? `${formatDate(point.date, { month: 'short', day: 'numeric', year: pointCrossesYear ? 'numeric' : undefined })} – ${formatDate(point.endDate, { month: 'short', day: 'numeric', year: 'numeric' })}` : point ? formatDate(point.date, { month: 'long', day: 'numeric', year: 'numeric' }) : '';
  const goalMet = point && point.minutes >= dailyGoal * point.count;

  return <View>
    <View style={styles.chartMeta}>
      <View style={styles.legend}>
        <View style={[styles.legendDot, { backgroundColor: t.chart }]} /><T size={11} color={t.secondary}>Practice {useSeconds ? 'seconds' : 'minutes'}</T>
        {compare && <><View style={[styles.legendDot, { backgroundColor: t.muted, marginLeft: 9 }]} /><T size={11} color={t.secondary}>Previous period</T></>}
      </View>
      <View style={[styles.modeSwitch, { backgroundColor: t.surfaceAlt }]}>
        {(['bar', 'line'] as const).map(item => {
          const Icon = item === 'line' ? LineChart : BarChart3;
          return <Pressable key={item} accessibilityRole="button" accessibilityLabel={`Show ${item} chart`} accessibilityState={{ selected: mode === item }} {...webToggleState(mode === item)} onPress={() => setMode(item)} style={[styles.modeButton, { backgroundColor: mode === item ? t.surface : 'transparent' }]}><Icon size={15} color={mode === item ? t.primary : t.secondary} /></Pressable>;
        })}
      </View>
    </View>
    <View style={{ flexDirection: 'row', marginTop: 10 }}>
      <View style={{ width: 32, height: HEIGHT }}>
        {[1, 0.75, 0.5, 0.25, 0].map(level => <T key={level} size={10} color={t.muted} style={{ position: 'absolute', top: y(max * level) - 7 }}>{Math.round(maxUnit * level)}</T>)}
      </View>
      <View style={{ flex: 1, minWidth: 0 }} onLayout={event => setWidth(Math.max(160, event.nativeEvent.layout.width))}>
        <ScrollView horizontal showsHorizontalScrollIndicator={chartWidth > width + 1} contentContainerStyle={{ width: chartWidth }}>
          <View style={{ width: chartWidth, height: HEIGHT }}>
            <Svg width={chartWidth} height={HEIGHT}>
              <Defs><LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={t.chart} stopOpacity={0.2} /><Stop offset="1" stopColor={t.chart} stopOpacity={0.015} /></LinearGradient></Defs>
              {[1, 0.75, 0.5, 0.25, 0].map(level => <Line key={level} x1={0} y1={y(max * level)} x2={chartWidth} y2={y(max * level)} stroke={t.border} strokeDasharray={level ? '3 5' : undefined} />)}
              {mode === 'bar' && point && <Line x1={x(selected)} x2={x(selected)} y1={TOP} y2={BASE} stroke={t.chart} strokeDasharray="3 4" opacity={0.25} />}
              {mode === 'line' ? <><Path d={areaPath} fill={`url(#${gradientId})`} /><Path d={linePath} fill="none" stroke={t.chart} strokeWidth={2.5} strokeLinecap="round" /></> : points.map((item, index) => <Rect key={item.date} x={x(index) - barWidth / 2} y={y(item.minutes)} width={barWidth} height={BASE - y(item.minutes)} rx={Math.min(6, (BASE - y(item.minutes)) / 2)} fill={selected === index ? t.primary : t.chart} opacity={selected === index ? 1 : 0.75} />)}
              {compare && <Path d={previousPath} fill="none" stroke={t.muted} strokeWidth={1.5} strokeDasharray="5 5" opacity={0.8} />}
              {point && mode === 'line' && <><Line x1={x(selected)} x2={x(selected)} y1={TOP} y2={BASE} stroke={t.chart} strokeDasharray="3 4" opacity={0.4} /><Circle cx={x(selected)} cy={y(point.minutes)} r={9} fill={t.chart} opacity={0.12} /><Circle cx={x(selected)} cy={y(point.minutes)} r={4.5} fill={t.chart} stroke={t.surface} strokeWidth={2} /></>}
              {points.map((item, index) => (index === 0 || index === points.length - 1 || (index % tickStep === 0 && points.length - 1 - index >= tickStep)) && <React.Fragment key={item.date}><SvgText x={x(index)} y={BASE + 22} fill={selected === index ? t.primary : t.secondary} fontSize={showEveryDate && chartWidth < 330 ? 8 : 10} fontFamily={selected === index ? fonts.semibold : fonts.regular} textAnchor={showEveryDate || points.length === 1 ? 'middle' : index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'}>{item.label}</SvgText>{showEveryDate && <SvgText x={x(index)} y={BASE + 39} fill={t.muted} fontSize={9} fontFamily={fonts.regular} textAnchor="middle">{formatDate(item.date, { weekday: 'short' })}</SvgText>}</React.Fragment>)}
            </Svg>
            <Pressable accessibilityRole="adjustable" accessibilityValue={{ min: 0, max: Math.max(0, points.length - 1), now: Math.max(0, selected), text: `${period}, ${formatDuration(point?.minutes || 0)} of practice` }} aria-valuemin={0} aria-valuemax={Math.max(0, points.length - 1)} aria-valuenow={Math.max(0, selected)} aria-valuetext={`${period}, ${formatDuration(point?.minutes || 0)} of practice`} accessibilityLabel={`Practice ${mode} chart. ${period}, ${formatDuration(point?.minutes || 0)} of practice. Use the previous and next buttons to inspect each point.`} accessibilityActions={[{ name: 'increment', label: 'Next date' }, { name: 'decrement', label: 'Previous date' }]} onAccessibilityAction={event => select(selected + (event.nativeEvent.actionName === 'increment' ? 1 : -1))} onPress={event => {
              // Native touch events use locationX; React Native Web forwards a MouseEvent.
              const press = event.nativeEvent as typeof event.nativeEvent & { offsetX?: number };
              const offset = press.locationX ?? press.offsetX;
              if (typeof offset === 'number') select(Math.floor((offset - 8) / slotWidth));
            }} style={StyleSheet.absoluteFill} />
          </View>
        </ScrollView>
      </View>
    </View>
    {point && <View style={[styles.detail, { backgroundColor: t.surfaceAlt }]}>
      <View style={{ flex: 1 }}><T size={11} weight="semibold">{period}</T><View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, marginTop: 3 }}><T size={11} color={t.secondary}><T size={11} weight="semibold" color={t.primary}>{formatDuration(point.minutes)}</T> · {point.sessions} {point.sessions === 1 ? 'session' : 'sessions'}</T><T size={11} color={t.secondary}>{moodLabel(point.mood)} · {goalMet ? 'Goal reached' : `${Math.floor(point.minutes / (dailyGoal * point.count) * 100)}% of goal`}</T></View></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Inspect previous date" disabled={selected === 0} accessibilityState={{ disabled: selected === 0 }} aria-disabled={selected === 0} onPress={() => select(selected - 1)} style={[styles.pointNav, { opacity: selected === 0 ? 0.3 : 1 }]}><ChevronLeft size={17} color={t.secondary} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Inspect next date" disabled={selected === points.length - 1} accessibilityState={{ disabled: selected === points.length - 1 }} aria-disabled={selected === points.length - 1} onPress={() => select(selected + 1)} style={[styles.pointNav, { opacity: selected === points.length - 1 ? 0.3 : 1 }]}><ChevronRight size={17} color={t.secondary} /></Pressable>
    </View>}
  </View>;
}

export function ChangePill({ percent }: { percent: number | null }) {
  const t = useTheme();
  if (percent === null) return <T size={10} color={t.secondary}>No previous period to compare</T>;
  const Icon = percent >= 0 ? ArrowUpRight : ArrowDownRight;
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}><Icon size={13} color={t.primary} /><T size={10} weight="semibold" color={t.primary}>{Math.abs(percent)}%</T><T size={10} color={t.secondary}>vs. last period</T></View>;
}

const styles = StyleSheet.create({
  chartMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
  legend: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  modeSwitch: { flexDirection: 'row', borderRadius: 8, padding: 3 },
  modeButton: { width: 44, height: 40, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  detail: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', marginTop: 7 },
  pointNav: { width: 38, height: 42, alignItems: 'center', justifyContent: 'center' },
});
