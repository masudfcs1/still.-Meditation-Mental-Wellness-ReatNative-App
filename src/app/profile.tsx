import React from 'react';
import { Page } from '../components/Page';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { navigateScreen } from '../navigation/routes';

export default function ProfileRoute() {
  return <Page><ProfileScreen onNavigate={navigateScreen} /></Page>;
}
