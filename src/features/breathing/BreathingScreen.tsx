import { webToggleState } from "../../utils/accessibility";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Check, Heart, Leaf, Pause, Play, RotateCcw, Sparkles, Wind } from 'lucide-react-native';
import { Button, Card, Chip, IconButton, PageTitle, T } from '../../components/ui';
import { PracticeInterval, useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../theme';
import { Navigate } from '../../types';
import { BreathingMoments } from './BreathingMoments';
import { breathingDurations, resolveBreathingDuration, type BreathingDuration, type BreathingMoment } from './presets';

type PhaseName = 'Inhale' | 'Hold' | 'Exhale' | 'Rest';
interface BreathingExercise { id: string; name: string; subtitle: string; description: string; benefit: string; pattern: { name: PhaseName; seconds: number }[] }
const exercises: BreathingExercise[] = [
  { id: 'box', name: 'Box breathing', subtitle: 'Find your balance', description: 'Four equal parts. A little structure to help you feel steady and present.', benefit: 'A gentle reset for busy moments', pattern: [{ name: 'Inhale', seconds: 4 }, { name: 'Hold', seconds: 4 }, { name: 'Exhale', seconds: 4 }, { name: 'Rest', seconds: 4 }] },
  { id: '478', name: '4–7–8 breathing', subtitle: 'Slow down, soften', description: 'Breathe in softly, pause, then let your breath out slowly. Follow a pace that feels comfortable.', benefit: 'Create space to unwind', pattern: [{ name: 'Inhale', seconds: 4 }, { name: 'Hold', seconds: 7 }, { name: 'Exhale', seconds: 8 }] },
  { id: 'deep', name: 'Deep breathing', subtitle: 'Come back to yourself', description: 'Let the belly gently rise as you inhale. Release your breath without pushing.', benefit: 'Reconnect with your natural rhythm', pattern: [{ name: 'Inhale', seconds: 5 }, { name: 'Exhale', seconds: 5 }] },
  { id: 'calm', name: 'Relaxation', subtitle: 'Make room for calm', description: 'An easy inhale followed by a longer, softer exhale. Allow your shoulders to settle.', benefit: 'A peaceful transition into rest', pattern: [{ name: 'Inhale', seconds: 4 }, { name: 'Exhale', seconds: 6 }, { name: 'Rest', seconds: 2 }] },
  { id: 'focus', name: 'Focus', subtitle: 'One breath at a time', description: 'Keep your attention on a steady rhythm. Whenever your mind wanders, return to the next breath.', benefit: 'A mindful pause before your next task', pattern: [{ name: 'Inhale', seconds: 4 }, { name: 'Hold', seconds: 2 }, { name: 'Exhale', seconds: 4 }, { name: 'Rest', seconds: 2 }] },
];
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
const compactNames: Record<string, string> = { box: 'Box', '478': '4–7–8', deep: 'Deep', calm: 'Relaxation', focus: 'Focus' };
const exercisePatterns = Object.fromEntries(exercises.map(exercise => [exercise.id, exercise.pattern]));

export function BreathingScreen({ onNavigate, onPrepare }: { onNavigate: Navigate; onPrepare?: () => void }) {
  const { exercise: routeExercise, duration: routeDuration } = useLocalSearchParams<{ exercise?: string; duration?: string | string[] }>();
  const exerciseId = exercises.some(item => item.id === routeExercise) ? routeExercise! : 'box';
  const initialDuration = resolveBreathingDuration(routeDuration);
  return <BreathingPractice key={`${exerciseId}:${initialDuration}`} exerciseId={exerciseId} initialDuration={initialDuration} onNavigate={onNavigate} onPrepare={onPrepare} />;
}

function BreathingPractice({ onNavigate, onPrepare, exerciseId, initialDuration }: { onNavigate: Navigate; onPrepare?: () => void; exerciseId: string; initialDuration: BreathingDuration }) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const circleSize = Math.min(286, width - 92);
  const [duration, setDuration] = useState<BreathingDuration>(initialDuration);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const elapsedRef = useRef(0);
  const intervalsRef = useRef<PracticeInterval[]>([]);
  const activeIntervalRef = useRef<{ startedAt: number; startingElapsed: number; index: number } | null>(null);
  const runningRef = useRef(false);
  const screenFocused = useRef(false);
  const appActive = useRef(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  const hasRecorded = useRef(false);
  const scale = useSharedValue(0.72);
  const favorites = useAppStore(s => s.favorites);
  const toggleFavorite = useAppStore(s => s.toggleFavorite);
  const recordBreathing = useAppStore(s => s.recordBreathing);
  const notify = useAppStore(s => s.notify);
  const exercise = exercises.find(item => item.id === exerciseId)!;
  const cycleDuration = exercise.pattern.reduce((sum, step) => sum + step.seconds, 0);
  const cycle = Math.floor(elapsed / cycleDuration);
  let cursor = elapsed % cycleDuration;
  let phaseIndex = 0;
  while (cursor >= exercise.pattern[phaseIndex].seconds && phaseIndex < exercise.pattern.length - 1) {
    cursor -= exercise.pattern[phaseIndex].seconds;
    phaseIndex += 1;
  }
  const phase = exercise.pattern[phaseIndex];
  const phaseRemaining = phase.seconds - cursor;
  const saved = favorites.includes(`breathing:${exercise.id}`);
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  const sampleActiveInterval = useCallback(() => {
    const active = activeIntervalRef.current;
    if (!active) return;
    // Monotonic elapsed time ignores system-clock adjustments; each resume keeps its real local date.
    const seconds = Math.min(duration * 60 - active.startingElapsed, Math.max(0, (performance.now() - active.startedAt) / 1000));
    intervalsRef.current[active.index].seconds = seconds;
    elapsedRef.current = active.startingElapsed + seconds;
    setElapsed(Math.floor(elapsedRef.current));
  }, [duration]);

  const pausePractice = useCallback(() => {
    sampleActiveInterval();
    activeIntervalRef.current = null;
    runningRef.current = false;
    setRunning(false);
    cancelAnimation(scale);
  }, [sampleActiveInterval, scale]);

  useFocusEffect(useCallback(() => {
    screenFocused.current = true;
    return () => {
      screenFocused.current = false;
      pausePractice();
    };
  }, [pausePractice]));

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      if (!runningRef.current || !screenFocused.current || !appActive.current) return;
      sampleActiveInterval();
    }, 200);
    return () => clearInterval(timer);
  }, [running, sampleActiveInterval]);

  useEffect(() => {
    if (elapsed < duration * 60 || hasRecorded.current) return;
    hasRecorded.current = true;
    activeIntervalRef.current = null;
    runningRef.current = false;
    setRunning(false);
    setFinished(true);
    recordBreathing(duration, intervalsRef.current.filter(interval => interval.seconds > 0));
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [duration, elapsed, recordBreathing]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      appActive.current = state === 'active';
      if (state !== 'active') pausePractice();
    });
    return () => subscription.remove();
  }, [pausePractice]);

  useEffect(() => {
    if (!running) { cancelAnimation(scale); return; }
    const target = phase.name === 'Inhale' || phase.name === 'Hold' ? 1 : 0.72;
    scale.set(withTiming(target, { duration: phaseRemaining * 1000, easing: Easing.inOut(Easing.sin), reduceMotion: ReduceMotion.System }));
    return () => cancelAnimation(scale);
    // The countdown updates text each second; the circle animates once per phase.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseIndex, cycle, running, exerciseId, scale]);

  function reset() {
    activeIntervalRef.current = null;
    intervalsRef.current = [];
    runningRef.current = false;
    setRunning(false); setFinished(false); setElapsed(0); elapsedRef.current = 0; hasRecorded.current = false;
    scale.set(withTiming(0.72, { duration: 400, reduceMotion: ReduceMotion.System }));
  }
  function chooseExercise(id: string) { reset(); const nextDuration = id === exerciseId ? duration : 3; setDuration(nextDuration); router.setParams({ exercise: id, duration: String(nextDuration) }); }
  function chooseDuration(minutes: BreathingDuration) { reset(); setDuration(minutes); router.setParams({ duration: String(minutes) }); }
  function chooseMoment(moment: BreathingMoment) {
    if (runningRef.current || (elapsedRef.current > 0 && !hasRecorded.current)) return;
    reset();
    setDuration(moment.duration);
    router.setParams({ exercise: moment.exerciseId, duration: String(moment.duration) });
    onPrepare?.();
    notify(`${moment.title} is ready. Begin breathing above when you are ready.`);
  }
  function togglePractice() {
    if (finished) { reset(); return; }
    if (runningRef.current) { pausePractice(); return; }
    if (Platform.OS !== 'web') void Haptics.selectionAsync().catch(() => {});
    const index = intervalsRef.current.length;
    // This function only runs from the practice button's press handler.
    // eslint-disable-next-line react-hooks/purity
    intervalsRef.current.push({ startTime: Date.now(), seconds: 0 });
    // eslint-disable-next-line react-hooks/purity
    activeIntervalRef.current = { startedAt: performance.now(), startingElapsed: elapsedRef.current, index };
    runningRef.current = true;
    setRunning(true);
  }

  return <View>
    <PageTitle eyebrow="A moment for you" title="Just breathe." subtitle="Your breath is always a place to begin again." right={<IconButton icon={ArrowLeft} label="Back to Explore" onPress={() => onNavigate('Explore')} />} />
    <View style={[styles.columns, { flexDirection: width >= 1040 ? 'row' : 'column' }]}>
      <View style={{ width: width >= 1040 ? 265 : undefined, gap: 12 }}>
        <T size={11} weight="semibold" color={t.secondary} style={styles.overline}>CHOOSE YOUR PRACTICE</T>
        {width < 700 ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{exercises.map(item => <Chip key={item.id} label={compactNames[item.id]} active={item.id === exerciseId} onPress={() => chooseExercise(item.id)} />)}</View> : <>{exercises.map((item, index) => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: item.id === exerciseId }} {...webToggleState(item.id === exerciseId)} onPress={() => chooseExercise(item.id)} style={({ pressed }) => [styles.exercise, { borderColor: item.id === exerciseId ? t.primary : t.border, backgroundColor: item.id === exerciseId ? t.primarySoft : t.surface, opacity: pressed ? 0.7 : 1 }]}>
          <View style={[styles.exerciseNumber, { backgroundColor: item.id === exerciseId ? t.primary : t.surfaceAlt }]}><T size={12} weight="semibold" color={item.id === exerciseId ? (t.isDark ? '#203025' : '#fff') : t.secondary}>0{index + 1}</T></View>
          <View style={{ flex: 1 }}><T size={13} weight="semibold">{item.name}</T><T size={11} color={t.secondary} style={{ marginTop: 2 }}>{item.subtitle}</T></View>
          {item.id === exerciseId && <Check size={15} color={t.primary} />}
        </Pressable>)}
        <View style={[styles.tip, { backgroundColor: t.peach }]}><Leaf size={20} color={t.primary} /><T size={12} color={t.secondary} style={{ flex: 1 }}>No perfect breaths. Just a few moments of being here.</T></View></>}
      </View>
      <Card style={{ flex: 1, padding: width < 500 ? 20 : 30 }}>
        <View style={styles.rowBetween}><View style={{ flex: 1, minWidth: 0 }}><T size={21} weight="semibold" style={{ letterSpacing: -0.6 }}>{exercise.name}</T><T size={12} color={t.secondary}>{exercise.benefit}</T></View><IconButton icon={Heart} selected={saved} color={saved ? t.primary : t.secondary} label={saved ? 'Remove exercise from favorites' : 'Save exercise to favorites'} onPress={() => toggleFavorite(`breathing:${exercise.id}`)} style={saved ? { backgroundColor: t.primarySoft } : undefined} /></View>
        <View style={styles.breathingStage}>
          <View style={[styles.outerCircle, { borderColor: t.border, width: circleSize, height: circleSize, borderRadius: circleSize / 2 }]} />
          <View style={[styles.middleCircle, { borderColor: t.border, width: circleSize * 0.86, height: circleSize * 0.86, borderRadius: circleSize / 2 }]} />
          <Animated.View style={[styles.breathingCircle, { backgroundColor: t.primarySoft, width: circleSize * 0.8, height: circleSize * 0.8, borderRadius: circleSize / 2 }, ringStyle]} />
          <View style={styles.circleText}>
            {finished ? <Check size={30} color={t.primary} /> : <Wind size={25} color={t.primary} strokeWidth={1.4} />}
            <T accessibilityLiveRegion="polite" accessibilityLabel={running ? `${phase.name} for ${phase.seconds} seconds` : undefined} size={28} weight="display" color={t.primaryDark} style={{ marginTop: 8 }}>{finished ? 'Beautifully done' : running || elapsed > 0 ? phase.name : 'Find your calm'}</T>
            <T accessible={!running} size={13} color={t.secondary} style={{ marginTop: 5 }}>{finished ? `${duration} mindful minutes` : running ? `${phaseRemaining} seconds` : elapsed > 0 ? 'Paused. Take your time.' : 'Let everything else wait.'}</T>
          </View>
        </View>
        <View style={[styles.pattern, { borderColor: t.border }]}>{exercise.pattern.map((step, index) => <View key={`${step.name}-${index}`} style={{ alignItems: 'center', flex: 1, gap: 4 }}><View style={[styles.phaseDot, { backgroundColor: running && index === phaseIndex ? t.primary : t.border }]} /><T size={12} weight={index === phaseIndex && running ? 'semibold' : 'regular'} color={index === phaseIndex && running ? t.primary : t.secondary}>{step.name}</T><T size={11} color={t.muted}>{step.seconds}s</T></View>)}</View>
        <T size={12} color={t.secondary} style={{ maxWidth: 470, textAlign: 'center', alignSelf: 'center', marginTop: 21 }}>{exercise.description}</T>
        <View style={{ alignItems: 'center', gap: 14, marginTop: 26 }}>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>{breathingDurations.map(minutes => <Chip key={minutes} label={`${minutes} min`} active={duration === minutes} onPress={() => chooseDuration(minutes)} />)}</View>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}><Button icon={finished ? RotateCcw : running ? Pause : Play} label={finished ? 'Practice again' : running ? 'Pause practice' : elapsed > 0 ? 'Resume practice' : 'Begin breathing'} onPress={togglePractice} style={{ minWidth: width < 360 ? 180 : 196 }} />{elapsed > 0 && !finished && <IconButton icon={RotateCcw} label="Reset breathing practice" onPress={reset} />}</View>
          <T size={11} color={t.secondary}>{finished ? 'Your practice has been added to your activity.' : `${clock(Math.max(0, duration * 60 - elapsed))} remaining · ${cycle + 1} ${cycle === 0 ? 'cycle' : 'cycles'}`}</T>
        </View>
      </Card>
    </View>
    <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 22, alignItems: 'center' }}><Sparkles size={13} color={t.secondary} /><T size={11} color={t.secondary} style={{ flexShrink: 1 }}>Keep the breath comfortable. Return to normal breathing whenever you need.</T></View>
    <BreathingMoments exerciseId={exerciseId} duration={duration} locked={running || (elapsed > 0 && !finished)} patterns={exercisePatterns} onChoose={chooseMoment} />
  </View>;
}

const styles = StyleSheet.create({
  columns: { gap: 22, alignItems: 'stretch' }, overline: { letterSpacing: 1.2, marginBottom: 3 },
  exercise: { borderWidth: 1, borderRadius: 14, padding: 15, gap: 12, flexDirection: 'row', alignItems: 'center', minHeight: 78 },
  exerciseNumber: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  tip: { padding: 18, borderRadius: 14, flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  breathingStage: { height: 326, alignItems: 'center', justifyContent: 'center' },
  outerCircle: { position: 'absolute', width: 286, height: 286, borderRadius: 143, borderWidth: 1 },
  middleCircle: { position: 'absolute', width: 246, height: 246, borderRadius: 123, borderWidth: 1 },
  breathingCircle: { width: 230, height: 230, borderRadius: 115 },
  circleText: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  pattern: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 16, gap: 8 },
  phaseDot: { width: 5, height: 5, borderRadius: 3, marginBottom: 2 },
});
