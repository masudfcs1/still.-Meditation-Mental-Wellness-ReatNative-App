import { Href, router } from 'expo-router';
import { Navigate, ScreenName } from '../types';

export const screenPaths = {
  Home: '/', Explore: '/explore', Meditate: '/meditate', Analytics: '/analytics',
  Profile: '/profile', Breathing: '/breathing', Sleep: '/sleep', Programs: '/programs',
  Favorites: '/favorites', Settings: '/settings', Achievements: '/achievements',
} as const satisfies Record<ScreenName, Href>;

export const navigateScreen: Navigate = screen => router.navigate(screenPaths[screen]);

export function screenFromPath(path: string): ScreenName {
  const normalized = path.replace(/\/$/, '') || '/';
  return (Object.keys(screenPaths) as ScreenName[]).find(screen => screenPaths[screen] === normalized) || 'Home';
}
