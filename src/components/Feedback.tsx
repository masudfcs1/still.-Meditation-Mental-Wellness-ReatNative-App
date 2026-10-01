import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { Check, Leaf, X } from 'lucide-react-native';
import { Button, T } from './ui';
import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../theme';

export function Toast() {
  const t = useTheme(); const toast = useAppStore(s => s.toast); const notify = useAppStore(s => s.notify);
  useEffect(() => { if (!toast) return; const timeout = setTimeout(() => notify(null), 5000); return () => clearTimeout(timeout); }, [toast, notify]);
  if (!toast) return null;
  return <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ position: 'absolute', bottom: 95, left: 20, right: 20, zIndex: 100, alignItems: 'center', pointerEvents: 'box-none' }}><View style={{ maxWidth: 480, flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 13, backgroundColor: t.primaryDark, padding: 17, boxShadow: '0 4px 25px #00000020' }}><Check size={18} color={t.isDark ? '#203025' : '#FFFFFF'}/><T style={{ flex: 1 }} size={12} color={t.isDark ? '#203025' : '#FFFFFF'}>{toast}</T><Pressable accessibilityRole="button" accessibilityLabel="Dismiss message" onPress={() => notify(null)} style={{ padding: 7 }}><X size={15} color={t.isDark ? '#203025' : '#FFFFFF'}/></Pressable></View></View>;
}
export class ErrorBoundary extends React.Component<React.PropsWithChildren, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() { if (this.state.error) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9F6', padding: 30, gap: 15 }}><Leaf size={38} color="#4E7257"/><T size={25} weight="display">Let&apos;s take a fresh breath.</T><T color="#7C847C" style={{ textAlign: 'center', maxWidth: 350 }}>Something interrupted your space. Your saved practice is still safe on this device.</T><Button label="Try again" onPress={() => this.setState({ error: false })}/></View>; return this.props.children; }
}
