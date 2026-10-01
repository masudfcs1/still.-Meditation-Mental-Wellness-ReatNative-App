import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../theme';

export function PracticeProgress({ minutes, goal, label = 'Daily practice progress' }: { minutes: number; goal: number; label?: string }) {
  const t = useTheme();
  const percent = Math.min(100, Math.max(0, minutes / Math.max(1, goal) * 100));
  const value = useSharedValue(percent);
  useEffect(() => {
    value.set(withTiming(percent, { duration: 550, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System }));
  }, [percent, value]);
  const fill = useAnimatedStyle(() => ({ width: `${value.get()}%` as `${number}%` }));
  const spoken = `${Math.floor(percent)} percent of your ${goal} minute daily goal`;
  return <View accessible accessibilityRole="progressbar" accessibilityLabel={label}
    accessibilityValue={{ min: 0, max: 100, now: Math.floor(percent), text: spoken }}
    aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.floor(percent)} aria-valuetext={spoken}
    style={[styles.track, { backgroundColor: t.primarySoft }]}>
    <Animated.View style={[styles.fill, { backgroundColor: t.primary }, fill]} />
    {[25, 50, 75].map(mark => <View key={mark} style={[styles.marker, { left: `${mark}%`, backgroundColor: t.surface }]} />)}
  </View>;
}

const styles = StyleSheet.create({
  track: { height: 9, borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
  marker: { position: 'absolute', top: 0, bottom: 0, width: 2, opacity: 0.65 },
});
