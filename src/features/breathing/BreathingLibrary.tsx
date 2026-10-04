import React, { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Ellipse, Line, Path } from 'react-native-svg';
import { ArrowLeft, ArrowRight, ArrowUpRight, Clock3, Feather, Focus, Heart, Leaf, Moon, Mountain, Sparkles, Sprout, Square, Sun, Wind, type LucideIcon } from 'lucide-react-native';
import { T } from '../../components/ui';
import { type Theme, useTheme } from '../../theme';
import { breathingCategories, breathingExercises, type BreathingCategory, type BreathingPracticeOption } from './catalog';

type Props = {
  category?: BreathingCategory;
  onChooseCategory: (category: BreathingCategory) => void;
  onChoosePractice: (category: BreathingCategory, practice: BreathingPracticeOption) => void;
  onAllCategories: () => void;
  onQuickStart: () => void;
};
type Palette = { background: string; accent: string; soft: string };
type RhythmStep = { name: string; seconds: number };

const categoryIcons: Record<string, LucideIcon> = {
  Calm: Wind,
  Energy: Sun,
  'Clear mind': Focus,
  Relaxation: Moon,
  'Male power': Mountain,
  'Box breathing': Square,
  'Lung health': Heart,
  Freedom: Feather,
  Recovery: Sprout,
  'Stress relief': Leaf,
};

function paletteFor(t: Theme, tone: BreathingCategory['tone']): Palette {
  return {
    sage: { background: t.primarySoft, accent: t.isDark ? '#BCD3AD' : '#4D7057', soft: t.isDark ? '#526B49' : '#CFDEBE' },
    sand: { background: t.peach, accent: t.isDark ? '#E4C7A7' : '#855F44', soft: t.isDark ? '#6B5340' : '#ECD7BA' },
    blue: { background: t.blue, accent: t.isDark ? '#B3CEDD' : '#4F7186', soft: t.isDark ? '#476273' : '#CCDFE8' },
    lavender: { background: t.lavender, accent: t.isDark ? '#D0C0E8' : '#79608F', soft: t.isDark ? '#615075' : '#DCD0E9' },
    rose: { background: t.isDark ? '#422F36' : '#F7EBEB', accent: t.isDark ? '#E3BBC4' : '#8E5662', soft: t.isDark ? '#6D4955' : '#EACBD0' },
  }[tone];
}

function OrganicBreath({ palette }: { palette: Palette }) {
  return <Svg width="100%" height="100%" viewBox="0 0 280 240" fill="none">
    <Ellipse cx="160" cy="125" rx="89" ry="92" fill={palette.soft} fillOpacity="0.42" />
    <Path d="M68 92C81 51 121 19 158 30 188 40 185 71 210 91 245 119 249 162 220 188 190 215 151 205 128 190 104 174 66 190 49 156 38 134 55 111 68 92Z" stroke={palette.accent} strokeOpacity="0.2" strokeWidth="1.2" />
    <Path d="M84 97C94 62 126 39 157 47 181 53 184 85 203 99 232 124 228 157 206 177 181 198 153 188 133 176 111 161 84 172 70 146 59 126 75 114 84 97Z" stroke={palette.accent} strokeOpacity="0.33" strokeWidth="1.2" />
    <Path d="M101 102C111 78 135 60 156 66 180 72 174 96 195 112 216 127 210 151 193 165 174 181 154 168 139 161 118 151 102 156 92 139 84 125 93 115 101 102Z" stroke={palette.accent} strokeOpacity="0.47" strokeWidth="1.2" />
    <Path d="M148 155C147 128 147 109 163 91M153 134C166 135 187 117 187 98 168 99 153 110 153 134ZM148 147C133 145 118 130 117 113 136 115 149 128 148 147Z" stroke={palette.accent} strokeOpacity="0.8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="63" cy="69" r="4" fill={palette.accent} fillOpacity="0.25" />
    <Circle cx="222" cy="60" r="3" fill={palette.accent} fillOpacity="0.3" />
    <Circle cx="231" cy="207" r="5" fill={palette.soft} />
    <Line x1="86" y1="201" x2="86" y2="211" stroke={palette.accent} strokeOpacity="0.35" strokeLinecap="round" />
    <Line x1="81" y1="206" x2="91" y2="206" stroke={palette.accent} strokeOpacity="0.35" strokeLinecap="round" />
  </Svg>;
}

