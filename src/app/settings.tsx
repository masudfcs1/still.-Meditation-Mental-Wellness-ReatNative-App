import React from 'react';
import { Page } from '../components/Page';
import { SettingsScreen } from '../features/profile/SettingsScreen';
import { navigateScreen } from '../navigation/routes';

export default function SettingsRoute() {
  return <Page><SettingsScreen onNavigate={navigateScreen} /></Page>;
}
