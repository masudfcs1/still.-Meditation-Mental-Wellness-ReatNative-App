import React, { useMemo, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, TextInput, TextStyle, useWindowDimensions, View } from 'react-native';
import { ArrowRight, Grid2X2, List, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react-native';
import { Button, Card, Chip, EmptyState, IconButton, PageTitle, SectionHeading, T } from '../../components/ui';
import { MeditationCard } from '../../components/MeditationCard';
import { artwork, sessions } from '../../mock/content';
import { fonts, useTheme } from '../../theme';
import { Navigate } from '../../types';

const curatedCategories: Record<string, string[]> = {
  Anxiety: ['let-go', 'body-scan', 'ocean-breath', 'quiet-mind'],
  Relaxation: ['body-scan', 'let-go', 'kindness', 'ocean-breath'],
  Morning: ['morning-stillness', 'deep-focus', 'quiet-mind'],
  Night: ['restful-sleep', 'sleep-story', 'body-scan'],
  Productivity: ['deep-focus', 'quiet-mind', 'ocean-breath'],
};
const categories = ['All', 'Mindfulness', 'Sleep', 'Anxiety', 'Focus', 'Stress relief', 'Relaxation', 'Breathwork', 'Self love', 'Morning', 'Night', 'Productivity'];
const tagsForSession = (id: string) => Object.entries(curatedCategories).filter(([, ids]) => ids.includes(id)).map(([tag]) => tag).join(' ');
const durations = ['Any length', '10 min or less', '11–20 min', 'Over 20 min'];
const levels = ['All difficulties', 'Beginner', 'Intermediate', 'All levels'];
const teachers = ['All teachers', 'Sarah Mitchell', 'James Chen', 'Emma Wilson'];

export function ExploreScreen({ onNavigate, initialCategory }: { onNavigate: Navigate; initialCategory?: string }) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const available = width >= 1000 ? width - 280 : width;
  const columns = available >= 800 ? 3 : available >= 520 ? 2 : 1;
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [category, setCategory] = useState(initialCategory || 'All');
  const [duration, setDuration] = useState(durations[0]);
  const [level, setLevel] = useState(levels[0]);
  const [teacher, setTeacher] = useState(teachers[0]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [listView, setListView] = useState(false);
  const filterCount = Number(duration !== durations[0]) + Number(level !== levels[0]) + Number(teacher !== teachers[0]);
  const filtered = useMemo(() => sessions.filter(s =>
    (category === 'All' || s.category === category || curatedCategories[category]?.includes(s.id)) &&
    (!query.trim() || `${s.title} ${s.subtitle} ${s.instructor} ${s.category} ${tagsForSession(s.id)}`.toLowerCase().includes(query.trim().toLowerCase())) &&
    (duration === durations[0] || (duration === durations[1] && s.duration <= 10) || (duration === durations[2] && s.duration > 10 && s.duration <= 20) || (duration === durations[3] && s.duration > 20)) &&
    (level === levels[0] || s.difficulty === level) && (teacher === teachers[0] || s.instructor === teacher)
  ), [category, query, duration, level, teacher]);
  const clear = () => { setQuery(''); setCategory('All'); setDuration(durations[0]); setLevel(levels[0]); setTeacher(teachers[0]); };

  return <View>
    <PageTitle eyebrow="SPACE FOR YOU" title={initialCategory ? 'Make room for stillness.' : 'Find your next little pause.'} subtitle="Whatever today feels like, there’s a practice for you." />
    <View style={styles.searchRow}>
      <View style={[styles.search, { backgroundColor: t.surface, borderColor: searchFocused ? t.primary : t.border }]}><Search size={18} color={searchFocused ? t.primary : t.secondary} /><TextInput accessibilityLabel="Search meditations" value={query} onChangeText={setQuery} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} placeholder="Search meditations, teachers, or a feeling…" placeholderTextColor={t.muted} returnKeyType="search" style={[styles.input, { color: t.text }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as unknown as TextStyle)]} />{query.length > 0 && <IconButton icon={X} label="Clear search" onPress={() => setQuery('')} size={16} style={{ width: 30, height: 32 }} />}</View>
      <Button label={`Filters${filterCount ? ` · ${filterCount}` : ''}`} icon={SlidersHorizontal} variant={filtersOpen || filterCount > 0 ? 'primary' : 'secondary'} onPress={() => setFiltersOpen(!filtersOpen)} />
    </View>
    {filtersOpen && <Card style={{ padding: 20, marginBottom: 20, gap: 17 }}>
      <FilterRow title="DURATION" options={durations} value={duration} onChange={setDuration} />
      <FilterRow title="EXPERIENCE" options={levels} value={level} onChange={setLevel} />
      <FilterRow title="TEACHER" options={teachers} value={teacher} onChange={setTeacher} />
      {filterCount > 0 && <Pressable onPress={() => { setDuration(durations[0]); setLevel(levels[0]); setTeacher(teachers[0]); }} accessibilityRole="button"><T size={12} color={t.primary} weight="semibold">Reset filters</T></Pressable>}
    </Card>}
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 5 }} style={{ marginBottom: 25 }}>{categories.map(value => <Chip key={value} label={value} active={value === category} onPress={() => setCategory(value)} />)}</ScrollView>
    {!query && !filterCount && category === 'All' && <View style={[styles.feature, { backgroundColor: t.primarySoft, flexDirection: available < 650 ? 'column' : 'row' }]}>
      <View style={[styles.featureCopy, { flex: available < 650 ? undefined : 1 }]}><View style={{ flexDirection: 'row', gap: 7, alignItems: 'center', marginBottom: 13 }}><Sparkles size={15} color={t.primary} /><T size={10} weight="semibold" color={t.primary} style={{ letterSpacing: 1.1 }}>GROW A LITTLE, EVERY DAY</T></View><T size={27} weight="display" style={{ lineHeight: 36, letterSpacing: -0.7 }}>A small practice.{'\n'}A meaningful shift.</T><T size={12} color={t.secondary} style={{ maxWidth: 340, marginTop: 10, marginBottom: 20 }}>Start your 7-day mindfulness journey, and discover what a few minutes can change.</T><Button label="Explore the program" icon={ArrowRight} onPress={() => onNavigate('Programs')} style={{ alignSelf: 'flex-start' }} small /></View>
      <View style={{ width: available < 650 ? '100%' : '43%', height: available < 650 ? 165 : undefined, minHeight: available < 650 ? undefined : 244, overflow: 'hidden', flexShrink: 0 }}><Image source={artwork.forest} resizeMode="cover" style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} /></View>
    </View>}
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}><View style={{ flex: 1, minWidth: 0 }}><T size={18} weight="semibold" style={{ letterSpacing: -0.5 }}>{category === 'All' ? 'Explore all meditations' : `${category} meditations`}</T><T size={11} color={t.secondary} style={{ marginTop: 3 }}>{filtered.length} {filtered.length === 1 ? 'practice' : 'practices'} to meet you where you are</T></View><View style={{ flexDirection: 'row', backgroundColor: t.surface, borderRadius: 9, borderWidth: 1, borderColor: t.border, padding: 3 }}><IconButton icon={Grid2X2} selected={!listView} label="Grid view" onPress={() => setListView(false)} size={16} color={!listView ? t.primary : t.muted} style={{ backgroundColor: !listView ? t.primarySoft : 'transparent', width: 34, height: 32, borderRadius: 6 }} /><IconButton icon={List} selected={listView} label="List view" onPress={() => setListView(true)} size={17} color={listView ? t.primary : t.muted} style={{ backgroundColor: listView ? t.primarySoft : 'transparent', width: 34, height: 32, borderRadius: 6 }} /></View></View>
    {filtered.length ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 19 }}>{filtered.map(session => <MeditationCard key={session.id} session={session} compact={listView} style={{ width: listView || columns === 1 ? '100%' : columns === 2 ? '47.5%' : '31%', flexGrow: 0 }} />)}</View> : <EmptyState icon={Search} title="A fresh place to start" description="No practices match these filters just yet. Try another feeling, teacher, or session length." action="Clear all filters" onAction={clear} />}
    <Card style={{ marginTop: 28, backgroundColor: t.isDark ? t.surfaceAlt : '#F2F0EA', borderWidth: 0, flexDirection: available < 550 ? 'column' : 'row', alignItems: available < 550 ? 'flex-start' : 'center', gap: 20 }}><View style={{ flex: 1 }}><SectionHeading title="Prefer to follow your breath?" subtitle="A simple breathing exercise is always a good place to begin." /></View><Button label="Try breathwork" variant="secondary" onPress={() => onNavigate('Breathing')} icon={ArrowRight} /></Card>
  </View>;
}

function FilterRow({ title, options, value, onChange }: { title: string; options: string[]; value: string; onChange: (value: string) => void }) {
  const t = useTheme();
  return <View style={{ gap: 9 }}><T size={9} weight="semibold" color={t.secondary} style={{ letterSpacing: 1.3 }}>{title}</T><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>{options.map(option => <Chip key={option} label={option} active={value === option} onPress={() => onChange(option)} />)}</View></View>;
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  search: { borderWidth: 1, borderRadius: 11, paddingHorizontal: 15, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  input: { fontFamily: fonts.regular, fontSize: 12, flex: 1, minWidth: 0, paddingVertical: 12 },
  feature: { borderRadius: 18, overflow: 'hidden', marginBottom: 30 },
  featureCopy: { padding: 29 },
});
