import React from 'react';
import { Page } from '../components/Page';
import { FavoritesScreen } from '../features/favorites/FavoritesScreen';
import { navigateScreen } from '../navigation/routes';

export default function FavoritesRoute() {
  return <Page><FavoritesScreen onNavigate={navigateScreen} /></Page>;
}
