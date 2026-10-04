import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { Tabs, usePathname } from 'expo-router';
import { BarChart3, Bell, BookOpen, ChevronRight, Compass, Flower2, Heart, Home, Leaf, Moon, Search, Settings2, Sun, UserRound, Wind, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brand } from '../components/Brand';
import { Button, IconButton, T } from '../components/ui';
import { sessions } from '../mock/content';
import { useAppStore } from '../store/useAppStore';
import { fonts, useTheme } from '../theme';
import { Navigate, ScreenName } from '../types';
import { MiniPlayer } from '../features/meditation/MeditationPlayer';
import { navigateScreen, screenFromPath } from './routes';
import { formatTime } from '../features/reminders/model';
import { useReminderState } from '../features/reminders/controller';
import { reminderDelivery } from '../features/reminders/delivery';

const menu = [
  { route: 'Home', label: 'Overview', icon: Home },
  { route: 'Explore', label: 'Explore', icon: Compass },
  { route: 'Meditate', label: 'Meditate', icon: Flower2 },
  { route: 'Breathing', label: 'Breathwork', icon: Wind },
  { route: 'Sleep', label: 'Sleep', icon: Moon },
  { route: 'Programs', label: 'Programs', icon: BookOpen },
  { route: 'Analytics', label: 'My progress', icon: BarChart3 },
  { route: 'Favorites', label: 'Favorites', icon: Heart },
] as const;
const mobileRoutes: ScreenName[] = ['Home', 'Explore', 'Meditate', 'Breathing', 'Analytics', 'Profile'];
const routeLabel = (route: ScreenName) => menu.find(m => m.route === route)?.label || route;

