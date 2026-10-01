import React, { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { ArrowLeft, Check, LockKeyhole, Trophy } from 'lucide-react-native';
import { Button, Card, Chip, IconButton, PageTitle, ProgressRing, T } from '../../components/ui';
import { Navigate } from '../../types';
import { useTheme } from '../../theme';
import { Achievement, useProfileStats } from './useProfileStats';
import { SettingsModal } from './ProfilePrimitives';
import { formatMinutes } from '../../utils/analytics';

const achievementValue = (item: Achievement) => item.unit === 'min' ? formatMinutes(Math.min(item.current, item.target)) : String(Math.min(item.current, item.target));

export function AchievementsScreen({ onNavigate }: { onNavigate: Navigate }) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const { achievements, earned } = useProfileStats();
  const [filter, setFilter] = useState<'All' | 'Collected' | 'In progress'>('All');
  const [selected, setSelected] = useState<Achievement | null>(null);
  const columns = width > 1250 ? 4 : width > 850 ? 3 : width > 520 ? 2 : 1;
  const visible = achievements.filter(item => filter === 'All' || (filter === 'Collected' ? item.current >= item.target : item.current < item.target));
  return <View>
    <PageTitle eyebrow="Celebrate the small things" title="Moments that matter." subtitle="A collection of the little ways you’ve shown up for yourself." right={<IconButton icon={ArrowLeft} label="Back to Profile" onPress={() => onNavigate('Profile')} />} />
    <Card style={{ backgroundColor: t.primarySoft, borderColor: t.primarySoft, flexDirection: 'row', alignItems: 'center', gap: width < 500 ? 17 : 27, padding: width < 500 ? 20 : 28 }}><ProgressRing progress={earned / achievements.length} size={width < 500 ? 82 : 100} stroke={6}><Trophy size={28} color={t.primary} strokeWidth={1.4} /></ProgressRing><View style={{ flex: 1 }}><T size={width < 500 ? 21 : 25} weight="semibold" color={t.primaryDark} style={{ letterSpacing: -0.6 }}>{earned} little milestones</T><T size={12} color={t.secondary} style={{ marginTop: 6 }}>Each one is a little reminder: your practice is growing.</T><T size={11} color={t.primary} weight="medium" style={{ marginTop: 11 }}>{earned} of {achievements.length} collected · Keep finding your calm</T></View></Card>
    <View style={{ flexDirection: 'row', gap: 8, marginTop: 26, marginBottom: 20, flexWrap: 'wrap' }}>{(['All', 'Collected', 'In progress'] as const).map(value => <Chip key={value} label={value} active={filter === value} onPress={() => setFilter(value)} />)}</View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 18 }}>
      {visible.map(item => { const unlocked = item.current >= item.target; const Icon = item.icon; return <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${item.title}, ${unlocked ? 'collected' : `${achievementValue(item)} of ${item.target} ${item.unit}`}`} onPress={() => setSelected(item)} style={({ pressed }) => ({ width: columns === 1 ? '100%' : columns === 2 ? '48%' : columns === 3 ? '31.4%' : '23.3%', opacity: pressed ? 0.75 : 1 })}><Card style={{ alignItems: 'center', padding: 24, minHeight: 260 }}>
        <View style={[styles.badge, { backgroundColor: unlocked ? item.color === 'peach' ? t.peach : item.color === 'lavender' ? t.lavender : t.primarySoft : t.surfaceAlt, borderColor: t.border }]}><Icon size={32} strokeWidth={1.3} color={unlocked ? t.primary : t.muted} /><View style={[styles.badgeStatus, { backgroundColor: unlocked ? t.primary : t.surface, borderColor: t.surface }]}>{unlocked ? <Check size={10} color={t.isDark ? '#203025' : '#fff'} /> : <LockKeyhole size={9} color={t.muted} />}</View></View>
        <T size={14} weight="semibold" style={{ textAlign: 'center', marginTop: 17 }}>{item.title}</T><T size={11} color={t.secondary} style={{ textAlign: 'center', marginTop: 4, maxWidth: 205 }}>{item.description}</T><View style={{ marginTop: 'auto', alignSelf: 'stretch', alignItems: 'center', paddingTop: 15 }}>{unlocked ? <T size={10} weight="medium" color={t.primary}>COLLECTED</T> : <><View style={{ height: 4, borderRadius: 3, width: '100%', backgroundColor: t.border, overflow: 'hidden' }}><View style={{ height: 4, width: `${Math.min(100, item.current / item.target * 100)}%`, backgroundColor: t.chart, borderRadius: 3 }} /></View><T size={10} color={t.secondary} style={{ marginTop: 7 }}>{achievementValue(item)} / {item.target} {item.unit}</T></>}</View>
      </Card></Pressable>; })}
    </View>
    {visible.length === 0 && <Card style={{ alignItems: 'center', paddingVertical: 40 }}><Trophy size={30} color={t.primary} /><T size={16} weight="medium" style={{ marginTop: 12 }}>Your first moment is waiting.</T><T size={12} color={t.secondary} style={{ marginTop: 7 }}>Start a practice and make a little space for yourself.</T><Button label="Find a practice" onPress={() => onNavigate('Explore')} style={{ marginTop: 20 }} /></Card>}
    <T size={11} color={t.secondary} style={{ textAlign: 'center', marginTop: 24 }}>Progress is personal. There’s no finish line to feeling more like yourself.</T>
    <SettingsModal title={selected?.title || ''} visible={selected !== null} onClose={() => setSelected(null)}>{selected && <View style={{ alignItems: 'center' }}><View style={[styles.badge, { backgroundColor: t.primarySoft, borderColor: t.border, marginBottom: 22 }]}><selected.icon size={34} color={t.primary} strokeWidth={1.4} /></View><T size={14} style={{ textAlign: 'center' }}>{selected.description}</T><T size={13} color={t.secondary} style={{ textAlign: 'center', marginTop: 13 }}>{selected.current >= selected.target ? 'Collected. A little milestone worth celebrating.' : `${achievementValue(selected)} of ${selected.target} ${selected.unit}. One practice at a time.`}</T>{(selected.id === 'early' || selected.id === 'night') && selected.current === 0 && <T size={11} color={t.secondary} style={{ textAlign: 'center', marginTop: 13 }}>Complete a new session on this device at the right time to collect this milestone.</T>}<Button label={selected.current >= selected.target ? 'Keep going gently' : 'Make a little time'} onPress={() => { setSelected(null); onNavigate('Meditate'); }} style={{ marginTop: 25, alignSelf: 'stretch' }} /></View>}</SettingsModal>
  </View>;
}

const styles = StyleSheet.create({
  badge: { width: 75, height: 82, borderRadius: 26, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  badgeStatus: { position: 'absolute', bottom: -5, right: -4, width: 22, height: 22, borderRadius: 11, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
});
