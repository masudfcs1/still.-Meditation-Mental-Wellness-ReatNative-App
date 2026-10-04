import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';
import { MeditationSession, Mood, Reminder, ThemePreference } from '../types';
import { validateReminder } from '../features/reminders/model';
import { allowedGoals, backedLessons, createPracticeId, creditPractice, isValidLocalDate, localDateKey, LogPracticeInput, normalizePracticeRecords, PracticeInterval, PracticeRecord, validManualPractice } from './practiceLedger';

export { localDateKey } from './practiceLedger';
export type { LogPracticeInput, PracticeInterval, PracticeRecord, PracticeSource } from './practiceLedger';

interface AppState {
  name: string; theme: ThemePreference; dailyGoal: number; mood: Mood | null; moodDate: string | null; moodHistory: Record<string, Mood>;
  favorites: string[]; completedLessons: Record<string, number[]>; reminders: Reminder[]; completedSessions: PracticeRecord[];
  activeSession: MeditationSession | null; activeRunId: string | null; playerExpanded: boolean; isPlaying: boolean; elapsed: number;
  listenedSeconds: number; sleepTimerElapsed: number;
  backgroundSound: string; volume: number; sleepTimer: number | null; toast: string | null; hasHydrated: boolean; storageError: string | null;
  feedbackDraft: string; setFeedbackDraft: (text: string) => void; recordBreathing: (minutes: number, intervals?: PracticeInterval[]) => void;
  logPractice: (input: LogPracticeInput) => boolean; removePractice: (recordId: string) => void;
  setName: (name: string) => void; setTheme: (theme: ThemePreference) => void;
  setDailyGoal: (goal: number) => void; setMood: (mood: Mood) => void;
  toggleFavorite: (id: string) => void; completeLesson: (id: string, day: number) => void;
  updateReminder: (id: string, updates: Partial<Reminder>) => void;
  startSession: (session: MeditationSession) => void; setPlayerExpanded: (expanded: boolean) => void;
  togglePlaying: () => void; setElapsed: (elapsed: number) => void; tick: () => void; advance: (seconds: number) => void;
  finishSession: () => void; closePlayer: () => void;
  setBackgroundSound: (sound: string) => void; setVolume: (volume: number) => void; setSleepTimer: (minutes: number | null) => void;
  notify: (message: string | null) => void;
}
type SavedState = Pick<AppState, 'name' | 'theme' | 'dailyGoal' | 'mood' | 'moodDate' | 'moodHistory' | 'favorites' | 'completedLessons' | 'reminders' | 'completedSessions' | 'backgroundSound' | 'volume' | 'feedbackDraft' | 'sleepTimer'> & { ledgerVersion: 2; reminderSetupVersion: 1 };
const defaultReminders: Reminder[] = [
  { id: 'morning', title: 'Morning meditation', time: '07:30', enabled: false, days: [1, 2, 3, 4, 5] },
  { id: 'evening', title: 'Evening wind-down', time: '21:00', enabled: false, days: [0, 1, 2, 3, 4, 5, 6] },
];
const initialSaved: SavedState = { ledgerVersion: 2, reminderSetupVersion: 1, name: 'Masud', theme: 'light', dailyGoal: 20, mood: null, moodDate: null, moodHistory: {},
  favorites: ['let-go', 'restful-sleep', 'mindfulness'], completedLessons: {}, reminders: defaultReminders, completedSessions: [],
  backgroundSound: 'Forest', volume: 0.6, sleepTimer: null, feedbackDraft: '' };
const resetPlayback = { activeSession: null, activeRunId: null, isPlaying: false, playerExpanded: false, elapsed: 0, listenedSeconds: 0, sleepTimerElapsed: 0 };
const moods: readonly Mood[] = ['Wonderful', 'Good', 'Okay', 'Low', 'Stressed'];
const isMood = (value: unknown): value is Mood => typeof value === 'string' && moods.includes(value as Mood);
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' ? value as Record<string, unknown> : {};