function Sidebar({ active, onNavigate }: { active: ScreenName; onNavigate: Navigate }) {
  const t = useTheme(); const name = useAppStore(s => s.name); const setTheme = useAppStore(s => s.setTheme);
  const [hoveredRoute, setHoveredRoute] = useState<ScreenName | null>(null);
  const { height } = useWindowDimensions();
  const compact = height < 650;
  return <View style={{ width: 216, backgroundColor: t.surface, borderRightWidth: 1, borderColor: t.border }}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 19, paddingTop: compact ? 16 : 26, paddingBottom: compact ? 12 : 20 }}>
    <View style={{ paddingLeft: 15, marginBottom: compact ? 18 : height < 850 ? 24 : 42 }}><Brand/>{!compact && <T size={8.5} color={t.muted} style={{ letterSpacing: 1.05, marginTop: 3, marginLeft: 2 }}>A LITTLE SPACE FOR YOURSELF</T>}</View>
    <T size={9} weight="medium" color={t.muted} style={{ marginLeft: 15, marginBottom: compact ? 8 : 13, letterSpacing: 1.8 }}>YOUR PRACTICE</T>
    <View accessibilityRole="tablist" accessibilityLabel="Main navigation" style={{ gap: compact ? 3 : 6 }}>{menu.map((item, i) => <React.Fragment key={item.route}>{i === 6 && <View style={{ height: 1, backgroundColor: t.border, marginVertical: compact ? 6 : height < 850 ? 10 : 14, marginHorizontal: 11 }}/>}<Pressable accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected: active === item.route }} aria-selected={active === item.route} onPress={() => onNavigate(item.route)} onHoverIn={() => setHoveredRoute(item.route)} onHoverOut={() => setHoveredRoute(null)} style={({ pressed }) => ({ minHeight: compact ? 44 : 45, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 9, backgroundColor: active === item.route ? t.primarySoft : hoveredRoute === item.route ? t.background : 'transparent', opacity: pressed ? 0.7 : 1 })}><item.icon size={18} color={active === item.route ? t.primary : t.secondary} strokeWidth={active === item.route ? 1.9 : 1.65}/><T size={12} color={active === item.route ? t.primary : t.secondary} weight={active === item.route ? 'semibold' : 'medium'}>{item.label}</T>{active === item.route && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: t.primary, marginLeft: 'auto' }}/>}</Pressable></React.Fragment>)}</View>
    <View style={{ flex: 1, minHeight: 0 }}/>
    {height >= 900 && <View style={{ padding: 17, backgroundColor: t.primarySoft, borderRadius: 12, marginBottom: 20, overflow: 'hidden' }}><Leaf size={23} color={t.primary} strokeWidth={1.4}/><T size={13} weight="semibold" style={{ marginTop: 9 }}>Make room for you.</T><T size={10} color={t.secondary} style={{ marginTop: 4, lineHeight: 17 }}>A few minutes can change{ '\n' }the way your day feels.</T><Pressable accessibilityRole="button" onPress={() => onNavigate('Programs')} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 13, minHeight: 25 }}><T size={10} weight="semibold" color={t.primary}>Find your practice</T><ChevronRight size={12} color={t.primary}/></Pressable></View>}
    <Pressable accessibilityRole="button" onPress={() => onNavigate('Settings')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 15, height: 38 }}><Settings2 size={17} color={t.secondary}/><T size={11} color={t.secondary}>Settings & preferences</T></Pressable>
    <View style={{ marginTop: compact ? 10 : 17, paddingTop: compact ? 12 : 20, borderTopWidth: 1, borderColor: t.border, flexDirection: 'row', alignItems: 'center', gap: 10 }}><Pressable accessibilityRole="button" accessibilityLabel="View your profile" onPress={() => onNavigate('Profile')} style={{ width: 35, height: 35, borderRadius: 18, backgroundColor: t.peach, alignItems: 'center', justifyContent: 'center' }}><T size={11} weight="semibold" color="#907959">{name.slice(0, 1)}R</T></Pressable><Pressable accessibilityRole="button" onPress={() => onNavigate('Profile')} style={{ flex: 1 }}><T size={11} weight="semibold">{name} Rana</T><T size={9} color={t.secondary}>Your personal space</T></Pressable><IconButton icon={t.isDark ? Sun : Moon} label={t.isDark ? 'Use light appearance' : 'Use dark appearance'} onPress={() => setTheme(t.isDark ? 'light' : 'dark')} size={16} style={{ width: 28 }}/></View>
  </ScrollView></View>;
}
function BottomBar({ active }: { active: ScreenName }) {
  const t = useTheme(); const insets = useSafeAreaInsets();
  return <View accessibilityRole="tablist" accessibilityLabel="Main navigation" style={{ flexDirection: 'row', backgroundColor: t.surface, borderTopWidth: 1, borderColor: t.border, paddingTop: 9, paddingBottom: Math.max(10, insets.bottom) }}>
    {mobileRoutes.map(route => {
      const selected = active === route;
      const Icon = route === 'Profile' ? UserRound : menu.find(item => item.route === route)!.icon;
      const label = route === 'Analytics' ? 'Progress' : route === 'Breathing' ? 'Breathe' : route;
      return <Pressable key={route} accessibilityRole="tab" accessibilityLabel={route} accessibilityState={{ selected }} aria-selected={selected} onPress={() => navigateScreen(route)} style={({ pressed }) => ({ flex: 1, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', gap: 3, opacity: pressed ? 0.65 : 1 })}>
        <View style={{ width: 41, height: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? t.primarySoft : 'transparent', borderRadius: 10 }}>
          <Icon size={19} color={selected ? t.primary : t.secondary} strokeWidth={selected ? 2 : 1.6}/>
        </View>
        <T size={9} numberOfLines={1} color={selected ? t.primary : t.secondary} weight={selected ? 'semibold' : 'regular'}>{label}</T>
      </Pressable>;
    })}
  </View>;
}
function Header({ active, desktop, onNavigate }: { active: ScreenName; desktop: boolean; onNavigate: Navigate }) {
  const t = useTheme(); const [searchOpen, setSearchOpen] = useState(false); const [notificationsOpen, setNotificationsOpen] = useState(false); const [query, setQuery] = useState(''); const insets = useSafeAreaInsets(); const name = useAppStore(s => s.name); const startSession = useAppStore(s => s.startSession); const reminders = useAppStore(s => s.reminders);
  const ready = useReminderState(state => state.ready);
  const permission = useReminderState(state => state.permission);
  const canDeliver = ready && (reminderDelivery.kind === 'web' || permission?.status === 'granted');
  const filtered = sessions.filter(s => `${s.title} ${s.category} ${s.instructor}`.toLowerCase().includes(query.toLowerCase()));
  return <><View style={{ minHeight: desktop ? 78 : 66 + insets.top, paddingTop: desktop ? 0 : insets.top, paddingHorizontal: desktop ? 34 : 20, borderBottomWidth: 1, borderColor: t.border, backgroundColor: t.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
    {desktop ? <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}><T size={11} color={t.muted}>Your mindful space</T><ChevronRight size={12} color={t.muted}/><T size={11} color={t.text} weight="medium">{routeLabel(active)}</T></View> : <Brand small/>}
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: desktop ? 16 : 7 }}>{!desktop && <IconButton icon={Wind} label='Open breathing exercises' onPress={() => onNavigate('Breathing')} size={18} style={{ width: 36 }} />}<Pressable accessibilityRole="button" accessibilityLabel="Search meditations" onPress={() => setSearchOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: desktop ? 13 : 8, height: 35, borderRadius: 8, backgroundColor: desktop ? t.background : 'transparent', minWidth: desktop ? 215 : 35 }}><Search size={15} color={t.secondary}/>{desktop && <><T size={10} color={t.muted}>Find a little calm...</T><View style={{ marginLeft: 'auto', borderWidth: 1, borderColor: t.border, borderRadius: 4, paddingHorizontal: 4 }}><T size={9} color={t.muted}>⌕</T></View></>}</Pressable><View><IconButton icon={Bell} label="Your reminders" onPress={() => setNotificationsOpen(true)} size={18}/>{canDeliver && reminders.some(reminder => reminder.enabled) && <View style={{ position: 'absolute', right: 12, top: 8, width: 5, height: 5, backgroundColor: '#C5A57B', borderRadius: 3 }}/>}</View><Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => onNavigate('Profile')} style={{ height: 33, width: 33, borderRadius: 17, backgroundColor: t.peach, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: t.surfaceAlt }}><T size={9} color="#887452" weight="semibold">{name.slice(0, 1)}R</T></Pressable></View>
  </View>
  <Modal visible={searchOpen} transparent animationType="fade" onRequestClose={() => setSearchOpen(false)}><View style={styles.modalBackdrop}><Pressable style={StyleSheet.absoluteFill} onPress={() => setSearchOpen(false)} accessibilityLabel="Close search"/><View style={[styles.modal, { backgroundColor: t.surface }]}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderColor: t.border, paddingBottom: 14 }}><Search size={20} color={t.primary}/><TextInput autoFocus accessibilityLabel="Search meditation library" placeholder="What do you need today?" placeholderTextColor={t.muted} value={query} onChangeText={setQuery} style={{ flex: 1, minHeight: 44, color: t.text, fontFamily: fonts.regular, fontSize: 15, outlineStyle: 'none' } as never}/><IconButton icon={X} label="Close search" onPress={() => setSearchOpen(false)}/></View><T size={10} weight="semibold" color={t.secondary} style={{ marginTop: 17, marginBottom: 8, letterSpacing: 1 }}>{query ? `${filtered.length} SESSIONS FOR YOU` : 'A MOMENT OF INSPIRATION'}</T><ScrollView style={{ maxHeight: 395 }}>{filtered.map(session => <Pressable key={session.id} accessibilityRole="button" onPress={() => { setSearchOpen(false); startSession(session); }} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 12 }}><Image source={session.image} style={{ height: 50, width: 58, borderRadius: 8 }}/><View style={{ flex: 1 }}><T size={13} weight="semibold">{session.title}</T><T size={10} color={t.secondary}>{session.category} · {session.duration} min</T></View><ChevronRight size={17} color={t.primary}/></Pressable>)}{filtered.length === 0 && <T color={t.secondary} style={{ textAlign: 'center', paddingVertical: 40 }}>No sessions found. Try “sleep”, “focus”, or “breath”.</T>}</ScrollView></View></View></Modal>
  <Modal visible={notificationsOpen} transparent animationType="fade" onRequestClose={() => setNotificationsOpen(false)}><View style={styles.modalBackdrop}><Pressable style={StyleSheet.absoluteFill} onPress={() => setNotificationsOpen(false)} accessibilityLabel="Close reminders"/><View style={[styles.modal, { backgroundColor: t.surface }]}><View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><T size={22} weight="semibold">A gentle nudge</T><IconButton icon={X} label="Close reminders" onPress={() => setNotificationsOpen(false)}/></View><T color={t.secondary} size={12} style={{ marginBottom: 22 }}>Your little moments to reconnect.</T>{reminders.map(r => <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderTopWidth: 1, borderColor: t.border, gap: 14 }}><View style={{ padding: 12, borderRadius: 12, backgroundColor: t.primarySoft }}>{r.id === 'morning' ? <Sun color={t.primary} size={20}/> : <Moon color={t.primary} size={20}/>}</View><View style={{ flex: 1 }}><T weight="semibold" size={13}>{r.title}</T><T color={t.secondary} size={11}>{formatTime(r.time)} · {r.enabled ? canDeliver ? 'On' : 'Needs attention' : 'Off'}</T></View></View>)}<Button label="Manage reminders" onPress={() => { setNotificationsOpen(false); onNavigate('Settings'); }} style={{ marginTop: 15 }}/><T size={10} color={t.muted} style={{ marginTop: 12, textAlign: 'center' }}>Bangladesh time · UTC+6. Choose your time and repeat days in reminder settings.</T></View></View></Modal>
  </>;
}
export function AppNavigation() {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const desktop = width >= 1000;
  const active = screenFromPath(usePathname());
  return <View style={{ flex: 1, flexDirection: 'row', backgroundColor: t.background }}>{desktop && <Sidebar active={active} onNavigate={navigateScreen}/>}<View style={{ flex: 1, minWidth: 0 }}><Header active={active} desktop={desktop} onNavigate={navigateScreen}/><Tabs initialRouteName="index" tabBar={() => desktop ? null : <BottomBar active={active}/>} screenOptions={{ headerShown: false, animation: 'fade', sceneStyle: { backgroundColor: t.background }, lazy: true }}>
    <Tabs.Screen name="index" options={{ title: 'Home' }} />
    <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
    <Tabs.Screen name="meditate" options={{ title: 'Meditate' }} />
    <Tabs.Screen name="breathing" options={{ title: 'Breathe', tabBarAccessibilityLabel: 'Breathing' }} />
    <Tabs.Screen name="analytics" options={{ title: 'Progress' }} />
    <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    <Tabs.Screen name="sleep" options={{ title: 'Sleep', href: null }} />
    <Tabs.Screen name="programs" options={{ title: 'Programs', href: null }} />
    <Tabs.Screen name="favorites" options={{ title: 'Favorites', href: null }} />
    <Tabs.Screen name="settings" options={{ title: 'Settings', href: null }} />
    <Tabs.Screen name="achievements" options={{ title: 'Achievements', href: null }} />
  </Tabs><MiniPlayer mobile={!desktop}/></View></View>;
}
const styles = StyleSheet.create({ modalBackdrop: { flex: 1, backgroundColor: 'rgba(18,33,23,0.35)', justifyContent: 'center', alignItems: 'center', padding: 20 }, modal: { width: '100%', maxWidth: 530, borderRadius: 22, padding: 25, maxHeight: '85%' } });
