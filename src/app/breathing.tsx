import React, { useEffect, useRef } from 'react';
import type { ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Page } from '../components/Page';
import { BreathingScreen } from '../features/breathing/BreathingScreen';
import { navigateScreen } from '../navigation/routes';

export default function BreathingRoute() {
  const scrollRef = useRef<ScrollView>(null);
  const { category, practice, exercise } = useLocalSearchParams<{ category?: string; practice?: string; exercise?: string }>();
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [category, practice, exercise]);
  return <Page scrollRef={scrollRef}><BreathingScreen onNavigate={navigateScreen} onPrepare={() => scrollRef.current?.scrollTo({ y: 0, animated: false })} /></Page>;
}
