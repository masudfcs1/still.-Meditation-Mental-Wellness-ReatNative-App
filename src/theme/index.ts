import { useColorScheme } from 'react-native';
import { useAppStore } from '../store/useAppStore';

export const lightTheme = {
  background: '#F8F9F6', surface: '#FFFFFF', surfaceAlt: '#F2F5EE',
  text: '#26362B', secondary: '#7C847C', muted: '#A2A89F',
  primary: '#4E7257', primaryDark: '#35563D', primarySoft: '#EBF0E5',
  border: '#E9ECE5', lavender: '#F1EEF8', peach: '#FAF0E7', blue: '#ECF2F7',
  chart: '#739568', white: '#FFFFFF', danger: '#B66D65', isDark: false,
};
export type Theme = typeof lightTheme;
export const darkTheme: Theme = {
  background: '#17211C', surface: '#202D25', surfaceAlt: '#28372C',
  text: '#ECF0E7', secondary: '#ACB8A8', muted: '#83927F',
  primary: '#A9C395', primaryDark: '#BCD3AD', primarySoft: '#344632',
  border: '#344237', lavender: '#343142', peach: '#44382E', blue: '#293B43',
  chart: '#A9C395', white: '#FFFFFF', danger: '#E2A49A', isDark: true,
};
export function useTheme(): Theme {
  const preference = useAppStore(s => s.theme);
  const system = useColorScheme();
  return preference === 'dark' || (preference === 'system' && system === 'dark') ? darkTheme : lightTheme;
}
export const fonts = { regular: 'Manrope_400Regular', medium: 'Manrope_500Medium', semibold: 'Manrope_600SemiBold', bold: 'Manrope_700Bold', display: 'Lora_500Medium' };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
