import { useMemo } from 'react';
import { Clock3, Flame, Leaf, LucideIcon, Moon, Sprout, Star, Sun, Trophy, Wind } from 'lucide-react-native';
import { useLocalActivity } from '../../hooks/useLocalActivity';
import { useAppStore } from '../../store/useAppStore';
import { getAnalyticsByRange, parseDate } from '../../utils/analytics';

export interface Achievement { id: string; title: string; description: string; icon: LucideIcon; current: number; target: number; unit: string; color: 'green' | 'peach' | 'lavender'; }

export function useProfileStats() {
  const completed = useAppStore(s => s.completedSessions);
  const dailyGoal = useAppStore(s => s.dailyGoal);
  const { activity, todayKey, hydrated, storageError } = useLocalActivity();
  return useMemo(() => {
    const stats = getAnalyticsByRange('ALL', activity, dailyGoal, parseDate(todayKey));
    const achievements: Achievement[] = [
      { id: 'first', title: 'First meditation', description: 'Every journey begins with a moment.', icon: Sprout, current: stats.totalSessions, target: 1, unit: 'session', color: 'green' },
      { id: 'three', title: 'A little rhythm', description: 'Practice for 3 days in a row.', icon: Leaf, current: stats.longestStreak, target: 3, unit: 'days', color: 'green' },
      { id: 'seven', title: 'One mindful week', description: 'Show up for yourself 7 days in a row.', icon: Flame, current: stats.longestStreak, target: 7, unit: 'days', color: 'peach' },
      { id: 'thirty', title: 'A lasting habit', description: 'Find your flow for 30 consecutive days.', icon: Trophy, current: stats.longestStreak, target: 30, unit: 'days', color: 'peach' },
      { id: 'hundred', title: '100 quiet minutes', description: 'Make space for 100 mindful minutes.', icon: Wind, current: stats.totalMinutes, target: 100, unit: 'min', color: 'lavender' },
      { id: 'ten', title: 'Keep coming back', description: 'Complete your first 10 sessions.', icon: Star, current: stats.totalSessions, target: 10, unit: 'sessions', color: 'lavender' },
      { id: 'hour', title: 'An hour of presence', description: 'Gather 60 minutes of meditation.', icon: Clock3, current: stats.totalMinutes, target: 60, unit: 'min', color: 'green' },
      { id: 'early', title: 'Early bird', description: 'Complete a session before 9 AM.', icon: Sun, current: completed.some(item => item.hour !== undefined && item.hour < 9) ? 1 : 0, target: 1, unit: 'morning session', color: 'peach' },
      { id: 'night', title: 'Night owl', description: 'Wind down with a session after 9 PM.', icon: Moon, current: completed.some(item => item.hour !== undefined && item.hour >= 21) ? 1 : 0, target: 1, unit: 'evening session', color: 'lavender' },
      { id: 'master', title: 'Mindfulness master', description: 'A thousand minutes, one breath at a time.', icon: Trophy, current: stats.totalMinutes, target: 1000, unit: 'min', color: 'green' },
    ];
    return { stats, achievements, earned: achievements.filter(item => item.current >= item.target).length, todayKey, hydrated, storageError };
  }, [activity, completed, dailyGoal, todayKey, hydrated, storageError]);
}
