import React from 'react';
import { ScrollView, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../theme';

export function Page({ children, scrollRef }: React.PropsWithChildren<{ scrollRef?: React.Ref<ScrollView> }>) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const activeSession = useAppStore(s => s.activeSession);
  return <ScrollView ref={scrollRef} style={{ flex: 1, backgroundColor: t.background }} contentContainerStyle={{ padding: width >= 1000 ? 32 : width >= 600 ? 28 : width < 360 ? 14 : 20, paddingTop: width >= 600 ? 27 : 23, paddingBottom: activeSession ? 114 : 35 }} keyboardShouldPersistTaps="handled"><Animated.View entering={FadeIn.duration(320).reduceMotion(ReduceMotion.System)} style={{ width: '100%', maxWidth: 1320, alignSelf: 'center' }}>{children}</Animated.View></ScrollView>;
}
