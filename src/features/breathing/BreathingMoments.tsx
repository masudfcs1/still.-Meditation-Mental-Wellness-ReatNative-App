import React from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Ellipse, Line, Path } from 'react-native-svg';
import { ArrowUpRight, Check, Clock3, Pause, Wind } from 'lucide-react-native';
import { T } from '../../components/ui';
import { useTheme } from '../../theme';
import { breathingMoments, type BreathingMoment } from './presets';

type RhythmStep = { name: string; seconds: number };
type Props = {
  exerciseId: string;
  duration: number;
  locked: boolean;
  patterns: Record<string, RhythmStep[]>;
  onChoose: (moment: BreathingMoment) => void;
};

function MomentIllustration({ moment, color, softColor }: { moment: BreathingMoment['id']; color: string; softColor: string }) {
  return <Svg width="100%" height="100%" viewBox="0 0 300 140" fill="none">
    {moment === 'morning' ? <>
      <Circle cx="150" cy="84" r="43" fill={softColor} />
      <Path d="M105 91A45 45 0 0 1 195 91" stroke={color} strokeWidth="1.3" />
      <Path d="M25 108C67 108 80 94 112 94S159 115 188 108 236 90 275 94" stroke={color} strokeWidth="1.1" strokeOpacity="0.7" />
      <Path d="M42 120C82 122 93 112 126 113S178 130 212 120 250 109 275 111" stroke={color} strokeWidth="1" strokeOpacity="0.35" />
      <Line x1="150" y1="22" x2="150" y2="30" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <Line x1="109" y1="34" x2="114" y2="40" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <Line x1="191" y1="34" x2="186" y2="40" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <Line x1="86" y1="63" x2="93" y2="65" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <Line x1="214" y1="63" x2="207" y2="65" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <Circle cx="246" cy="49" r="3" fill={color} fillOpacity="0.22" />
    </> : moment === 'daytime' ? <>
      <Circle cx="152" cy="76" r="55" stroke={color} strokeOpacity="0.18" />
      <Circle cx="152" cy="76" r="40" fill={softColor} />
      <Ellipse cx="150" cy="111" rx="69" ry="11" stroke={color} strokeOpacity="0.2" />
      <Path d="M111 90C120 79 181 77 192 91 201 104 175 110 151 110S100 104 111 90Z" fill={softColor} stroke={color} strokeWidth="1.2" />
      <Path d="M122 70C132 59 170 57 181 70 191 82 170 90 150 90S111 83 122 70Z" fill={softColor} stroke={color} strokeWidth="1.2" />
      <Path d="M133 49C139 42 158 40 167 49 176 58 164 67 151 67S124 59 133 49Z" fill={softColor} stroke={color} strokeWidth="1.2" />
      <Path d="M42 78C50 68 59 88 67 77M239 58C246 49 253 66 261 57" stroke={color} strokeWidth="1.1" strokeOpacity="0.6" strokeLinecap="round" />
      <Circle cx="81" cy="41" r="3" fill={color} fillOpacity="0.2" />
    </> : <>
      <Circle cx="160" cy="64" r="43" fill={softColor} fillOpacity="0.55" />
      <Path d="M165 29C146 40 144 62 156 78 164 88 174 92 185 90 169 106 143 99 132 82 118 60 133 31 156 28L165 29Z" fill={softColor} stroke={color} strokeWidth="1.2" />
      <Path d="M27 120C65 92 99 99 133 115S206 108 273 98" stroke={color} strokeWidth="1.1" strokeOpacity="0.5" />
      <Path d="M32 133C70 110 108 117 141 127S216 119 271 114" stroke={color} strokeWidth="1" strokeOpacity="0.25" />
      <Path d="M222 37V47M217 42H227M80 63V71M76 67H84" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <Circle cx="202" cy="74" r="2" fill={color} fillOpacity="0.55" />
      <Circle cx="103" cy="34" r="2" fill={color} fillOpacity="0.35" />
    </>}
  </Svg>;
}