function normalizeSaved(value: unknown): SavedState {
  const raw = object(value), completedSessions = normalizePracticeRecords(raw.completedSessions);
  const moodHistory = Object.fromEntries(Object.entries(object(raw.moodHistory)).filter(([date, mood]) => isValidLocalDate(date) && isMood(mood))) as Record<string, Mood>;
  const mood = isMood(raw.mood) ? raw.mood : null, moodDate = isValidLocalDate(raw.moodDate) ? raw.moodDate : null;
  if (mood && moodDate) moodHistory[moodDate] = mood;
  const completedLessons = backedLessons(raw.completedLessons, completedSessions, raw.ledgerVersion !== 2);
  const reminders = Array.isArray(raw.reminders) ? raw.reminders.flatMap((item): Reminder[] => {
    const reminder = object(item);
    if (typeof reminder.id !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(reminder.id) || typeof reminder.title !== 'string' || !reminder.title.trim() || typeof reminder.time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(reminder.time)) return [];
    const days = Array.isArray(reminder.days) ? [...new Set(reminder.days.filter((day): day is number => typeof day === 'number' && Number.isInteger(day) && day >= 0 && day <= 6))].sort() : [];
    // Earlier versions only previewed reminders. Keep their choices, but require an explicit opt-in to delivery.
    return [{ id: reminder.id, title: reminder.title.trim().slice(0, 80), time: reminder.time,
      enabled: raw.reminderSetupVersion === 1 && reminder.enabled === true && days.length > 0, days }];
  }) : defaultReminders;
  return { ledgerVersion: 2, reminderSetupVersion: 1, completedSessions, completedLessons, moodHistory, mood, moodDate,
    reminders: reminders.filter((reminder, index) => reminders.findIndex(item => item.id === reminder.id) === index).slice(0, 8),
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name : initialSaved.name,
    theme: raw.theme === 'dark' || raw.theme === 'system' || raw.theme === 'light' ? raw.theme : initialSaved.theme,
    dailyGoal: typeof raw.dailyGoal === 'number' && allowedGoals.includes(raw.dailyGoal as typeof allowedGoals[number]) ? raw.dailyGoal : initialSaved.dailyGoal,
    favorites: Array.isArray(raw.favorites) ? [...new Set(raw.favorites.filter((id): id is string => typeof id === 'string'))] : initialSaved.favorites,
    backgroundSound: typeof raw.backgroundSound === 'string' ? raw.backgroundSound : initialSaved.backgroundSound,
    volume: typeof raw.volume === 'number' && Number.isFinite(raw.volume) ? Math.max(0, Math.min(1, raw.volume)) : initialSaved.volume,
    sleepTimer: typeof raw.sleepTimer === 'number' && Number.isFinite(raw.sleepTimer) && raw.sleepTimer > 0 ? raw.sleepTimer : null,
    feedbackDraft: typeof raw.feedbackDraft === 'string' ? raw.feedbackDraft : '',
  };
}

// Status changes bypass persistence so reporting a storage error never causes another failed write.
let setTransient: (update: Partial<AppState>) => void = () => {};
let canWrite = false;
let writes: Promise<void> = Promise.resolve();
let storageWriteError: string | null = null;
const localStorage: StateStorage = {
  getItem: async key => { await writes; const value = await AsyncStorage.getItem(key); canWrite = true; return value; },
  setItem: (key, value) => {
    // A failed initial read must not overwrite saved activity with an empty initial state.
    if (!canWrite) return Promise.resolve();
    writes = writes.then(async () => {
      try { await AsyncStorage.setItem(key, value); storageWriteError = null; setTransient({ storageError: null }); }
      catch { storageWriteError = 'Your latest practice could not be saved on this device. Please try again.'; setTransient({ storageError: storageWriteError }); }
    });
    return writes;
  },
  removeItem: async key => { await writes; await AsyncStorage.removeItem(key); },
};

export const isAppStorageReady = () => canWrite;
export async function flushAppStorage(): Promise<boolean> {
  await writes;
  return canWrite && !storageWriteError;
}

