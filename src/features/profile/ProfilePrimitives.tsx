import React, { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ChevronRight, LucideIcon, X } from 'lucide-react-native';
import { IconButton, T } from '../../components/ui';
import { useTheme } from '../../theme';

export function SettingsRow({ icon: Icon, title, caption, value, onPress, children, last = false }: PropsWithChildren<{ icon: LucideIcon; title: string; caption?: string; value?: string; onPress?: () => void; last?: boolean }>) {
  const t = useTheme();
  const contents = <><View style={[styles.rowIcon, { backgroundColor: t.surfaceAlt }]}><Icon size={18} color={t.primary} strokeWidth={1.6} /></View><View style={{ flex: 1 }}><T size={13} weight="medium">{title}</T>{caption && <T size={11} color={t.secondary} style={{ marginTop: 2 }}>{caption}</T>}</View>{value && <T size={12} color={t.secondary} style={{ flexShrink: 1, maxWidth: '32%', textAlign: 'right' }}>{value}</T>}{children}{onPress && <ChevronRight size={16} color={t.muted} />}</>;
  const rowStyle = [styles.settingRow, { borderBottomColor: t.border, borderBottomWidth: last ? 0 : 1 }];
  return onPress ? <Pressable accessibilityRole="button" accessibilityLabel={`${title}${value ? `, ${value}` : ''}`} onPress={onPress} style={({ pressed }) => [...rowStyle, { opacity: pressed ? 0.6 : 1 }]}>{contents}</Pressable> : <View style={rowStyle}>{contents}</View>;
}

export function SettingsModal({ title, visible, onClose, children }: PropsWithChildren<{ title: string; visible: boolean; onClose: () => void }>) {
  const t = useTheme();
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalRoot}>
      <Pressable accessibilityLabel="Close dialog" onPress={onClose} style={[StyleSheet.absoluteFill, { backgroundColor: '#12251DB0' }]} />
      <View accessibilityViewIsModal style={[styles.modalCard, { backgroundColor: t.surface, borderColor: t.border }]}>
        <View style={styles.modalHeader}><T accessibilityRole="header" size={22} weight="semibold" style={{ flex: 1, letterSpacing: -0.5 }}>{title}</T><IconButton icon={X} label="Close dialog" onPress={onClose} /></View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, paddingTop: 8 }} showsVerticalScrollIndicator={false}>{children}</ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

const styles = StyleSheet.create({
  settingRow: { minHeight: 75, flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 15 },
  rowIcon: { width: 38, height: 38, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  modalRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18 },
  modalCard: { maxWidth: 480, width: '100%', maxHeight: '90%', borderWidth: 1, borderRadius: 22, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', padding: 24, paddingBottom: 12, gap: 12 },
});
