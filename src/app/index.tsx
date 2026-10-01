import React from 'react';
import { Page } from '../components/Page';
import { HomeScreen } from '../features/home/HomeScreen';
import { navigateScreen } from '../navigation/routes';

export default function IndexRoute() {
  return <Page><HomeScreen onNavigate={navigateScreen} /></Page>;
}
