import React from 'react';
import { Page } from '../components/Page';
import { BreathingScreen } from '../features/breathing/BreathingScreen';
import { navigateScreen } from '../navigation/routes';

export default function BreathingRoute() {
  return <Page><BreathingScreen onNavigate={navigateScreen} /></Page>;
}
