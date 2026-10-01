import React from 'react';
import { Page } from '../components/Page';
import { AchievementsScreen } from '../features/profile/AchievementsScreen';
import { navigateScreen } from '../navigation/routes';

export default function AchievementsRoute() {
  return <Page><AchievementsScreen onNavigate={navigateScreen} /></Page>;
}
