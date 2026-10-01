import { MeditationSession, Program } from '../types';

export const artwork = {
  forest: require('../../assets/images/forest.jpg'),
  mountain: require('../../assets/images/mountain.jpg'),
  ocean: require('../../assets/images/ocean.jpg'),
  desert: require('../../assets/images/desert.jpg'),
  lake: require('../../assets/images/lake.jpg'),
  night: require('../../assets/images/night.jpg'),
};
export const sessions: MeditationSession[] = [
  { id: 'morning-stillness', title: 'Morning stillness', subtitle: 'A softer start to your day.', duration: 15, instructor: 'Sarah Mitchell', category: 'Mindfulness', image: artwork.forest, color: '#E6EDE2', difficulty: 'All levels' },
  { id: 'let-go', title: 'The art of letting go', subtitle: 'Make room for a lighter mind.', duration: 12, instructor: 'James Chen', category: 'Stress relief', image: artwork.mountain, color: '#E9ECF2', difficulty: 'Beginner' },
  { id: 'deep-focus', title: 'A little more focus', subtitle: 'Find clarity, one breath at a time.', duration: 20, instructor: 'Emma Wilson', category: 'Focus', image: artwork.desert, color: '#F2EAE0', difficulty: 'All levels' },
  { id: 'restful-sleep', title: 'Drift into deep sleep', subtitle: 'Let the day gently fall away.', duration: 30, instructor: 'Sarah Mitchell', category: 'Sleep', image: artwork.night, color: '#E8E7F2', difficulty: 'All levels' },
  { id: 'ocean-breath', title: 'Breathe with the ocean', subtitle: 'Come back to your natural rhythm.', duration: 10, instructor: 'James Chen', category: 'Breathwork', image: artwork.ocean, color: '#DFECEB', difficulty: 'Beginner' },
  { id: 'kindness', title: 'A moment for yourself', subtitle: 'Meet yourself with a little kindness.', duration: 15, instructor: 'Emma Wilson', category: 'Self love', image: artwork.lake, color: '#E8EDDF', difficulty: 'Beginner' },
  { id: 'body-scan', title: 'Release & restore', subtitle: 'Unwind from your head to your toes.', duration: 18, instructor: 'Sarah Mitchell', category: 'Stress relief', image: artwork.forest, color: '#E6EDE2', difficulty: 'All levels' },
  { id: 'quiet-mind', title: 'A quieter mind', subtitle: 'A peaceful pause in a busy world.', duration: 8, instructor: 'James Chen', category: 'Mindfulness', image: artwork.lake, color: '#E8EDDF', difficulty: 'Beginner' },
  { id: 'sleep-story', title: 'The sleepy mountain village', subtitle: 'A gentle story under the stars.', duration: 45, instructor: 'Emma Wilson', category: 'Sleep', image: artwork.mountain, color: '#E9ECF2', difficulty: 'All levels' },
];
export const programs: Program[] = [
  { id: 'mindfulness', title: '7 days of mindfulness', description: 'Small moments. Meaningful change. Build a practice that feels like you.', image: artwork.forest, days: 7, category: 'Mindfulness', lessons: ['Begin where you are', 'The art of awareness', 'Coming back to the breath', 'Finding your focus', 'Making space for thoughts', 'A little gratitude', 'Carry the calm with you'] },
  { id: 'better-sleep', title: 'Your journey to better sleep', description: 'Create a restful evening ritual and rediscover deeper sleep.', image: artwork.night, days: 7, category: 'Sleep', lessons: ['Unwinding your day', 'A restful space', 'The body scan', 'Quieting the mind', 'Breathing into rest', 'Letting go', 'Your evening ritual'] },
  { id: 'focused-you', title: 'A more focused you', description: 'Find clarity in the noise and bring your attention back to what matters.', image: artwork.desert, days: 5, category: 'Focus', lessons: ['A clear beginning', 'One thing at a time', 'Working with distraction', 'Deep attention', 'Finding your flow'] },
];
