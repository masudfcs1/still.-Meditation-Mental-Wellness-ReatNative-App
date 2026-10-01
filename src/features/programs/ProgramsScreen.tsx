import { webToggleState } from "../../utils/accessibility";
import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleProp, StyleSheet, useWindowDimensions, View, ViewStyle } from 'react-native';
import { ArrowRight, BookOpen, Check, CheckCircle2, Clock3, Heart, Leaf, LockKeyhole, Play, X } from 'lucide-react-native';
import { Button, Card, Chip, IconButton, PageTitle, SectionHeading, T } from '../../components/ui';
import { programs, sessions } from '../../mock/content';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../theme';
import { Navigate, Program } from '../../types';

export function ProgramsScreen({ onNavigate }: { onNavigate: Navigate }) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const available = width >= 1000 ? width - 280 : width;
  const [selected, setSelected] = useState<Program | null>(null);
  const [filter, setFilter] = useState('All programs');
  const completed = useAppStore(s => s.completedLessons);
  const inProgress = programs.filter(p => (completed[p.id]?.length || 0) > 0 && (completed[p.id]?.length || 0) < p.days);
  const visible = filter === 'In progress' ? inProgress : filter === 'Completed' ? programs.filter(p => (completed[p.id]?.length || 0) >= p.days) : programs;
  return <View>
    <PageTitle eyebrow="ONE DAY AT A TIME" title="Small steps. Lasting change." subtitle="Thoughtfully guided journeys to help your practice grow." />
    {inProgress[0] && <View style={[styles.continueCard, { backgroundColor: t.primarySoft, flexDirection: available < 620 ? 'column' : 'row' }]}>
      <View style={{ width: available < 620 ? '100%' : 228, height: available < 620 ? 165 : undefined, overflow: 'hidden', flexShrink: 0 }}><Image source={inProgress[0].image} style={styles.coverImage} resizeMode="cover" /></View>
      <View style={{ padding: 28, flex: 1 }}><T size={10} weight="semibold" color={t.primary} style={{ letterSpacing: 1.2, marginBottom: 10 }}>PICK UP WHERE YOU LEFT OFF</T><T size={25} weight="display" style={{ letterSpacing: -0.6 }}>{inProgress[0].title}</T><T size={12} color={t.secondary} style={{ marginTop: 7 }}>You’re building something good. Let’s take the next little step.</T><View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 19, marginBottom: 18 }}><View style={{ flex: 1, height: 5, backgroundColor: t.isDark ? '#50674A' : '#D9E3D0', borderRadius: 4 }}><View style={{ width: `${((completed[inProgress[0].id]?.length || 0) / inProgress[0].days) * 100}%`, height: 5, backgroundColor: t.primary, borderRadius: 4 }} /></View><T size={10} color={t.primary}>{completed[inProgress[0].id]?.length || 0} of {inProgress[0].days} days</T></View><Button label="Continue my journey" icon={ArrowRight} onPress={() => setSelected(inProgress[0])} small style={{ alignSelf: 'flex-start' }} /></View>
    </View>}
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>{['All programs', 'In progress', 'Completed'].map(value => <Chip key={value} label={value} active={filter === value} onPress={() => setFilter(value)} />)}</View>
    <SectionHeading title={filter === 'All programs' ? 'Find your path' : filter === 'Completed' ? 'Look how far you’ve come' : 'Your ongoing journeys'} subtitle="A little structure, a lot of room to be yourself." />
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20 }}>{visible.map(program => <ProgramCard key={program.id} program={program} onPress={() => setSelected(program)} style={{ width: available >= 840 ? '31.5%' : available >= 550 ? '48%' : '100%' }} />)}</View>
    {!visible.length && <Card style={{ paddingVertical: 48, alignItems: 'center', gap: 12 }}><BookOpen size={30} color={t.primary} /><T size={20} weight="semibold">Your journey is waiting</T><T size={13} color={t.secondary} style={{ textAlign: 'center', maxWidth: 350 }}>{filter === 'Completed' ? 'Complete each practice in a program to see it here. Every small step counts.' : 'Choose a program below and begin with a few mindful minutes.'}</T><Button label="Explore all programs" onPress={() => setFilter('All programs')} variant="secondary" /></Card>}
    <Card style={{ marginTop: 28, flexDirection: 'row', gap: 17, backgroundColor: t.isDark ? t.surfaceAlt : '#F2F0EA', borderWidth: 0 }}><View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface }}><Leaf size={20} color={t.primary} /></View><View style={{ flex: 1 }}><T size={14} weight="semibold">Go at your own pace.</T><T size={12} color={t.secondary} style={{ marginTop: 5 }}>There’s no rush and no falling behind. Each practice unlocks the next, whenever you’re ready.</T><Pressable onPress={() => onNavigate('Explore')} accessibilityRole="button" style={{ marginTop: 12, flexDirection: 'row', gap: 7, alignItems: 'center' }}><T size={12} weight="semibold" color={t.primary}>Looking for a single meditation?</T><ArrowRight size={14} color={t.primary} /></Pressable></View></Card>
    <ProgramDetail program={selected} onClose={() => setSelected(null)} />
  </View>;
}

