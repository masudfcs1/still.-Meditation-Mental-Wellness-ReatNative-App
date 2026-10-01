import { webToggleState } from "../utils/accessibility";
import React from 'react';
import { Image, Pressable, StyleProp, StyleSheet, useWindowDimensions, View, ViewStyle } from 'react-native';
import { Clock3, Heart, Play } from 'lucide-react-native';
import { MeditationSession } from '../types';
import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../theme';
import { T } from './ui';

export function MeditationCard({ session, compact = false, style }: { session: MeditationSession; compact?: boolean; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const narrow = compact && width < 520;
  const saved = useAppStore(s => s.favorites.includes(session.id));
  const toggleFavorite = useAppStore(s => s.toggleFavorite);
  const startSession = useAppStore(s => s.startSession);
  const setBackgroundSound = useAppStore(s => s.setBackgroundSound);
  const sleepTimer = useAppStore(s => s.sleepTimer);
  const play = () => {
    if (session.id.startsWith('sleep-sound:')) {
      const soundNames: Record<string, string> = { rain: 'Rain', ocean: 'Ocean', forest: 'Forest', night: 'Night' };
      setBackgroundSound(soundNames[session.id.split(':')[1]] || 'Forest');
      startSession({ ...session, duration: sleepTimer || session.duration });
    } else startSession(session);
  };

  return <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border, flexDirection: compact ? 'row' : 'column' }, style]}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Play ${session.title}, ${session.duration} minutes`} onPress={play} style={({ pressed }) => [{ flex: compact ? undefined : 1, flexDirection: compact ? 'row' : 'column', alignItems: compact ? 'center' : undefined, width: compact ? '100%' : undefined, opacity: pressed ? 0.85 : 1 }]}>
      <View style={[styles.art, compact && styles.compactArt, narrow && { width: 80, height: 88 }]}>
        <Image source={session.image} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} resizeMode="cover" accessibilityIgnoresInvertColors />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(17, 35, 28, 0.08)' }]} />
        {!compact && <View style={styles.category}><T size={9} color="#fff" weight="semibold" style={{ letterSpacing: 0.7 }}>{session.category.toUpperCase()}</T></View>}
        <View style={[styles.play, compact && styles.compactPlay, narrow && { right: 23, bottom: 27 }]}><Play size={compact ? 15 : 17} fill="#fff" color="#fff" strokeWidth={1.5} /></View>
      </View>
      <View style={[styles.body, { backgroundColor: t.surface }, compact && { flex: 1, paddingRight: 58 }, narrow && { paddingLeft: 4, paddingRight: 46 }]}>
        <T size={compact ? 14 : 15} weight="semibold" numberOfLines={1} style={{ letterSpacing: -0.3 }}>{session.title}</T>
        <T size={11} color={t.secondary} numberOfLines={1} style={{ marginTop: 3 }}>{compact ? session.subtitle : session.instructor}</T>
        <View style={styles.meta}><Clock3 size={11} color={t.secondary} /><T size={10} color={t.secondary}>{session.duration} min</T><T size={10} color={t.muted}>·</T><T size={10} color={t.secondary}>{compact ? session.category : session.difficulty}</T></View>
      </View>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={`${saved ? 'Remove' : 'Save'} ${session.title}${saved ? ' from favorites' : ' to favorites'}`} accessibilityState={{ selected: saved }} {...webToggleState(saved)} hitSlop={5} onPress={event => { event.stopPropagation(); toggleFavorite(session.id); }} style={({ pressed }) => [styles.favorite, compact ? { right: 12, top: '50%', marginTop: -18, backgroundColor: t.surfaceAlt } : { right: 11, top: 11, backgroundColor: 'rgba(255,255,255,0.93)' }, { opacity: pressed ? 0.6 : 1 }]}><Heart size={16} color={compact ? t.primary : saved ? '#4E7257' : '#626B60'} fill={saved ? (compact ? t.primary : '#4E7257') : 'transparent'} strokeWidth={1.6} /></Pressable>
  </View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: 15, borderWidth: 1, overflow: 'hidden', minWidth: 0 },
  art: { height: 165, width: '100%', position: 'relative', backgroundColor: '#E3E9DC', overflow: 'hidden' },
  compactArt: { width: 108, height: 108, borderRadius: 11, overflow: 'hidden', margin: 10 },
  category: { position: 'absolute', bottom: 16, left: 17, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 5, backgroundColor: 'rgba(21,40,29,0.27)' },
  play: { position: 'absolute', right: 15, bottom: 13, width: 35, height: 35, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.23)', alignItems: 'center', justifyContent: 'center', paddingLeft: 2, borderColor: 'rgba(255,255,255,0.48)', borderWidth: 1 },
  compactPlay: { right: 37, bottom: 37, width: 34, height: 34 },
  body: { padding: 17, paddingTop: 15 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12 },
  favorite: { position: 'absolute', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