const persistedCreator = persist<AppState, [], [], SavedState>((set, get) => ({
  ...initialSaved, ...resetPlayback, toast: null, hasHydrated: false, storageError: null,
  setFeedbackDraft: feedbackDraft => set({ feedbackDraft }),
  recordBreathing: (minutes, intervals) => {
    if (!get().hasHydrated || !Number.isFinite(minutes) || minutes <= 0 || minutes > 180) return;
    const seconds = minutes * 60, now = Date.now();
    const activeIntervals = intervals ?? [{ startTime: now - seconds * 1000, seconds }];
    if (!Array.isArray(activeIntervals) || !activeIntervals.length || activeIntervals.some(interval => !interval
      || !Number.isFinite(interval.seconds) || interval.seconds <= 0 || !Number.isFinite(interval.startTime)
      || !Number.isFinite(new Date(interval.startTime).getTime()) || !Number.isFinite(new Date(interval.startTime + interval.seconds * 1000).getTime()))
      || Math.abs(activeIntervals.reduce((sum, interval) => sum + interval.seconds, 0) - seconds) > 1e-6) return;
    const runId = createPracticeId('breathing');
    set(s => ({ completedSessions: activeIntervals.reduce((records, interval, index) => creditPractice(records, {
      runId, id: 'breathing-practice', title: 'Breathing practice', category: 'Breathwork', source: 'breathing',
      ...interval, alreadyCounted: index > 0,
    }), s.completedSessions), toast: `${minutes} minutes of breathing saved to your practice.` }));
  },
  logPractice: input => {
    if (!get().hasHydrated || !validManualPractice(input)) return false;
    const record: PracticeRecord = { recordId: createPracticeId('manual'), id: 'manual-practice', source: 'manual', date: input.date,
      category: input.category, title: input.title?.trim().slice(0, 100) || 'Personal practice', seconds: input.minutes * 60,
      minutes: input.minutes, recordedAt: new Date().toISOString(), sessionCount: 1 };
    set(s => ({ completedSessions: [...s.completedSessions, record], toast: 'Your practice has been added.' }));
    return true;
  },
  removePractice: recordId => set(s => ({ completedSessions: s.completedSessions.filter(record => record.recordId !== recordId || record.source !== 'manual') })),
  setName: name => set({ name }), setTheme: theme => set({ theme }),
  setDailyGoal: dailyGoal => { if (allowedGoals.includes(dailyGoal as typeof allowedGoals[number])) set({ dailyGoal }); },
  setMood: mood => {
    if (!isMood(mood)) return;
    set(s => { const moodDate = localDateKey(); return { mood, moodDate, moodHistory: { ...s.moodHistory, ...(s.mood && s.moodDate ? { [s.moodDate]: s.mood } : {}), [moodDate]: mood } }; });
  },
  toggleFavorite: id => set(s => ({ favorites: s.favorites.includes(id) ? s.favorites.filter(f => f !== id) : [...s.favorites, id] })),
  completeLesson: (id, day) => { if (get().completedSessions.some(record => record.id === `program:${id}:${day}` && record.lessonCompleted)) set(s => ({ completedLessons: { ...s.completedLessons, [id]: [...new Set([...(s.completedLessons[id] || []), day])] } })); },
  updateReminder: (id, updates) => {
    const current = get().reminders.find(reminder => reminder.id === id);
    if (!get().hasHydrated || !current) return;
    const next = { ...current, ...updates, id };
    if (validateReminder(next)) return;
    set(s => ({ reminders: s.reminders.map(reminder => reminder.id === id ? { ...next, days: [...next.days].sort() } : reminder) }));
  },
  startSession: activeSession => {
    if (!get().hasHydrated || !Number.isFinite(activeSession.duration * 60) || activeSession.duration <= 0) return;
    set({ activeSession, activeRunId: createPracticeId('timer'), isPlaying: true, elapsed: 0, listenedSeconds: 0, sleepTimerElapsed: 0, playerExpanded: true });
  },
  setPlayerExpanded: playerExpanded => set({ playerExpanded }),
  togglePlaying: () => set(s => ({ isPlaying: s.activeSession ? !s.isPlaying : false })),
  setElapsed: elapsed => { if (Number.isFinite(elapsed)) set(s => ({ elapsed: s.activeSession ? Math.max(0, Math.min(elapsed, s.activeSession.duration * 60)) : 0 })); },
  tick: () => get().advance(1),
  advance: seconds => {
    const s = get();
    if (!s.isPlaying || !s.activeSession || !s.activeRunId || !Number.isFinite(seconds) || seconds <= 0) return;
    const duration = s.activeSession.duration * 60;
    const timerRemaining = s.sleepTimer === null ? Infinity : Math.max(0, s.sleepTimer * 60 - s.sleepTimerElapsed);
    const actualSeconds = Math.min(seconds, Math.max(0, duration - s.elapsed), timerRemaining);
    const elapsed = s.elapsed + actualSeconds, sleepTimerElapsed = s.sleepTimerElapsed + actualSeconds;
    const intervalStart = Date.now() - seconds * 1000;
    // Reject impossible clock jumps without changing either playback or its ledger.
    if (!Number.isFinite(new Date(intervalStart).getTime())) return;
    const completedSessions = creditPractice(s.completedSessions, { runId: s.activeRunId, id: s.activeSession.id, title: s.activeSession.title,
      category: s.activeSession.category, source: 'timer', startTime: intervalStart, seconds: actualSeconds, alreadyCounted: s.listenedSeconds > 0 });
    set({ elapsed, listenedSeconds: s.listenedSeconds + actualSeconds, sleepTimerElapsed, completedSessions });
    if (elapsed >= duration || (s.sleepTimer !== null && sleepTimerElapsed >= s.sleepTimer * 60)) get().finishSession();
  },
  finishSession: () => {
    const s = get();
    if (!s.activeSession) return;
    const match = s.activeSession.id.match(/^program:([^:]+):(\d+)$/);
    const fullLesson = !!match && s.elapsed >= s.activeSession.duration * 60 && s.listenedSeconds >= s.activeSession.duration * 60;
    const completedLessons = fullLesson && match ? { ...s.completedLessons, [match[1]]: [...new Set([...(s.completedLessons[match[1]] || []), Number(match[2])])] } : s.completedLessons;
    const completedSessions = fullLesson ? s.completedSessions.map(record => record.recordId?.startsWith(`${s.activeRunId}:`) && record.sessionCount === 1 ? { ...record, lessonCompleted: true } : record) : s.completedSessions;
    const practiced = s.listenedSeconds >= 60 ? `${Math.floor(s.listenedSeconds / 60)}m ${Math.floor(s.listenedSeconds % 60)}s` : `${Math.floor(s.listenedSeconds)}s`;
    set({ ...resetPlayback, completedSessions, completedLessons, toast: s.listenedSeconds > 0 ? `${practiced} of practice saved. A little more space for you.` : 'A mindful pause matters, however small.' });
  },
  closePlayer: () => set(resetPlayback),
  setBackgroundSound: backgroundSound => set({ backgroundSound }),
  setVolume: volume => { if (Number.isFinite(volume)) set({ volume: Math.max(0, Math.min(1, volume)) }); },
  setSleepTimer: sleepTimer => { if (sleepTimer === null || (Number.isFinite(sleepTimer) && sleepTimer > 0)) set({ sleepTimer, sleepTimerElapsed: 0 }); },
  notify: toast => set({ toast }),
}), {
  name: 'still-wellness-v1', version: 2, storage: createJSONStorage<SavedState>(() => localStorage),
  partialize: s => ({ ledgerVersion: 2, reminderSetupVersion: 1, name: s.name, theme: s.theme, dailyGoal: s.dailyGoal, mood: s.mood, moodDate: s.moodDate, moodHistory: s.moodHistory,
    favorites: s.favorites, completedLessons: s.completedLessons, reminders: s.reminders, completedSessions: s.completedSessions,
    backgroundSound: s.backgroundSound, volume: s.volume, feedbackDraft: s.feedbackDraft, sleepTimer: s.sleepTimer }),
  migrate: saved => normalizeSaved(saved),
  merge: (saved, current) => saved ? { ...current, ...normalizeSaved(saved), ...resetPlayback } : current,
  onRehydrateStorage: () => {
    setTransient({ hasHydrated: false });
    return (_state, error) => {
      if (error) canWrite = false;
      setTransient({ hasHydrated: true, storageError: error ? 'Your saved practice could not be loaded. Please reload to try again.' : storageWriteError });
    };
  },
});
const creator: typeof persistedCreator = (set, get, api) => { setTransient = update => set(update); return persistedCreator(set, get, api); };
export const useAppStore = create<AppState>()(creator);
