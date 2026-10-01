import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Clock3, Leaf, PenLine, Trash2, Wind } from 'lucide-react-native';
import { Button, Card, SectionHeading, T } from '../../components/ui';
import { programs, sessions } from '../../mock/content';
import { localDateKey, PracticeRecord, useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../theme';
import { formatDuration } from '../../utils/analytics';
import { SettingsModal } from '../profile/ProfilePrimitives';
import { sleepSounds } from '../sleep/data';

function practiceTitle(record: PracticeRecord) {
  if (record.title?.trim()) return record.title;
  const session = sessions.find(item => item.id === record.id);
  if (session) return session.title;
  const lesson = record.id.match(/^program:([^:]+):(\d+)$/);
  if (lesson) {
    const programTitle = programs.find(program => program.id === lesson[1])?.lessons[Number(lesson[2])];
    if (programTitle) return programTitle;
  }
  const sound = sleepSounds.find(item => `sleep-sound:${item.id}` === record.id);
  if (sound) return sound.title;
  return record.category === 'Breathwork' ? 'Breathing practice' : `${record.category} practice`;
}

function practiceDate(date: string) {
  if (date === localDateKey()) return 'Today';
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date === localDateKey(yesterday)) return 'Yesterday';
  const parsed = new Date(`${date}T12:00:00`);
  return Number.isFinite(parsed.getTime()) ? parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(parsed.getFullYear() === new Date().getFullYear() ? {} : { year: 'numeric' as const }) }) : date;
}

function practiceDuration(record: PracticeRecord) {
  return formatDuration((record.seconds ?? record.minutes * 60) / 60);
}

export function PracticeHistory({ limit = 5, onLog }: { limit?: number; onLog?: () => void }) {
  const t = useTheme();
  const history = useAppStore(s => s.completedSessions);
  const hasHydrated = useAppStore(s => s.hasHydrated);
  const removePractice = useAppStore(s => s.removePractice);
  const [pendingRemoval, setPendingRemoval] = useState<PracticeRecord | null>(null);
  const count = Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : 5;
  const records = useMemo(() => history.map((record, index) => ({ record, index })).sort((a, b) => b.record.date.localeCompare(a.record.date) || (b.record.recordedAt || '').localeCompare(a.record.recordedAt || '') || b.index - a.index).slice(0, count).map(item => item.record), [history, count]);
  const remove = () => {
    if (pendingRemoval?.source === 'manual' && pendingRemoval.recordId) removePractice(pendingRemoval.recordId);
    setPendingRemoval(null);
  };

  return <>
    <Card style={{ padding: 22 }}>
      <SectionHeading title="Your practice journal" subtitle="Time you have made for yourself." action={onLog ? 'Log practice' : undefined} onAction={onLog} />
      {!hasHydrated ? <View style={{ alignItems: 'center', gap: 10, paddingVertical: 28 }}><ActivityIndicator color={t.primary} /><T size={12} color={t.secondary}>Loading your practice…</T></View> : records.length === 0 ? <View style={{ paddingVertical: 22, alignItems: 'center', gap: 9 }}>
        <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: t.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 3 }}><Leaf size={22} color={t.primary} strokeWidth={1.5} /></View>
        <T size={14} weight="semibold">A little time. A fresh beginning.</T>
        <T size={12} color={t.secondary} style={{ textAlign: 'center', maxWidth: 320 }}>Start a session or log a practice to see your time here.</T>
      </View> : <View>{records.map((record, index) => {
        const title = practiceTitle(record);
        const source = record.source || (record.id.startsWith('breathing') ? 'breathing' : 'timer');
        const Icon = source === 'manual' ? PenLine : source === 'breathing' ? Wind : Clock3;
        const sourceLabel = source === 'manual' ? 'Logged manually' : source === 'breathing' ? 'Breathing' : 'Timer';
        return <View key={record.recordId || `${record.id}:${record.date}:${record.recordedAt || index}`} style={[styles.row, { borderTopColor: t.border, borderTopWidth: index ? 1 : 0 }]}>
          <View style={[styles.rowIcon, { backgroundColor: source === 'manual' ? t.peach : source === 'breathing' ? t.blue : t.primarySoft }]}><Icon size={17} color={t.primary} strokeWidth={1.7} /></View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 9 }}><T size={12} weight="semibold" numberOfLines={2} style={{ flex: 1 }}>{title}</T><T size={12} weight="semibold" color={t.primary}>{practiceDuration(record)}</T></View>
            <T size={10} color={t.secondary} style={{ marginTop: 4 }}>{practiceDate(record.date)} · {record.category}</T>
            <T size={9} color={t.muted} style={{ marginTop: 3 }}>{sourceLabel}{record.sessionCount === 0 ? ' · Continued across midnight' : ''}</T>
          </View>
          {source === 'manual' && record.recordId && <Pressable accessibilityRole="button" accessibilityLabel={`Remove logged practice: ${title}`} onPress={() => setPendingRemoval(record)} style={({ pressed }) => [styles.removeButton, { opacity: pressed ? 0.5 : 1 }]}><Trash2 size={15} color={t.secondary} strokeWidth={1.5} /></Pressable>}
        </View>;
      })}</View>}
      {hasHydrated && history.length > records.length && <T size={10} color={t.muted} style={{ marginTop: 13 }}>Showing your {records.length} most recent entries.</T>}
    </Card>
    <SettingsModal title="Remove this practice?" visible={pendingRemoval !== null} onClose={() => setPendingRemoval(null)}>
      {pendingRemoval && <View style={{ gap: 19 }}>
        <View style={{ padding: 17, borderRadius: 12, backgroundColor: t.surfaceAlt }}><T size={14} weight="semibold">{practiceTitle(pendingRemoval)}</T><T size={12} color={t.secondary} style={{ marginTop: 6 }}>{practiceDuration(pendingRemoval)} · {practiceDate(pendingRemoval.date)}</T></View>
        <T size={13} color={t.secondary}>This manually logged entry will be removed from your history, and your progress will update.</T>
        <View style={{ gap: 9 }}><Button label="Keep practice" onPress={() => setPendingRemoval(null)} /><Pressable accessibilityRole="button" accessibilityLabel="Remove practice from history" onPress={remove} style={({ pressed }) => ({ minHeight: 46, borderWidth: 1, borderColor: t.danger, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: pressed ? 0.6 : 1 })}><Trash2 size={15} color={t.danger} /><T size={13} color={t.danger} weight="semibold">Remove practice</T></Pressable></View>
      </View>}
    </SettingsModal>
  </>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 15 },
  rowIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  removeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -9 },
});
