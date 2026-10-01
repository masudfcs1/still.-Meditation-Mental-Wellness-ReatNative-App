import { Platform } from 'react-native';

// Native keeps accessibilityState; React Native Web needs aria-pressed explicitly.
export function webToggleState(pressed: boolean | undefined): { 'aria-pressed'?: boolean } {
  return Platform.OS === 'web' && pressed !== undefined ? { 'aria-pressed': pressed } : {};
}
