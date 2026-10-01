import { artwork } from '../../mock/content';
import { MeditationSession } from '../../types';

export const sleepSounds = [
  { id: 'rain', title: 'Soft rain', subtitle: 'A gentle rainfall, a quieter mind.', image: artwork.forest, sound: 'Rain', color: '#DBE6DC' },
  { id: 'ocean', title: 'Ocean at dusk', subtitle: 'Let the waves carry the day away.', image: artwork.ocean, sound: 'Ocean', color: '#DCE8EB' },
  { id: 'forest', title: 'Forest retreat', subtitle: 'Rest beneath a canopy of calm.', image: artwork.lake, sound: 'Forest', color: '#DEE7D7' },
  { id: 'night', title: 'Quiet night', subtitle: 'A soft soundscape for drifting off.', image: artwork.night, sound: 'Night', color: '#E2DEED' },
];

export function sleepSoundSession(sound: typeof sleepSounds[number], duration = 30): MeditationSession {
  return { id: `sleep-sound:${sound.id}`, title: sound.title, subtitle: sound.subtitle, duration, instructor: 'Still soundscapes', category: 'Sleep', image: sound.image, color: sound.color, difficulty: 'All levels' };
}
