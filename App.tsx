import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Manrope_400Regular } from '@expo-google-fonts/manrope/400Regular';
import { Manrope_500Medium } from '@expo-google-fonts/manrope/500Medium';
import { Manrope_600SemiBold } from '@expo-google-fonts/manrope/600SemiBold';
import { Manrope_700Bold } from '@expo-google-fonts/manrope/700Bold';
import { Lora_500Medium } from '@expo-google-fonts/lora/500Medium';
import { AppNavigation } from './src/navigation/AppNavigation';
import { AudioEngine } from './src/features/meditation/AudioEngine';
import { MeditationPlayer } from './src/features/meditation/MeditationPlayer';
import { ReminderCoordinator } from './src/features/reminders/ReminderCoordinator';
import { ErrorBoundary, Toast } from './src/components/Feedback';
import { useTheme } from './src/theme';

function StillApp() {
  const t = useTheme();
  return <View style={{ flex: 1, backgroundColor: t.background }}><StatusBar style={t.isDark ? 'light' : 'dark'}/><AppNavigation/><AudioEngine/><MeditationPlayer/><ReminderCoordinator/><Toast/></View>;
}
export default function App() {
  const [loaded, error] = useFonts({ Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Lora_500Medium });
  if (!loaded && !error) return <View style={{ flex: 1, backgroundColor: '#F8F9F6', justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="small" color="#4E7257"/></View>;
  return <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider><ErrorBoundary><StillApp/></ErrorBoundary></SafeAreaProvider></GestureHandlerRootView>;
}
