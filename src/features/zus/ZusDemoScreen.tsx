import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { Screen } from '@/components/ui/Screen';
import { useUserJourneyStore } from '@/store/useUserJourneyStore';
import { colors, spacing, typography } from '@/theme';

type DemoPhase = 'idle' | 'logging_in' | 'connected' | 'error';

const MOCK_ZUS = {
  insuranceTitle: 'Ubezpieczenie chorobowe — aktywne (demo)',
  employer: 'Przykładowy pracodawca Sp. z o.o.',
  contract: 'Umowa o pracę',
  contributions: 'Składki opłacone do 10.2026 (dane przykładowe)',
  ezla: 'Brak aktywnego e-ZLA w mocku',
  debt: 'Brak zadłużenia (symulacja)',
  benefits: 'Brak trwających wypłat zasiłków w mocku',
};

export function ZusDemoScreen() {
  const loadDemoScenario = useUserJourneyStore((s) => s.loadDemoScenario);
  const [phase, setPhase] = useState<DemoPhase>('idle');

  const simulateLogin = async () => {
    setPhase('logging_in');
    await new Promise((resolve) => setTimeout(resolve, 900));
    // Celowo nie imitujemy prawdziwego flow mObywatela / PKI.
    setPhase('connected');
  };

  return (
    <Screen>
      <DemoBanner message="Integracja mObywatel / PUE eZUS jest wyłącznie demonstracyjna. Nie logujemy Cię do urzędu." />

      <View style={styles.header}>
        <Badge label="Demo · nieoficjalne" tone="demo" />
        <Text style={styles.title}>Dane ZUS (symulacja)</Text>
        <Text style={styles.subtitle}>
          Pokazujemy, jak wyglądałby podgląd ubezpieczenia, e-ZLA i zadłużenia po
          połączeniu konta. To atrapa na potrzeby jury — bez prawdziwego
          uwierzytelnienia.
        </Text>
      </View>

      <Card>
        <Text style={styles.section}>Symulowane logowanie</Text>
        <Text style={styles.body}>
          Przycisk poniżej tylko odtwarza stany UI (ładowanie → sukces). Nie otwiera
          mObywatela i nie prosi o dane logowania.
        </Text>
        {phase === 'idle' ? (
          <Button label="Symuluj połączenie z mObywatelem" onPress={simulateLogin} />
        ) : null}
        {phase === 'logging_in' ? (
          <Text style={styles.loading}>Łączenie z mockiem…</Text>
        ) : null}
        {phase === 'connected' ? (
          <Badge label="Połączono z mockiem (demo)" tone="success" />
        ) : null}
        {phase === 'error' ? (
          <Text style={styles.error}>Nie udało się połączyć z mockiem. Spróbuj ponownie.</Text>
        ) : null}
      </Card>

      {phase === 'connected' ? (
        <Card>
          <Text style={styles.section}>Podgląd PUE / eZUS (dane przykładowe)</Text>
          <Row label="Tytuł ubezpieczenia" value={MOCK_ZUS.insuranceTitle} />
          <Row label="Pracodawca" value={MOCK_ZUS.employer} />
          <Row label="Umowa" value={MOCK_ZUS.contract} />
          <Row label="Składki" value={MOCK_ZUS.contributions} />
          <Row label="e-ZLA" value={MOCK_ZUS.ezla} />
          <Row label="Zadłużenie" value={MOCK_ZUS.debt} />
          <Row label="Świadczenia" value={MOCK_ZUS.benefits} />
          <View style={styles.actions}>
            <Button
              label="Wczytaj profil pracownicy w ciąży"
              onPress={() => {
                loadDemoScenario('pregnant_employee');
                setTimeout(() => router.push('/benefits'), 0);
              }}
            />
            <Button
              label="Moje świadczenia"
              variant="secondary"
              onPress={() => router.push('/benefits')}
            />
          </View>
        </Card>
      ) : (
        <Card>
          <Text style={styles.body}>
            Bez „połączenia” nadal możesz wypełnić ankietę lub wybrać gotowy scenariusz
            demo.
          </Text>
          <Button label="Scenariusze demo" variant="secondary" onPress={() => router.push('/demo')} />
        </Card>
      )}
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm },
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary, maxWidth: 720 },
  section: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  body: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  loading: { ...typography.body, color: colors.textSecondary },
  error: { ...typography.body, color: colors.danger },
  row: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xxs,
  },
  rowLabel: { ...typography.caption, color: colors.textMuted },
  rowValue: { ...typography.body, color: colors.text },
  actions: { gap: spacing.sm, marginTop: spacing.md },
});