export function ProgramCard({ program, onPress, style }: { program: Program; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const saved = useAppStore(s => s.favorites.includes(program.id));
  const toggleFavorite = useAppStore(s => s.toggleFavorite);
  const completed = useAppStore(s => s.completedLessons[program.id]);
  const count = Math.min(program.days, completed?.length || 0);
  return <View style={[styles.programCard, { borderColor: t.border, backgroundColor: t.surface }, style]}>
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`View ${program.title}`} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, flex: 1 })}><View style={{ height: 185, width: '100%', overflow: 'hidden' }}><Image source={program.image} style={styles.coverImage} resizeMode="cover" /><View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(16,32,27,0.1)' }]} /><View style={{ position: 'absolute', bottom: 16, left: 16, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.93)' }}><T size={10} weight="semibold" color="#425D44">{program.days}-DAY JOURNEY</T></View></View><View style={{ padding: 20, backgroundColor: t.surface }}><T size={10} color={t.primary} weight="medium">{program.category}</T><T size={17} weight="semibold" style={{ marginTop: 6, letterSpacing: -0.5 }}>{program.title}</T><T size={12} color={t.secondary} style={{ marginTop: 8, minHeight: 56 }}>{program.description}</T><View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 17 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Clock3 size={12} color={t.secondary} /><T size={10} color={t.secondary}>10–15 min / day</T></View><T size={10} weight="semibold" color={t.primary}>{count === program.days ? 'Completed' : count ? `${count}/${program.days} complete` : 'Beginner friendly'}</T></View>{count > 0 && <View style={{ height: 4, borderRadius: 3, backgroundColor: t.border, marginTop: 14 }}><View style={{ height: 4, borderRadius: 3, backgroundColor: t.primary, width: `${count / program.days * 100}%` }} /></View>}</View></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={`${saved ? 'Unsave' : 'Save'} ${program.title}`} accessibilityState={{ selected: saved }} {...webToggleState(saved)} hitSlop={5} onPress={event => { event.stopPropagation(); toggleFavorite(program.id); }} style={{ position: 'absolute', top: 12, right: 12, width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.93)', borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}><Heart size={16} color="#4E7257" fill={saved ? '#4E7257' : 'transparent'} strokeWidth={1.6} /></Pressable>
  </View>;
}

