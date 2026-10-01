import { webToggleState } from "../utils/accessibility";
import React, { PropsWithChildren } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextProps, useWindowDimensions, View, ViewStyle } from 'react-native';
import { ArrowRight, LucideIcon } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { fonts, useTheme } from '../theme';

export function T({ children, style, size = 14, weight = 'regular', color, ...rest }: TextProps & { size?: number; weight?: keyof typeof fonts; color?: string }) {
  const t = useTheme();
  return <Text {...rest} style={[{ fontFamily: fonts[weight], fontSize: size, color: color || t.text, lineHeight: size * 1.55 }, style]}>{children}</Text>;
}
export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const t = useTheme(); return <View style={[{ backgroundColor: t.surface, borderRadius: 18, borderWidth: 1, borderColor: t.border, padding: 24 }, style]}>{children}</View>;
}
export function Button({ label, onPress, icon: Icon, variant = 'primary', style, disabled = false, small = false }: { label: string; onPress: () => void; icon?: LucideIcon; variant?: 'primary' | 'secondary' | 'ghost'; style?: StyleProp<ViewStyle>; disabled?: boolean; small?: boolean }) {
  const [hovered, setHovered] = React.useState(false);
  const t = useTheme(); const color = variant === 'primary' ? (t.isDark ? '#203025' : '#FFFFFF') : t.primary;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} accessibilityState={{ disabled }} aria-disabled={disabled} onPress={onPress} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} style={({ pressed }) => [{ minHeight: small ? 44 : 46, borderRadius: 10, paddingHorizontal: small ? 15 : 20, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, backgroundColor: variant === 'primary' ? t.primary : variant === 'secondary' ? t.primarySoft : 'transparent', opacity: disabled ? 0.45 : pressed ? 0.75 : 1, transform: [{ translateY: hovered ? -1 : 0 }] }, style]}>{Icon && <Icon size={16} color={color} strokeWidth={1.8} />}<T size={small ? 12 : 13} weight="semibold" color={color}>{label}</T></Pressable>;
}
export function IconButton({ icon: Icon, onPress, label, size = 20, color, style, selected }: { icon: LucideIcon; onPress: () => void; label: string; size?: number; color?: string; style?: StyleProp<ViewStyle>; selected?: boolean }) {
  const [hovered, setHovered] = React.useState(false);
  const t = useTheme(); return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={selected === undefined ? undefined : { selected }} {...webToggleState(selected)} onPress={onPress} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} style={({ pressed }) => [{ width: 44, height: 44, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: hovered ? t.surfaceAlt : 'transparent', opacity: pressed ? 0.55 : 1 }, style]}><Icon color={color || t.secondary} size={size} strokeWidth={1.7} /></Pressable>;
}
export function SectionHeading({ title, subtitle, action, onAction }: { title: string; subtitle?: string; action?: string; onAction?: () => void }) {
  const t = useTheme(); return <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 17, gap: 12 }}><View style={{ flex: 1 }}><T size={18} weight="semibold" style={{ letterSpacing: -0.55 }}>{title}</T>{subtitle && <T size={12} color={t.secondary} style={{ marginTop: 3 }}>{subtitle}</T>}</View>{action && onAction && <Pressable accessibilityRole="button" onPress={onAction} style={{ minHeight: 44, flexDirection: 'row', gap: 6, alignItems: 'center' }}><T size={12} color={t.primary} weight="medium">{action}</T><ArrowRight size={14} color={t.primary} /></Pressable>}</View>;
}
export function Chip({ label, active = false, onPress, icon: Icon }: { label: string; active?: boolean; onPress: () => void; icon?: LucideIcon }) {
  const t = useTheme(); return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} {...webToggleState(active)} onPress={onPress} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 44, paddingHorizontal: 15, borderRadius: 9, borderWidth: 1, borderColor: active ? t.primary : t.border, backgroundColor: active ? t.primary : t.surface, opacity: pressed ? 0.7 : 1 })}>{Icon && <Icon size={15} color={active ? (t.isDark ? '#203025' : '#fff') : t.secondary} />}<T size={12} weight={active ? 'semibold' : 'medium'} color={active ? (t.isDark ? '#203025' : '#fff') : t.secondary}>{label}</T></Pressable>;
}
export function ProgressRing({ progress, size = 116, stroke = 8, color, children }: PropsWithChildren<{ progress: number; size?: number; stroke?: number; color?: string }>) {
  const t = useTheme(); const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}><Svg width={size} height={size} style={StyleSheet.absoluteFill}><Circle cx={size / 2} cy={size / 2} r={r} stroke={t.isDark ? '#3A4A3C' : '#EDF0E8'} strokeWidth={stroke} fill="none" /><Circle cx={size / 2} cy={size / 2} r={r} stroke={color || t.chart} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${c} ${c}`} strokeDashoffset={c * (1 - Math.min(1, Math.max(0, progress)))} fill="none" transform={`rotate(-90 ${size / 2} ${size / 2})`} /></Svg>{children}</View>;
}
export function PageTitle({ eyebrow, title, subtitle, right }: { eyebrow?: string; title: string; subtitle?: string; right?: React.ReactNode }) {
  const t = useTheme(); const { width } = useWindowDimensions(); return <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 26 }}><View style={{ flex: 1 }}>{eyebrow && <T size={10} weight="semibold" color={t.secondary} style={{ letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 6 }}>{eyebrow}</T>}<T size={width < 600 ? 27 : 31} weight="semibold" style={{ letterSpacing: -1.1, lineHeight: width < 600 ? 38 : 44 }}>{title}</T>{subtitle && <T size={13} color={t.secondary} style={{ marginTop: 6 }}>{subtitle}</T>}</View>{right}</View>;
}
export function EmptyState({ icon: Icon, title, description, action, onAction }: { icon: LucideIcon; title: string; description: string; action?: string; onAction?: () => void }) {
  const t = useTheme(); return <Card style={{ alignItems: 'center', paddingVertical: 60, gap: 12 }}><View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: t.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}><Icon size={27} color={t.primary} /></View><T size={20} weight="semibold">{title}</T><T color={t.secondary} style={{ maxWidth: 360, textAlign: 'center' }}>{description}</T>{action && onAction && <Button label={action} onPress={onAction} style={{ marginTop: 8 }} />}</Card>;
}
