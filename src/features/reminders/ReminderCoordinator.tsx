import React, { useEffect, useRef, useState } from 'react';
import { AppState, View } from 'react-native';
import { router, useRootNavigationState } from 'expo-router';
import { Bell, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, IconButton, T } from '../../components/ui';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../theme';
import { reminderDelivery } from './delivery';
import type { ReminderMessage } from './delivery.types';
import { refreshReminders } from './controller';

export function ReminderCoordinator() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const hydrated = useAppStore(state => state.hasHydrated);
  const navigation = useRootNavigationState();
  const [incoming, setIncoming] = useState<ReminderMessage | null>(null);
  const pendingDestination = useRef<ReminderMessage['route'] | null>(null);

  useEffect(() => reminderDelivery.subscribe({
    onReceive: setIncoming,
    onOpen: route => {
      if (navigation?.key) { router.navigate(route); setIncoming(null); }
      else pendingDestination.current = route;
    },
  }), [navigation?.key]);

  useEffect(() => {
    if (!hydrated) return;
    void refreshReminders();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void refreshReminders();
    });
    return () => subscription.remove();
  }, [hydrated]);

  useEffect(() => {
    if (pendingDestination.current && navigation?.key) {
      router.navigate(pendingDestination.current);
      pendingDestination.current = null;
    }
  }, [navigation?.key]);

  useEffect(() => {
    if (!incoming) return;
    const timer = setTimeout(() => setIncoming(null), 30_000);
    return () => clearTimeout(timer);
  }, [incoming]);

  if (!incoming) return null;
  return <View style={{ pointerEvents: 'box-none', position: 'absolute', top: insets.top + 76, left: 16, right: 16, alignItems: 'center', zIndex: 3000 }}>
    <View accessibilityRole="alert" accessibilityLiveRegion="assertive" style={{ width: '100%', maxWidth: 420, borderRadius: 20, borderWidth: 1, borderColor: t.primary, backgroundColor: t.surface, padding: 20, boxShadow: '0px 8px 32px rgba(18,33,23,0.18)' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Bell color={t.primary} size={20} />
        <T size={10} color={t.primary} weight="semibold" style={{ flex: 1, letterSpacing: 1.2 }}>A MOMENT FOR YOU</T>
        <IconButton icon={X} label="Dismiss reminder" onPress={() => setIncoming(null)} />
      </View>
      <T size={20} weight="display" style={{ marginTop: 5 }}>{incoming.title}</T>
      <T size={12} color={t.secondary} style={{ marginTop: 6, marginBottom: 18 }}>{incoming.body}</T>
      <Button label="Take a moment" onPress={() => { router.navigate(incoming.route); setIncoming(null); }} small />
    </View>
  </View>;
}
