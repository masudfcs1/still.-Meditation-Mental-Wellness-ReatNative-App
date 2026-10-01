import React from 'react';
import { Page } from '../components/Page';
import { ProgramsScreen } from '../features/programs/ProgramsScreen';
import { navigateScreen } from '../navigation/routes';

export default function ProgramsRoute() {
  return <Page><ProgramsScreen onNavigate={navigateScreen} /></Page>;
}
