import { breathingDurations, resolveBreathingDuration, type BreathingDuration } from './presets';

export type PhaseName = 'Inhale' | 'Hold' | 'Exhale' | 'Rest';
export type BreathingExerciseId = 'box' | '478' | 'deep' | 'calm' | 'focus';

export interface BreathingExercise {
  id: BreathingExerciseId;
  name: string;
  subtitle: string;
  description: string;
  benefit: string;
  pattern: { name: PhaseName; seconds: number }[];
}

export const breathingExercises: BreathingExercise[] = [
  { id: 'box', name: 'Box breathing', subtitle: 'Find your balance', description: 'Four equal parts. A little structure to help you feel steady and present.', benefit: 'A gentle reset for busy moments', pattern: [{ name: 'Inhale', seconds: 4 }, { name: 'Hold', seconds: 4 }, { name: 'Exhale', seconds: 4 }, { name: 'Rest', seconds: 4 }] },
  { id: '478', name: '4–7–8 breathing', subtitle: 'Slow down, soften', description: 'Breathe in softly, pause, then let your breath out slowly. Follow a pace that feels comfortable.', benefit: 'Create space to unwind', pattern: [{ name: 'Inhale', seconds: 4 }, { name: 'Hold', seconds: 7 }, { name: 'Exhale', seconds: 8 }] },
  { id: 'deep', name: 'Deep breathing', subtitle: 'Come back to yourself', description: 'Let the belly gently rise as you inhale. Release your breath without pushing.', benefit: 'Reconnect with your natural rhythm', pattern: [{ name: 'Inhale', seconds: 5 }, { name: 'Exhale', seconds: 5 }] },
  { id: 'calm', name: 'Relaxation', subtitle: 'Make room for calm', description: 'An easy inhale followed by a longer, softer exhale. Allow your shoulders to settle.', benefit: 'A peaceful transition into rest', pattern: [{ name: 'Inhale', seconds: 4 }, { name: 'Exhale', seconds: 6 }, { name: 'Rest', seconds: 2 }] },
  { id: 'focus', name: 'Focus', subtitle: 'One breath at a time', description: 'Keep your attention on a steady rhythm. Whenever your mind wanders, return to the next breath.', benefit: 'A mindful pause before your next task', pattern: [{ name: 'Inhale', seconds: 4 }, { name: 'Hold', seconds: 2 }, { name: 'Exhale', seconds: 4 }, { name: 'Rest', seconds: 2 }] },
];

export interface BreathingPracticeOption {
  id: string;
  title: string;
  description: string;
  exerciseId: BreathingExerciseId;
  duration: BreathingDuration;
  tag: string;
}

export interface BreathingCategory {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  tone: 'sage' | 'sand' | 'blue' | 'lavender' | 'rose';
  practices: BreathingPracticeOption[];
}

