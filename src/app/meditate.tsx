import React from 'react';
import { Page } from '../components/Page';
import { ExploreScreen } from '../features/explore/ExploreScreen';
import { navigateScreen } from '../navigation/routes';

export default function MeditateRoute() {
  return <Page><ExploreScreen onNavigate={navigateScreen} initialCategory="Mindfulness" /></Page>;
}
