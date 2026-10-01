import React, { useRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, TextStyle, View } from 'react-native';
import { CalendarDays, Check, Clock3, Leaf } from 'lucide-react-native';
import { Button, Chip, T } from '../../components/ui';
import { localDateKey, useAppStore } from '../../store/useAppStore';
import { fonts, useTheme } from '../../theme';
import { Category } from '../../types';
import { SettingsModal } from '../profile/ProfilePrimitives';

const categories: Category[] = ['Mindfulness', 'Breathwork', 'Sleep', 'Focus', 'Stress relief', 'Self love'];
type DateChoice = 'today' | 'yesterday' | 'custom';

function yesterdayKey() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return localDateKey(yesterday);
}

function isValidPracticeDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(`${value}T12:00:00`);
  return year > 0 && Number.isFinite(date.getTime()) && date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day && value <= localDateKey();
}

export function LogPracticeModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return <SettingsModal title="Log your practice" visible={visible} onClose={onClose}>
    {visible && <PracticeEntryForm onClose={onClose} />}
  </SettingsModal>;
}

function PracticeEntryForm({ onClose }: { onClose: () => void }) {
  const t = useTheme();
  const logPractice = useAppStore(s => s.logPractice);
  const hasHydrated = useAppStore(s => s.hasHydrated);
  const [minutes, setMinutes] = useState('10');
  const [dateChoice, setDateChoice] = useState<DateChoice>('today');
  const [customDate, setCustomDate] = useState(localDateKey());
  const [category, setCategory] = useState<Category>('Mindfulness');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [invalidField, setInvalidField] = useState<'minutes' | 'date' | null>(null);
  const [focusedField, setFocusedField] = useState<'minutes' | 'date' | 'title' | null>(null);
  const saving = useRef(false);
  const date = dateChoice === 'today' ? localDateKey() : dateChoice === 'yesterday' ? yesterdayKey() : customDate;
  const clearError = () => { setError(''); setInvalidField(null); };
  const save = () => {
    if (saving.current) return;
    if (!hasHydrated) { setError('Your saved practice is still loading. Please try again in a moment.'); return; }
    const duration = Number(minutes.trim());
    if (!/^\d+(?:\.\d{1,2})?$/.test(minutes.trim()) || !Number.isFinite(duration) || duration < 1 || duration > 180) {
      setInvalidField('minutes');
      setError('Enter a duration between 1 and 180 minutes.');
      return;
    }
    const practiceDate = dateChoice === 'today' ? localDateKey() : dateChoice === 'yesterday' ? yesterdayKey() : customDate.trim();
    if (!isValidPracticeDate(practiceDate)) {
      setInvalidField('date');
      setError('Use a real date in YYYY-MM-DD format, today or earlier.');
      return;
    }
    saving.current = true;
    const saved = logPractice({ minutes: duration, date: practiceDate, category, ...(title.trim() ? { title: title.trim() } : {}) });
    if (saved) onClose();
    else { saving.current = false; setError('Your practice couldn’t be saved. Check the details and try again.'); }
  };
  const inputStyle = (field: 'minutes' | 'date' | 'title'): TextStyle[] => [
    styles.input,
    { backgroundColor: t.background, color: t.text, borderColor: invalidField === field ? t.danger : focusedField === field ? t.primary : t.border },
    ...(Platform.OS === 'web' ? [{ outlineStyle: 'none' } as unknown as TextStyle] : []),
  ];

  return <View style={{ gap: 23 }}>
    <View style={{ flexDirection: 'row', gap: 11, alignItems: 'center', padding: 14, borderRadius: 12, backgroundColor: t.primarySoft }}>
      <Leaf size={20} color={t.primary} strokeWidth={1.5} />
      <T size={12} color={t.secondary} style={{ flex: 1 }}>Add a practice you completed away from the app. Every mindful moment counts.</T>
    </View>

    <View style={{ gap: 11 }}>
      <View style={styles.labelRow}><Clock3 size={15} color={t.primary} /><T size={13} weight="semibold">How long did you practice?</T></View>
      <View style={styles.chips}>{[5, 10, 15, 20, 30].map(value => <Chip key={value} label={`${value} min`} active={Number(minutes) === value} onPress={() => { setMinutes(String(value)); clearError(); }} />)}</View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TextInput accessibilityLabel="Practice duration in minutes" aria-invalid={Platform.OS === 'web' ? invalidField === 'minutes' : undefined} value={minutes} onChangeText={value => { setMinutes(value); clearError(); }} onFocus={() => setFocusedField('minutes')} onBlur={() => setFocusedField(null)} keyboardType="decimal-pad" inputMode="decimal" maxLength={6} selectTextOnFocus returnKeyType="done" style={[...inputStyle('minutes'), { width: 93, textAlign: 'center', fontSize: 22, paddingVertical: 8 }]} />
        <View style={{ flex: 1 }}><T size={12} color={t.secondary}>minutes</T><T size={10} color={t.muted} style={{ marginTop: 2 }}>Or enter your own, from 1 to 180.</T></View>
      </View>
    </View>

    <View style={{ gap: 11 }}>
      <View style={styles.labelRow}><CalendarDays size={15} color={t.primary} /><T size={13} weight="semibold">When was it?</T></View>
      <View style={styles.chips}>{([{ value: 'today', label: 'Today' }, { value: 'yesterday', label: 'Yesterday' }, { value: 'custom', label: 'Another day' }] as const).map(option => <Chip key={option.value} label={option.label} active={dateChoice === option.value} onPress={() => { setDateChoice(option.value); clearError(); }} />)}</View>
      {dateChoice === 'custom' ? <View style={{ gap: 6 }}>
        <TextInput accessibilityLabel="Practice date in YYYY-MM-DD format" aria-invalid={Platform.OS === 'web' ? invalidField === 'date' : undefined} value={customDate} onChangeText={value => { setCustomDate(value); clearError(); }} onFocus={() => setFocusedField('date')} onBlur={() => setFocusedField(null)} placeholder="YYYY-MM-DD" placeholderTextColor={t.muted} maxLength={10} autoCorrect={false} autoCapitalize="none" keyboardType="numbers-and-punctuation" style={inputStyle('date')} />
        <T size={10} color={t.secondary}>For example, {localDateKey()}. Future dates aren’t available.</T>
      </View> : <T size={11} color={t.secondary}>{new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</T>}
    </View>

    <View style={{ gap: 11 }}><T size={13} weight="semibold">What kind of practice?</T><View style={styles.chips}>{categories.map(value => <Chip key={value} label={value} active={category === value} onPress={() => { setCategory(value); clearError(); }} />)}</View></View>

    <View style={{ gap: 9 }}><T size={13} weight="semibold">Give it a name <T size={11} color={t.secondary}>(optional)</T></T><TextInput accessibilityLabel="Practice name, optional" value={title} onChangeText={setTitle} onFocus={() => setFocusedField('title')} onBlur={() => setFocusedField(null)} placeholder="A quiet moment before work" placeholderTextColor={t.muted} maxLength={80} returnKeyType="done" onSubmitEditing={save} style={inputStyle('title')} /></View>

    <View style={{ gap: 12 }}>
      {!!error && <T accessibilityRole="alert" accessibilityLiveRegion="polite" aria-live="polite" size={12} color={t.danger}>{error}</T>}
      {!hasHydrated && <T size={11} color={t.secondary}>Loading your saved practice…</T>}
      <Button label="Save practice" icon={Check} onPress={save} disabled={!hasHydrated} />
      <T size={10} color={t.muted} style={{ textAlign: 'center' }}>Saved on this device and included in your daily progress.</T>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontFamily: fonts.regular, fontSize: 13 },
});