function CategoryMotif({ index, palette }: { index: number; palette: Palette }) {
  return <Svg width="100%" height="100%" viewBox="0 0 140 120" fill="none">
    {index % 5 === 0 ? <>
      <Path d="M36 128C12 84 87 63 51 19M60 133C36 91 111 70 75 26M84 140C60 98 135 77 99 33" stroke={palette.accent} strokeOpacity="0.16" strokeWidth="1.2" />
      <Circle cx="98" cy="28" r="23" fill={palette.soft} fillOpacity="0.45" />
    </> : index % 5 === 1 ? <>
      <Circle cx="94" cy="59" r="34" fill={palette.soft} fillOpacity="0.5" />
      <Circle cx="94" cy="59" r="46" stroke={palette.accent} strokeOpacity="0.15" />
      <Path d="M15 110C50 90 72 118 113 96M29 123C64 103 86 131 127 109" stroke={palette.accent} strokeOpacity="0.2" />
    </> : index % 5 === 2 ? <>
      <Ellipse cx="95" cy="49" rx="24" ry="43" transform="rotate(-38 95 49)" stroke={palette.accent} strokeOpacity="0.18" />
      <Ellipse cx="95" cy="49" rx="24" ry="43" transform="rotate(38 95 49)" stroke={palette.accent} strokeOpacity="0.18" />
      <Circle cx="95" cy="49" r="19" fill={palette.soft} fillOpacity="0.5" />
    </> : index % 5 === 3 ? <>
      <Path d="M62 35C77 20 115 26 121 43 128 62 97 72 80 63 67 57 51 48 62 35ZM41 82C60 63 114 74 120 92 127 109 68 116 52 104 39 95 33 91 41 82Z" stroke={palette.accent} strokeOpacity="0.18" />
      <Path d="M62 83C74 71 102 79 105 89 109 103 78 106 68 97 60 91 57 88 62 83Z" fill={palette.soft} fillOpacity="0.5" />
    </> : <>
      <Path d="M53 125C65 95 82 75 103 54M77 87C72 66 83 35 113 26 122 49 104 81 77 87ZM63 109C44 105 33 88 37 67 59 72 72 88 63 109Z" stroke={palette.accent} strokeOpacity="0.18" strokeWidth="1.3" />
      <Circle cx="118" cy="97" r="16" fill={palette.soft} fillOpacity="0.5" />
    </>}
  </Svg>;
}

