import React from 'react';
import { Page } from '../components/Page';
import { AnalyticsScreen } from '../features/analytics/AnalyticsScreen';
import { navigateScreen } from '../navigation/routes';

export default function AnalyticsRoute() {
  return <Page><AnalyticsScreen onNavigate={navigateScreen} /></Page>;
}
