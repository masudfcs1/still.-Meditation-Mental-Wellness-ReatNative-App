import React, { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { ArrowRight, Heart, Wind } from 'lucide-react-native';
import { Button, Card, Chip, EmptyState, PageTitle, SectionHeading, T } from '../../components/ui';
import { MeditationCard } from '../../components/MeditationCard';
import { programs, sessions } from '../../mock/content';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../theme';
import { Navigate, Program } from '../../types';
import { ProgramCard, ProgramDetail } from '../programs/ProgramsScreen';
import { sleepSounds, sleepSoundSession } from '../sleep/data';

const breathingExercises = [
  { id: 'breathing:box', title: 'Box breathing', description: 'A steady rhythm to bring you back to center.', rhythm: '4 · 4 · 4 · 4' },
  { id: 'breathing:478', title: '4–7–8 breathing', description: 'A longer exhale, a softer landing.', rhythm: '4 · 7 · 8' },
  { id: 'breathing:deep', title: 'Deep breathing', description: 'Find a little more space with every breath.', rhythm: 'Slow & gentle' },
  { id: 'breathing:calm', title: 'Relaxation', description: 'Release a little tension. Welcome a little calm.', rhythm: 'Unhurried & easy' },
  { id: 'breathing:focus', title: 'Focus', description: 'Clear the noise and settle your attention.', rhythm: 'Balanced & steady' },
];

export function FavoritesScreen({ onNavigate }: { onNavigate: Navigate }) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const available = width >= 1000 ? width - 280 : width;
  const columns = available >= 800 ? 3 : available >= 520 ? 2 : 1;
  const [filter, setFilter] = useState('Everything');
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const favorites = useAppStore(s => s.favorites);
  const toggleFavorite = useAppStore(s => s.toggleFavorite);
  const savedMeditations = sessions.filter(s => favorites.includes(s.id) && s.category !== 'Sleep');
  const savedPrograms = programs.filter(p => favorites.includes(p.id));
  const savedSleep = [...sessions.filter(s => s.category === 'Sleep'), ...sleepSounds.map(s => sleepSoundSession(s))].filter(s => favorites.includes(s.id));
  const savedBreathing = breathingExercises.filter(b => favorites.includes(b.id));
  const total = savedMeditations.length + savedPrograms.length + savedSleep.length + savedBreathing.length;
  const visibleCount = filter === 'Meditations' ? savedMeditations.length : filter === 'Programs' ? savedPrograms.length : filter === 'Sleep' ? savedSleep.length : filter === 'Breathing' ? savedBreathing.length : total;
  const cardWidth = columns === 3 ? '31%' : columns === 2 ? '47.5%' : '100%';
  return <View>
    <PageTitle eyebrow="YOUR LITTLE COLLECTION OF CALM" title="The ones you come back to." subtitle="Keep the practices that feel like home, all in one place." right={available > 600 ? <View style={{ width: 47, height: 47, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: t.peach }}><Heart size={22} color="#AF8775" strokeWidth={1.5} /></View> : undefined} />
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 23 }}><Heart size={15} color={t.primary} /><T size={12} color={t.secondary} style={{ flex: 1 }}>{total} saved {total === 1 ? 'practice' : 'practices'} · Always here when you need them</T></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 5 }} style={{ marginBottom: 24 }}>{['Everything', 'Meditations', 'Programs', 'Breathing', 'Sleep'].map(value => <Chip key={value} label={value} active={value === filter} onPress={() => setFilter(value)} />)}</ScrollView>
    {!visibleCount && <EmptyState icon={Heart} title={total ? 'Make a little room for your favorites' : 'Your calm collection starts here'} description={total ? `Save your favorite ${filter.toLowerCase()} with the heart icon, and they’ll be waiting for you here.` : 'Found a practice you love? Tap its heart to save it here for a moment when you need it.'} action={filter === 'Programs' ? 'Explore programs' : filter === 'Breathing' ? 'Explore breathwork' : filter === 'Sleep' ? 'Explore sleep' : 'Explore meditations'} onAction={() => onNavigate(filter === 'Programs' ? 'Programs' : filter === 'Breathing' ? 'Breathing' : filter === 'Sleep' ? 'Sleep' : 'Explore')} />}
    {(filter === 'Everything' || filter === 'Meditations') && savedMeditations.length > 0 && <View style={{ marginBottom: 29 }}><SectionHeading title="Your go-to meditations" subtitle="A familiar voice. A little room to breathe." /><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 19 }}>{savedMeditations.map(session => <MeditationCard key={session.id} session={session} style={{ width: cardWidth }} />)}</View></View>}
    {(filter === 'Everything' || filter === 'Programs') && savedPrograms.length > 0 && <View style={{ marginBottom: 29 }}><SectionHeading title="Journeys worth keeping" subtitle="Small steps you can take at your own pace." /><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 19 }}>{savedPrograms.map(program => <ProgramCard key={program.id} program={program} onPress={() => setSelectedProgram(program)} style={{ width: cardWidth }} />)}</View></View>}
    {(filter === 'Everything' || filter === 'Breathing') && savedBreathing.length > 0 && <View style={{ marginBottom: 29 }}><SectionHeading title="Back to your breath" subtitle="Simple rhythms to help you find your center." /><View style={{ gap: 13 }}>{savedBreathing.map(exercise => <Card key={exercise.id} style={{ padding: 21, flexDirection: 'row', alignItems: 'center', gap: 15 }}><View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: t.primarySoft, justifyContent: 'center', alignItems: 'center' }}><Wind size={22} color={t.primary} /></View><Pressable accessibilityRole="button" accessibilityLabel={`Open ${exercise.title}`} onPress={() => router.navigate({ pathname: '/breathing', params: { exercise: exercise.id.replace('breathing:', '') } })} style={{ flex: 1 }}><T size={14} weight="semibold">{exercise.title}</T><T size={11} color={t.secondary} style={{ marginTop: 4 }}>{exercise.description}</T><T size={10} color={t.primary} style={{ marginTop: 6 }}>{exercise.rhythm}</T></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Remove ${exercise.title} from favorites`} onPress={() => toggleFavorite(exercise.id)} style={{ padding: 10 }}><Heart size={18} color={t.primary} fill={t.primary} /></Pressable></Card>)}</View></View>}
    {(filter === 'Everything' || filter === 'Sleep') && savedSleep.length > 0 && <View style={{ marginBottom: 29 }}><SectionHeading title="A softer end to the day" subtitle="Your favorite ways to let go and drift off." /><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 19 }}>{savedSleep.map(session => <MeditationCard key={session.id} session={session} style={{ width: cardWidth }} />)}</View></View>}
    {total > 0 && <Card style={{ marginTop: 2, borderWidth: 0, backgroundColor: t.primarySoft, flexDirection: available < 550 ? 'column' : 'row', alignItems: available < 550 ? 'flex-start' : 'center', gap: 18 }}><View style={{ flex: 1 }}><T size={17} weight="display">There’s always something new to love.</T><T size={12} color={t.secondary} style={{ marginTop: 7 }}>Find a practice that meets you where you are today.</T></View><Button label="Explore more" icon={ArrowRight} variant="secondary" onPress={() => onNavigate('Explore')} /></Card>}
    <ProgramDetail program={selectedProgram} onClose={() => setSelectedProgram(null)} />
  </View>;
}