export const breathingCategories: BreathingCategory[] = [
  {
    id: 'calm', title: 'Calm', subtitle: 'Come back to quiet', tone: 'sage',
    description: 'Put the rush down for a moment. Find a softer pace, one easy breath at a time.',
    practices: [
      { id: 'soft-landing', title: 'Soft landing', description: 'Ease into a longer exhale and let your shoulders settle.', exerciseId: 'calm', duration: 3, tag: 'Gentle reset' },
      { id: 'return-to-center', title: 'Return to center', description: 'Follow an even, unhurried rhythm with no breath holds.', exerciseId: 'deep', duration: 5, tag: 'Steady rhythm' },
    ],
  },
  {
    id: 'energy', title: 'Energy', subtitle: 'Meet the day gently', tone: 'sand',
    description: 'Bring a little attention to this moment before moving into whatever comes next.',
    practices: [
      { id: 'wake-up-gently', title: 'Wake up gently', description: 'Make room for the morning with a few easy, even breaths.', exerciseId: 'deep', duration: 3, tag: 'Fresh start' },
      { id: 'ready-for-the-day', title: 'Ready for the day', description: 'Take a brief, steady pause before your next step.', exerciseId: 'focus', duration: 1, tag: 'Quick focus' },
    ],
  },
  {
    id: 'clear-mind', title: 'Clear mind', subtitle: 'One thing at a time', tone: 'blue',
    description: 'Give your attention somewhere simple to rest. You can return to the next breath whenever you need.',
    practices: [
      { id: 'one-thing-at-a-time', title: 'One thing at a time', description: 'Let a measured rhythm guide your attention back to the present.', exerciseId: 'focus', duration: 3, tag: 'Focused pause' },
      { id: 'quiet-the-noise', title: 'Quiet the noise', description: 'Move through four equal steps at a comfortable pace.', exerciseId: 'box', duration: 5, tag: 'Balanced breath' },
    ],
  },
  {
    id: 'relaxation', title: 'Relaxation', subtitle: 'Let the pace soften', tone: 'lavender',
    description: 'Leave a little space between the day and your next moment. There is no hurry here.',
    practices: [
      { id: 'let-the-day-go', title: 'Let the day go', description: 'Follow a soft inhale and a longer exhale as you unwind.', exerciseId: 'calm', duration: 5, tag: 'Evening unwind' },
      { id: 'long-quiet-exhale', title: 'Long, quiet exhale', description: 'Explore a slow 4–7–8 rhythm, only at a pace that feels comfortable.', exerciseId: '478', duration: 3, tag: 'Slow rhythm' },
    ],
  },
  {
    id: 'male-power', title: 'Male power', subtitle: 'Grounded confidence', tone: 'sand',
    description: 'Make a little room for steadiness, confidence, and balanced focus in your everyday life.',
    practices: [
      { id: 'grounded-confidence', title: 'Grounded confidence', description: 'Stand or sit comfortably and reconnect with an easy, even breath.', exerciseId: 'deep', duration: 3, tag: 'Feel grounded' },
      { id: 'focused-presence', title: 'Focused presence', description: 'Use four balanced steps to settle your attention before a busy moment.', exerciseId: 'box', duration: 3, tag: 'Balanced focus' },
    ],
  },
  {
    id: 'box-breathing', title: 'Box breathing', subtitle: 'Four steps to steady', tone: 'blue',
    description: 'Inhale, pause, exhale, and rest. Follow an even square of breath at a comfortable pace.',
    practices: [
      { id: 'a-balanced-minute', title: 'A balanced minute', description: 'Make a short space in your day for four equal parts of breath.', exerciseId: 'box', duration: 1, tag: 'One-minute pause' },
      { id: 'find-your-square', title: 'Find your square', description: 'Spend a little longer following a familiar, balanced rhythm.', exerciseId: 'box', duration: 5, tag: 'Steady practice' },
    ],
  },
  {
    id: 'lung-health', title: 'Lung health', subtitle: 'An easy, natural breath', tone: 'sage',
    description: 'Notice the gentle movement of your breath without holding it or trying to push it further.',
    practices: [
      { id: 'easy-natural-breaths', title: 'Easy, natural breaths', description: 'Follow an easy inhale and exhale with no pauses or breath holds.', exerciseId: 'deep', duration: 3, tag: 'No breath holds' },
      { id: 'room-to-breathe', title: 'Room to breathe', description: 'Take your time noticing how each comfortable breath comes and goes.', exerciseId: 'deep', duration: 5, tag: 'Gentle awareness' },
    ],
  },
  {
    id: 'freedom', title: 'Freedom', subtitle: 'A little more space', tone: 'rose',
    description: 'Step away from the rush. Let this moment be simple, open, and entirely yours.',
    practices: [
      { id: 'a-little-more-space', title: 'A little more space', description: 'Meet each inhale and exhale without needing to change anything else.', exerciseId: 'deep', duration: 3, tag: 'Open attention' },
      { id: 'let-tension-soften', title: 'Let tension soften', description: 'Let your shoulders ease as you follow a longer, softer exhale.', exerciseId: 'calm', duration: 5, tag: 'Easy release' },
    ],
  },
  {
    id: 'recovery', title: 'Recovery', subtitle: 'Make room for rest', tone: 'lavender',
    description: 'After a full day, you can take a moment to pause. Settle into a rhythm that asks a little less of you.',
    practices: [
      { id: 'a-pause-to-recharge', title: 'A pause to recharge', description: 'Rest your attention on an even breath without any holds.', exerciseId: 'deep', duration: 3, tag: 'Restful pause' },
      { id: 'settle-after-your-day', title: 'Settle after your day', description: 'Ease into a slower exhale and an unhurried moment of quiet.', exerciseId: 'calm', duration: 5, tag: 'Time to rest' },
    ],
  },
  {
    id: 'stress-relief', title: 'Stress relief', subtitle: 'Set the rush down', tone: 'sage',
    description: 'When the day feels full, a simple rhythm can give your attention somewhere gentle to land.',
    practices: [
      { id: 'steady-in-the-moment', title: 'Steady in the moment', description: 'Follow four equal steps and return to one breath at a time.', exerciseId: 'box', duration: 3, tag: 'Calm focus' },
      { id: 'make-space-to-settle', title: 'Make space to settle', description: 'Take a soft inhale, then let your exhale unfold a little longer.', exerciseId: 'calm', duration: 5, tag: 'Longer exhale' },
    ],
  },
];

export function getBreathingCategory(value: unknown): BreathingCategory | undefined {
  if (typeof value !== 'string') return undefined;
  return breathingCategories.find(category => category.id === value);
}

export interface BreathingRouteInput {
  category?: unknown;
  exercise?: unknown;
  practice?: unknown;
  duration?: unknown;
}

export interface BreathingRoute {
  view: 'library' | 'category' | 'practice';
  category?: BreathingCategory;
  exercise?: BreathingExercise;
  practice?: BreathingPracticeOption;
  duration: BreathingDuration;
}

function routeDuration(value: unknown, fallback: BreathingDuration): BreathingDuration {
  return typeof value === 'string' && breathingDurations.some(duration => String(duration) === value)
    ? resolveBreathingDuration(value)
    : fallback;
}

/** Resolve catalog choices and existing direct links without guessing at malformed query values. */
export function resolveBreathingRoute(input: BreathingRouteInput): BreathingRoute {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { view: 'library', duration: 3 };
  const category = getBreathingCategory(input.category);
  const exercise = typeof input.exercise === 'string' ? breathingExercises.find(item => item.id === input.exercise) : undefined;
  const ambiguousCatalog = Array.isArray(input.category) || Array.isArray(input.practice);
  if (ambiguousCatalog) {
    return exercise
      ? { view: 'practice', exercise, duration: routeDuration(input.duration, 3) }
      : { view: 'library', duration: 3 };
  }

  if (category && typeof input.practice === 'string') {
    const practice = category.practices.find(item => item.id === input.practice);
    if (!practice) return { view: 'category', category, duration: 3 };
    const selectedExercise = breathingExercises.find(item => item.id === practice.exerciseId)!;
    return { view: 'practice', category, practice, exercise: selectedExercise, duration: routeDuration(input.duration, practice.duration) };
  }

  if (exercise) return { view: 'practice', ...(category ? { category } : {}), exercise, duration: routeDuration(input.duration, 3) };
  if (category) return { view: 'category', category, duration: 3 };
  return { view: 'library', duration: 3 };
}