export function ProgramDetail({ program, onClose }: { program: Program | null; onClose: () => void }) {
  const t = useTheme();
  const completedLessons = useAppStore(s => s.completedLessons);
  const startSession = useAppStore(s => s.startSession);
  if (!program) return null;
  const completed = completedLessons[program.id] || [];
  const nextDay = program.lessons.findIndex((_, day) => !completed.includes(day));
  const playLesson = (day: number) => {
    const template = sessions.find(session => session.category === program.category) || sessions[0];
    startSession({ ...template, id: `program:${program.id}:${day}`, title: program.lessons[day], subtitle: `${program.title} · Day ${day + 1}`, duration: 10 + (day % 2) * 5, image: program.image, difficulty: 'Beginner' });
    onClose();
  };
  return <Modal visible transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.modalBackdrop}><Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close program details" /><View accessibilityViewIsModal style={[styles.modal, { backgroundColor: t.surface }]}>
      <View style={{ height: 170, width: '100%', overflow: 'hidden', flexShrink: 0 }}><Image source={program.image} style={styles.coverImage} resizeMode="cover" /><View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(17,31,22,0.22)' }]} /><View style={{ position: 'absolute', top: 15, right: 15, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.95)' }}><IconButton icon={X} label="Close program details" onPress={onClose} color="#35563D" /></View><View style={{ position: 'absolute', bottom: 20, left: 26 }}><T size={10} color="#fff" weight="semibold" style={{ letterSpacing: 1.3 }}>{program.days} DAYS TO A LITTLE MORE {program.category === 'Sleep' ? 'REST' : 'CALM'}</T></View></View>
      <ScrollView contentContainerStyle={{ padding: 26 }} showsVerticalScrollIndicator={false}>
        <T size={26} weight="display" style={{ letterSpacing: -0.6 }}>{program.title}</T><T size={13} color={t.secondary} style={{ marginTop: 10, marginBottom: 20 }}>{program.description}</T>
        <View style={{ flexDirection: 'row', gap: 9, alignItems: 'center', marginBottom: 22 }}><CheckCircle2 size={17} color={t.primary} /><T size={12} color={t.primary}>{completed.length} of {program.days} practices complete</T></View>
        <Button label={nextDay < 0 ? 'Revisit day 1' : `Begin day ${nextDay + 1}`} icon={Play} onPress={() => playLesson(nextDay < 0 ? 0 : nextDay)} style={{ marginBottom: 24 }} />
        <T size={10} weight="semibold" color={t.secondary} style={{ letterSpacing: 1.2, marginBottom: 14 }}>YOUR JOURNEY</T>
        {program.lessons.map((lesson, day) => {
          const done = completed.includes(day);
          const unlocked = day === 0 || completed.includes(day - 1) || done;
          return <Pressable key={lesson} accessibilityRole="button" accessibilityLabel={`Day ${day + 1}: ${lesson}${done ? ', completed' : !unlocked ? ', locked' : ''}`} disabled={!unlocked} accessibilityState={{ disabled: !unlocked }} aria-disabled={!unlocked} onPress={() => playLesson(day)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 15, borderBottomWidth: day === program.days - 1 ? 0 : 1, borderColor: t.border, opacity: !unlocked ? 0.5 : pressed ? 0.65 : 1 })}>
            <View style={{ width: 37, height: 37, borderRadius: 12, backgroundColor: done || day === nextDay ? t.primarySoft : t.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>{done ? <Check size={17} color={t.primary} /> : <T size={12} weight="semibold" color={day === nextDay ? t.primary : t.secondary}>{String(day + 1).padStart(2, '0')}</T>}</View><View style={{ flex: 1 }}><T size={13} weight="medium">{lesson}</T><T size={10} color={t.secondary} style={{ marginTop: 2 }}>{10 + (day % 2) * 5} minutes · {done ? 'Completed' : !unlocked ? 'Complete the previous practice to unlock' : 'Ready when you are'}</T></View>{unlocked ? <Play size={15} color={t.primary} /> : <LockKeyhole size={14} color={t.secondary} />}
          </Pressable>;
        })}
        <T size={11} color={t.secondary} style={{ marginTop: 18, textAlign: 'center' }}>Finish a practice to unlock your next day.</T>
      </ScrollView>
    </View></View>
  </Modal>;
}

const styles = StyleSheet.create({
  coverImage: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  continueCard: { borderRadius: 18, overflow: 'hidden', marginBottom: 29 },
  programCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(14, 25, 19, 0.48)', justifyContent: 'center', alignItems: 'center', padding: 18 },
  modal: { width: '100%', maxWidth: 560, maxHeight: '90%', borderRadius: 23, overflow: 'hidden' },
});
