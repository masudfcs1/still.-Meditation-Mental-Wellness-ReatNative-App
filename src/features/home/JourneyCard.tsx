import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { Button, Card, T } from '../../components/ui';
import { artwork } from '../../mock/content';
import { useTheme } from '../../theme';

// Match the bundled photograph so its entire frame remains visible on every screen.
const LAKE_ASPECT_RATIO = 1000 / 667;
const PROGRAM_DAYS = 7;

export function JourneyCard({ completedDays, onOpen }: { completedDays: number; onOpen: () => void }) {
  const t = useTheme();
  const [cardWidth, setCardWidth] = useState(0);
  const sideBySide = cardWidth >= 560;
  const completed = Math.min(PROGRAM_DAYS, Math.max(0, completedDays));
  const finished = completed === PROGRAM_DAYS;
  const action = finished ? 'Revisit program' : completed ? 'Continue program' : 'Start program';

  return <Card style={{ padding: 0, overflow: 'hidden' }}>
    <View onLayout={event => setCardWidth(event.nativeEvent.layout.width)} style={{ flexDirection: sideBySide ? 'row' : 'column', alignItems: 'center' }}>
      <View style={{ width: sideBySide ? '38%' : '100%', aspectRatio: LAKE_ASPECT_RATIO, overflow: 'hidden' }}>
        <Image
          source={artwork.lake}
          accessibilityLabel="A peaceful lake surrounded by mountains and trees"
          resizeMode="cover"
          style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
        />
      </View>
      <View style={{ flex: sideBySide ? 1 : undefined, width: sideBySide ? undefined : '100%', gap: 10, padding: 14 }}>
        <View style={{ gap: 2 }}>
          <T size={9} weight="semibold" color={t.primary} style={{ letterSpacing: 1 }}>{finished ? 'A JOURNEY TO BE PROUD OF' : completed ? 'CONTINUE YOUR PROGRAM' : 'A LITTLE CALM, EVERY DAY'}</T>
          <T size={16} weight="semibold" style={{ letterSpacing: -0.35 }}>7 days of mindfulness</T>
          <T size={11} color={t.secondary}>Find presence in life&apos;s little moments.</T>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <T size={10} weight="medium" color={t.secondary}>{completed} of {PROGRAM_DAYS} days</T>
            <View accessibilityRole="progressbar" accessibilityLabel="Mindfulness program progress" accessibilityValue={{ min: 0, max: PROGRAM_DAYS, now: completed, text: `${completed} of ${PROGRAM_DAYS} days completed` }} style={{ height: 5, backgroundColor: t.primarySoft, borderRadius: 5, overflow: 'hidden' }}>
              <View style={{ height: 5, backgroundColor: t.chart, width: `${completed / PROGRAM_DAYS * 100}%`, borderRadius: 5 }}/>
            </View>
          </View>
          <Button label={action} onPress={onOpen} icon={ArrowRight} variant="secondary" small/>
        </View>
      </View>
    </View>
  </Card>;
}
