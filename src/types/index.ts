export type ScreenName = 'Home' | 'Explore' | 'Meditate' | 'Analytics' | 'Profile' | 'Breathing' | 'Sleep' | 'Programs' | 'Favorites' | 'Settings' | 'Achievements';
export type Navigate = (screen: ScreenName) => void;
export type Mood = 'Wonderful' | 'Good' | 'Okay' | 'Low' | 'Stressed';
export type ThemePreference = 'system' | 'light' | 'dark';
export type Category = 'Mindfulness' | 'Sleep' | 'Focus' | 'Stress relief' | 'Breathwork' | 'Self love';
export interface MeditationSession {
  id: string;
  title: string;
  subtitle: string;
  duration: number;
  instructor: string;
  category: Category;
  image: number;
  color: string;
  difficulty: 'Beginner' | 'Intermediate' | 'All levels';
}
export interface Program {
  id: string;
  title: string;
  description: string;
  image: number;
  days: number;
  category: Category;
  lessons: string[];
}
export interface ActivityDay {
  date: string;
  minutes: number;
  sessions: number;
  breathingMinutes: number;
  sleepMinutes: number;
  mood: number;
  category: Category;
}
export type AnalyticsRange = '7D' | '1M' | '3M' | '6M' | '1Y' | 'ALL';
export interface Reminder {
  id: string;
  title: string;
  time: string;
  enabled: boolean;
  days: number[];
}