function RhythmPreview({ pattern, palette }: { pattern: RhythmStep[]; palette: Palette }) {
  const t = useTheme();
  const total = pattern.reduce((sum, phase) => sum + phase.seconds, 0);
  let x = 12;
  let y = 47;
  let path = `M${x} ${y}`;
  for (const phase of pattern) {
    const nextX = x + (phase.seconds / (total || 1)) * 276;
    const nextY = phase.name === 'Inhale' || phase.name === 'Hold' ? 17 : 47;
    if (phase.name === 'Inhale' || phase.name === 'Exhale') {
      const bend = (nextX - x) * 0.48;
      path += ` C${x + bend} ${y} ${nextX - bend} ${nextY} ${nextX} ${nextY}`;
    } else path += ` L${nextX} ${nextY}`;
    x = nextX;
    y = nextY;
  }

  return <View style={[styles.rhythmPanel, { backgroundColor: palette.background }]}>
    <View style={styles.rowBetween}><T size={9} weight="semibold" color={palette.accent} style={{ letterSpacing: 1.1 }}>YOUR BREATHING RHYTHM</T><T size={10} color={t.secondary}>{total}s cycle</T></View>
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ height: 61, pointerEvents: 'none', marginTop: 5 }}>
      <Svg width="100%" height="100%" viewBox="0 0 300 62" fill="none">
        <Line x1="12" y1="17" x2="288" y2="17" stroke={palette.accent} strokeOpacity="0.1" />
        <Line x1="12" y1="47" x2="288" y2="47" stroke={palette.accent} strokeOpacity="0.1" />
        <Path d={path} stroke={palette.accent} strokeWidth="2" strokeLinecap="round" />
        <Circle cx="12" cy="47" r="3" fill={palette.accent} />
        <Circle cx={x} cy={y} r="3" fill={palette.accent} />
      </Svg>
    </View>
    <View style={{ flexDirection: 'row', gap: 6 }}>{pattern.map((phase, index) => <View key={`${phase.name}-${index}`} style={{ flex: 1, alignItems: 'center', minWidth: 0 }}><T size={10} color={t.secondary}>{phase.name}</T><T size={13} weight="semibold" color={palette.accent} style={{ marginTop: 1 }}>{phase.seconds}<T size={10} color={palette.accent}>s</T></T></View>)}</View>
  </View>;
}

function CategoryCard({ category, index, width, onPress }: { category: BreathingCategory; index: number; width: number; onPress: () => void }) {
  const t = useTheme();
  const palette = paletteFor(t, category.tone);
  const Icon = categoryIcons[category.title] || Wind;
  const compact = width < 165;
  return <Pressable
    accessibilityRole="button"
    accessibilityLabel={`${category.title}, ${category.practices.length} practices`}
    accessibilityHint={category.subtitle}
    onPress={onPress}
    style={({ pressed }) => [styles.categoryCard, { width, padding: compact ? 14 : 18, backgroundColor: palette.background, borderColor: palette.background, opacity: pressed ? 0.76 : 1 }]}
  >
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.categoryArt}><CategoryMotif index={index} palette={palette} /></View>
    <View style={[styles.categoryIcon, { backgroundColor: t.surface }]}><Icon size={21} strokeWidth={1.5} color={palette.accent} /></View>
    <T size={compact ? 19 : 21} weight="display" style={{ color: t.text, letterSpacing: -0.45, lineHeight: compact ? 25 : 28, minHeight: compact ? 50 : 28, marginTop: 17 }}>{category.title}</T>
    <T numberOfLines={2} size={10} color={t.secondary} style={{ lineHeight: 16, minHeight: 32, marginTop: 4 }}>{category.subtitle}</T>
    <View style={[styles.rowBetween, { marginTop: 15 }]}><T size={10} weight="medium" color={palette.accent}>{category.practices.length} practices</T><ArrowUpRight size={16} strokeWidth={1.5} color={palette.accent} /></View>
  </Pressable>;
}

