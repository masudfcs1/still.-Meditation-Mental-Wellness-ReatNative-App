import React, { useRef } from 'react';
import type { ScrollView } from 'react-native';
import { Page } from '../components/Page';
import { BreathingScreen } from '../features/breathing/BreathingScreen';
import { navigateScreen } from '../navigation/routes';

export default function BreathingRoute() {
  const scrollRef = useRef<ScrollView>(null);
  return <Page scrollRef={scrollRef}><BreathingScreen onNavigate={navigateScreen} onPrepare={() => scrollRef.current?.scrollTo({ y: 0, animated: false })} /></Page>;
}
