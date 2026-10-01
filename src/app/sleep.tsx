import React from 'react';
import { Page } from '../components/Page';
import { SleepScreen } from '../features/sleep/SleepScreen';
import { navigateScreen } from '../navigation/routes';

export default function SleepRoute() {
  return <Page><SleepScreen onNavigate={navigateScreen} /></Page>;
}
