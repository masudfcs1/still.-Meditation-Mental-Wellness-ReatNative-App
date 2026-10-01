import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { T } from './ui';
import { useTheme } from '../theme';

export function Brand({ small = false }: { small?: boolean }) {
  const t = useTheme();
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Svg width={small ? 28 : 34} height={small ? 28 : 34} viewBox="0 0 40 40"><Path d="M20 34C6 34 3 24 5 17c9-1 16 5 15 17Z" fill={t.primary} opacity={0.68}/><Path d="M20 34c14 0 17-10 15-17-9-1-16 5-15 17Z" fill={t.primary} opacity={0.8}/><Path d="M20 29C10 20 13 10 20 5c7 5 10 15 0 24Z" fill={t.primary}/></Svg><T weight="semibold" size={small ? 26 : 31} style={{ letterSpacing: -1.5, lineHeight: 38 }}>still<T color={t.primary} size={29}>.</T></T></View>;
}