export function BreathingLibrary({ category, onChooseCategory, onChoosePractice, onAllCategories, onQuickStart }: Props) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const estimatedWidth = Math.min(1320, width - (width >= 1000 ? 280 : width >= 600 ? 56 : width < 360 ? 28 : 40));
  const [contentWidth, setContentWidth] = useState(estimatedWidth);
  const compact = contentWidth < 540;
  const columns = contentWidth >= 1100 ? 5 : contentWidth >= 810 ? 4 : contentWidth >= 560 ? 3 : 2;
  const gap = compact ? 12 : 16;
  const cardWidth = Math.max(100, (contentWidth - gap * (columns - 1)) / columns);
  const palette = paletteFor(t, category?.tone || 'sage');
  const CategoryIcon = category ? categoryIcons[category.title] || Wind : Wind;

  return <View onLayout={event => { const next = event.nativeEvent.layout.width; if (next > 0) setContentWidth(previous => Math.abs(previous - next) > 1 ? next : previous); }}>
    {category && <Pressable accessibilityRole="button" accessibilityLabel="All breathing categories" onPress={onAllCategories} style={styles.backButton}><ArrowLeft size={17} color={t.primary} /><T size={12} weight="medium" color={t.primary}>All breathing</T></Pressable>}

    <View style={[styles.hero, { padding: compact ? 16 : 29, backgroundColor: palette.background, minHeight: category ? 190 : compact ? 190 : 205 }]}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.heroArt, { width: compact ? 200 : 310, right: compact ? -73 : 5, opacity: compact ? 0.52 : 1 }]}><OrganicBreath palette={palette} /></View>
      <View style={{ maxWidth: compact ? category ? '100%' : 240 : '67%', position: 'relative' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}><CategoryIcon size={13} color={palette.accent} strokeWidth={1.5} /><T size={9} weight="semibold" color={palette.accent} style={{ letterSpacing: 1.8 }}>{category ? 'YOUR BREATHING SPACE' : 'BREATHING'}</T></View>
        <T accessibilityRole="header" size={category ? compact ? 31 : 39 : compact ? 25 : 36} weight="display" style={{ color: t.primaryDark, letterSpacing: -0.95, lineHeight: category ? compact ? 40 : 50 : compact ? 30 : 47, marginTop: compact && !category ? 8 : 10 }}>{category ? category.title : compact ? 'Find your\nbreathing space.' : 'Find your breathing space.'}</T>
        <T size={compact ? 11 : 12} color={t.secondary} style={{ lineHeight: compact && !category ? 17 : 19, marginTop: category ? 8 : 5, maxWidth: 560 }}>{category ? category.description : compact ? 'A little space. One breath at a time.' : 'Find a rhythm for right now. Make a little room for you.'}</T>
        {!category && <Pressable accessibilityRole="button" accessibilityLabel="Prepare a three-minute breathing reset" onPress={onQuickStart} style={({ pressed }) => [styles.quickStart, { backgroundColor: t.primary, opacity: pressed ? 0.78 : 1, marginTop: compact ? 10 : 16 }]}><T size={12} weight="semibold" color={t.isDark ? '#203025' : '#FFFFFF'}>3-minute reset</T><ArrowUpRight size={16} color={t.isDark ? '#203025' : '#FFFFFF'} /></Pressable>}
        {category && <View style={[styles.categoryMeta, { borderColor: palette.accent }]}><T size={10} weight="medium" color={palette.accent}>{category.practices.length} guided rhythms</T><View style={[styles.metaDot, { backgroundColor: palette.accent }]} /><T size={10} color={palette.accent}>At your own pace</T></View>}
      </View>
    </View>

    {!category ? <>
      <View style={[styles.sectionHeading, { marginTop: compact ? 25 : 30 }]}>
        <View style={{ flex: 1 }}><T accessibilityRole="header" size={compact ? 21 : 24} weight="semibold" style={{ letterSpacing: -0.65 }}>How would you like to feel?</T><T size={11} color={t.secondary} style={{ marginTop: 5 }}>A gentle place to begin, whatever the day brings.</T></View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>{breathingCategories.map((item, index) => <CategoryCard key={item.id} category={item} index={index} width={cardWidth} onPress={() => onChooseCategory(item)} />)}</View>
      <View style={[styles.footnote, { borderColor: t.border }]}><Leaf size={15} color={t.primary} strokeWidth={1.5} /><T size={11} color={t.secondary} style={{ flex: 1 }}>No perfect breaths. Just a little space to notice how you feel.</T></View>
    </> : <>
      <View style={[styles.sectionHeading, { marginTop: 28 }]}><View style={{ flex: 1 }}><T accessibilityRole="header" size={22} weight="semibold" style={{ letterSpacing: -0.6 }}>Choose your practice</T><T size={11} color={t.secondary} style={{ marginTop: 5 }}>Pick a rhythm. Your first breath begins when you are ready.</T></View></View>
      <View style={{ flexDirection: contentWidth >= 650 ? 'row' : 'column', gap: 18 }}>
        {category.practices.map(practice => {
          const exercise = breathingExercises.find(item => item.id === practice.exerciseId);
          const pattern = exercise?.pattern || [];
          return <View key={practice.id} style={[styles.practiceCard, { flex: contentWidth >= 650 ? 1 : undefined, backgroundColor: t.surface, borderColor: t.border }]}>
            <View style={styles.rowBetween}><View style={[styles.practiceTag, { backgroundColor: palette.background }]}><T size={9} weight="semibold" color={palette.accent}>{practice.tag}</T></View><View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Clock3 size={13} color={t.secondary} /><T size={11} color={t.secondary}>{practice.duration} min</T></View></View>
            <T size={24} weight="display" style={{ lineHeight: 33, letterSpacing: -0.6, marginTop: 18 }}>{practice.title}</T>
            <T size={12} color={t.secondary} style={{ lineHeight: 20, marginTop: 7, marginBottom: 20, minHeight: contentWidth >= 650 ? 60 : undefined }}>{practice.description}</T>
            <RhythmPreview pattern={pattern} palette={palette} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 13, marginBottom: 20 }}><Wind size={13} color={t.secondary} /><T size={10} color={t.secondary}>{exercise?.name || 'Guided breathing'} · visual guidance</T></View>
            <Pressable accessibilityRole="button" accessibilityLabel={`Prepare ${practice.title}, ${practice.duration} minute${practice.duration === 1 ? '' : 's'}`} accessibilityHint="Opens the breathing timer. It starts only when you press Begin breathing." onPress={() => onChoosePractice(category, practice)} style={({ pressed }) => [styles.prepareButton, { backgroundColor: t.primary, opacity: pressed ? 0.78 : 1 }]}><T size={12} weight="semibold" color={t.isDark ? '#203025' : '#FFFFFF'}>Prepare practice</T><ArrowRight size={16} color={t.isDark ? '#203025' : '#FFFFFF'} /></Pressable>
          </View>;
        })}
      </View>
      <View style={[styles.comfortNote, { backgroundColor: t.surfaceAlt }]}><Sparkles size={17} color={t.primary} strokeWidth={1.5} /><View style={{ flex: 1 }}><T size={12} weight="medium">Make yourself comfortable.</T><T size={11} color={t.secondary} style={{ marginTop: 3 }}>Let your shoulders settle. Follow a comfortable pace, and return to your natural breath whenever you like.</T></View></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Explore all breathing categories" onPress={onAllCategories} style={styles.exploreButton}><T size={12} weight="medium" color={t.primary}>Explore another feeling</T><ArrowRight size={15} color={t.primary} /></Pressable>
    </>}
  </View>;
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 9 },
  backButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 8, marginBottom: 10 },
  hero: { borderRadius: 22, overflow: 'hidden', justifyContent: 'center' },
  heroArt: { position: 'absolute', top: -9, bottom: -16, pointerEvents: 'none' },
  quickStart: { minHeight: 44, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 17, paddingHorizontal: 15, borderRadius: 10, marginTop: 16 },
  categoryMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 19 },
  metaDot: { width: 3, height: 3, borderRadius: 2, opacity: 0.7 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 18 },
  categoryCard: { minHeight: 190, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  categoryArt: { position: 'absolute', right: -7, top: -7, width: 127, height: 115, pointerEvents: 'none' },
  categoryIcon: { width: 38, height: 38, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  footnote: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingTop: 19, borderTopWidth: 1, marginTop: 25 },
  practiceCard: { minWidth: 0, borderRadius: 18, borderWidth: 1, padding: 21 },
  practiceTag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 7, flexShrink: 1 },
  rhythmPanel: { padding: 13, borderRadius: 12 },
  prepareButton: { minHeight: 46, paddingHorizontal: 16, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 9, marginTop: 'auto' },
  comfortNote: { borderRadius: 13, padding: 17, marginTop: 21, flexDirection: 'row', alignItems: 'center', gap: 12 },
  exploreButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 },
});
