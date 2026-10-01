import { useEffect } from 'react';
import { AppState } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useAppStore } from '../../store/useAppStore';

export const soundSources: Record<string, number> = {
  Rain: require('../../../assets/audio/rain.wav'), Ocean: require('../../../assets/audio/ocean.wav'),
  Forest: require('../../../assets/audio/forest.wav'), Wind: require('../../../assets/audio/wind.wav'),
  Fireplace: require('../../../assets/audio/fireplace.wav'), 'White noise': require('../../../assets/audio/white-noise.wav'),
  'White Noise': require('../../../assets/audio/white-noise.wav'), Night: require('../../../assets/audio/wind.wav'),
};
export function AudioEngine() {
  const sound = useAppStore(s => s.backgroundSound); const isPlaying = useAppStore(s => s.isPlaying); const session = useAppStore(s => s.activeSession); const volume = useAppStore(s => s.volume); const advance = useAppStore(s => s.advance);
  const audio = useAudioPlayer(soundSources[sound] || soundSources.Forest); const status = useAudioPlayerStatus(audio);
  useEffect(() => { setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false }).catch(() => { useAppStore.getState().notify('Audio is unavailable on this device. Your silent practice is still here.'); }); }, []);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      const current = useAppStore.getState();
      if (state !== 'active' && current.isPlaying) current.togglePlaying();
    });
    return () => subscription.remove();
  }, []);
  // Expo Audio's SharedObject exposes imperative setters, rather than immutable React state.
  // eslint-disable-next-line react-hooks/immutability
  useEffect(() => { audio.loop = true; audio.volume = sound === 'None' ? 0 : volume; }, [audio, volume, sound]);
  useEffect(() => { if (isPlaying && session && status.isLoaded) audio.play(); else audio.pause(); }, [audio, isPlaying, session, status.isLoaded]);
  useEffect(() => { if (!isPlaying || !session) return; let last = Date.now(); const interval = setInterval(() => { const now = Date.now(); advance((now - last) / 1000); last = now; }, 1000); return () => clearInterval(interval); }, [isPlaying, session, advance]);
  return null;
}
