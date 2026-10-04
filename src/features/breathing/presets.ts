export const breathingDurations = [1, 3, 5, 10] as const;
export type BreathingDuration = typeof breathingDurations[number];

/** Only supported, unambiguous route values can configure the practice timer. */
export function resolveBreathingDuration(value: string | string[] | undefined): BreathingDuration {
  if (typeof value !== 'string') return 3;
  return breathingDurations.find(minutes => String(minutes) === value) ?? 3;
}

export interface BreathingMoment {
  id: 'morning' | 'daytime' | 'evening';
  exerciseId: 'deep' | 'focus' | 'calm';
  title: string;
  overline: string;
  description: string;
  duration: BreathingDuration;
}

export const breathingMoments: BreathingMoment[] = [
  { id: 'morning', exerciseId: 'deep', title: 'Morning reset', overline: 'BEGIN WITH A LITTLE SPACE', description: 'A slow, open breath before the day asks anything of you.', duration: 3 },
  { id: 'daytime', exerciseId: 'focus', title: 'Between tasks', overline: 'LET ONE MOMENT SETTLE', description: 'Put one thing down. Find your rhythm before the next.', duration: 1 },
  { id: 'evening', exerciseId: 'calm', title: 'Evening unwind', overline: 'LEAVE THE DAY HERE', description: 'Soften the pace with a longer exhale and an unhurried pause.', duration: 5 },
];
