import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { localDateKey, useAppStore } from '../store/useAppStore';
import { mergeActivity } from '../utils/analytics';

/** Refresh date-based summaries at local midnight and when returning to the app. */
export function useTodayKey() {
  const [todayKey, setTodayKey] = useState(localDateKey);
  useEffect(() => {
    const refresh = () => setTodayKey(localDateKey());
    const interval = setInterval(refresh, 15_000);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    return () => { clearInterval(interval); subscription.remove(); };
  }, []);
  return todayKey;
}

/** All personal statistics share the same locally persisted source of truth. */
export function useLocalActivity() {
  const completed = useAppStore(state => state.completedSessions);
  const mood = useAppStore(state => state.mood);
  const moodDate = useAppStore(state => state.moodDate);
  const moodHistory = useAppStore(state => state.moodHistory);
  const hydrated = useAppStore(state => state.hasHydrated);
  const storageError = useAppStore(state => state.storageError);
  const todayKey = useTodayKey();
  const activity = useMemo(
    () => mergeActivity([], completed, mood, moodDate, moodHistory),
    [completed, mood, moodDate, moodHistory],
  );
  return { activity, todayKey, hydrated, storageError };
}