export function BreathingMoments({ exerciseId, duration, locked, patterns, onChoose }: Props) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const columns = width >= 1040;
  const palettes = {
    morning: { background: t.primarySoft, accent: t.isDark ? '#BCD3AD' : '#4E7257', soft: t.isDark ? '#496546' : '#D1DFBC' },
    daytime: { background: t.peach, accent: t.isDark ? '#E0BE9F' : '#855F44', soft: t.isDark ? '#68513F' : '#EBD6BF' },
    evening: { background: t.lavender, accent: t.isDark ? '#C7BBE2' : '#79608F', soft: t.isDark ? '#554768' : '#DDD4EB' },
  };

  return <View style={styles.section}>
    <View style={styles.headingRow}>
      <View style={{ flex: 1 }}>
        <T size={9} weight="semibold" color={t.secondary} style={styles.overline}>LITTLE RITUALS, EVERYDAY LIFE</T>
        <T accessibilityRole="header" size={width < 400 ? 24 : 27} weight="display" style={{ letterSpacing: -0.8, marginTop: 7 }}>A breath for every moment</T>
        <T size={12} color={t.secondary} style={{ marginTop: 6, maxWidth: 530 }}>Meet yourself where you are. A few thoughtful ways to make room in your day.</T>
      </View>
      {width >= 600 && <View style={[styles.headingIcon, { backgroundColor: t.primarySoft }]}><Wind size={23} strokeWidth={1.25} color={t.primary} /></View>}
    </View>

    {locked && <View accessibilityLiveRegion="polite" style={[styles.lockedNote, { backgroundColor: t.surfaceAlt }]}><Pause size={14} color={t.primary} /><T size={11} color={t.secondary} style={{ flex: 1 }}>Finish or reset your current practice before choosing another moment.</T></View>}

    <View style={{ flexDirection: columns ? 'row' : 'column', gap: 16 }}>
      {breathingMoments.map((moment, index) => {
        const palette = palettes[moment.id];
        const selected = moment.exerciseId === exerciseId && moment.duration === duration;
        const rhythm = patterns[moment.exerciseId] || [];
        return <View key={moment.id} style={[styles.card, { flex: columns ? 1 : undefined, borderColor: selected ? palette.accent : t.border, backgroundColor: t.surface }]}>
          <View style={[styles.art, { backgroundColor: palette.background }]}>
            <View style={styles.artTopLine}>
              <T size={9} weight="semibold" color={palette.accent} style={{ letterSpacing: 1.2 }}>0{index + 1} / A LITTLE PAUSE</T>
              <View style={[styles.duration, { backgroundColor: t.surface }]}><Clock3 size={11} color={palette.accent} /><T size={10} weight="medium" color={palette.accent}>{moment.duration} min</T></View>
            </View>
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.illustration}><MomentIllustration moment={moment.id} color={palette.accent} softColor={palette.soft} /></View>
          </View>
          <View style={styles.content}>
            <T size={8.5} weight="semibold" color={palette.accent} style={{ letterSpacing: 1.1 }}>{moment.overline}</T>
            <T size={23} weight="display" style={{ letterSpacing: -0.6, marginTop: 6 }}>{moment.title}</T>
            <T size={12} color={t.secondary} style={{ lineHeight: 20, marginTop: 5, minHeight: columns ? 60 : undefined }}>{moment.description}</T>
            <View style={[styles.rhythm, { borderColor: t.border }]}>
              {rhythm.map((step, stepIndex) => <React.Fragment key={`${step.name}-${stepIndex}`}>
                {stepIndex > 0 && <View style={[styles.rhythmDot, { backgroundColor: palette.accent }]} />}
                <T size={10} color={t.secondary}>{step.name === 'Inhale' ? 'In' : step.name === 'Exhale' ? 'Out' : step.name} <T size={10} weight="semibold" color={palette.accent}>{step.seconds}s</T></T>
              </React.Fragment>)}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Choose ${moment.title}, ${moment.duration} minute${moment.duration === 1 ? '' : 's'}`}
              accessibilityHint="Prepares the breathing timer above. Press Begin breathing when you are ready."
              accessibilityState={{ disabled: locked }}
              disabled={locked}
              onPress={() => onChoose(moment)}
              style={({ pressed }) => [styles.chooseButton, { backgroundColor: palette.background, opacity: locked ? 0.5 : pressed ? 0.7 : 1 }]}
            >
              <T size={12} weight="semibold" color={palette.accent}>{selected ? 'Ready to begin above' : 'Choose practice'}</T>
              {selected ? <Check size={16} color={palette.accent} /> : <ArrowUpRight size={16} color={palette.accent} />}
            </Pressable>
          </View>
        </View>;
      })}
    </View>
    {!locked && <T size={10} color={t.secondary} style={{ textAlign: 'center', marginTop: 17 }}>Choose a moment, then begin with the circle above. There is no rush.</T>}
  </View>;
}

const styles = StyleSheet.create({
  section: { marginTop: 43 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 23 },
  overline: { letterSpacing: 1.7 },
  headingIcon: { width: 51, height: 51, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  lockedNote: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 13, borderRadius: 11, marginBottom: 16 },
  card: { minWidth: 0, borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  art: { height: 162, overflow: 'hidden' },
  artTopLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingTop: 14, zIndex: 1 },
  duration: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 5 },
  illustration: { position: 'absolute', left: 0, right: 0, bottom: -1, height: 136, pointerEvents: 'none' },
  content: { padding: 20, paddingTop: 19, flex: 1 },
  rhythm: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, borderTopWidth: 1, paddingTop: 13, marginTop: 15, marginBottom: 16, minHeight: 30 },
  rhythmDot: { width: 2, height: 2, borderRadius: 1, opacity: 0.5 },
  chooseButton: { minHeight: 44, paddingHorizontal: 13, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 'auto' },
});
