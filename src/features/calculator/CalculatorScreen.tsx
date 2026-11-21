import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChoiceChip } from '@/components/ui/ChoiceChip';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { useAdaptiveLayout } from '@/hooks/useAdaptiveLayout';
import {
  ApiClientError,
  calculatorService,
  getApiBaseUrl,
  getApiMode,
} from '@/services/api';
import type { CalculatorResult } from '@/services/api/types';
import { useUserJourneyStore } from '@/store/useUserJourneyStore';
import { colors, spacing, typography } from '@/theme';

export function CalculatorScreen() {
  const profile = useUserJourneyStore((s) => s.profile);
  const { columns, isCompact } = useAdaptiveLayout();
  const mode = getApiMode();
  const baseUrl = getApiBaseUrl();

  const [motherWeeks, setMotherWeeks] = useState('20');
  const [fatherWeeks, setFatherWeeks] = useState('9');
  const [workDuring, setWorkDuring] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      calculatorService.calculate({
        profile,
        leaveSplitMotherWeeks: Number(motherWeeks) || undefined,
        leaveSplitFatherWeeks: Number(fatherWeeks) || undefined,
        workDuringParental: workDuring,
      }),
    onSuccess: (data) => {
      setSelectedScenarioId(data.scenarios[0]?.id ?? null);
    },
  });

  if (!profile.onboardingCompleted) {
    return (
      <Screen>
        <EmptyState
          title="Kalkulator potrzebuje Twojej sytuacji"
          description="Uzupełnij ankietę albo wybierz profil demo — wtedy policzymy warianty."
          actionLabel="Ankieta"
          onAction={() => router.push('/onboarding')}
        />
      </Screen>
    );
  }

  const result = mutation.data;
  const activeScenario =
    result?.scenarios.find((s) => s.id === selectedScenarioId) ?? result?.scenarios[0];

  return (
    <Screen>
      <DemoBanner message="Symulowana wysokość / okresy z API lub mocka — nie decyzja ZUS i nie gwarancja wypłaty." />

      <View style={styles.header}>
        <Badge label={mode === 'rest' ? 'REST' : 'Mock'} tone="primary" />
        <Text style={styles.title}>Kalkulator świadczeń</Text>
        <Text style={styles.subtitle}>
          Porównaj warianty podziału i pracy w trakcie rodzicielskiego. Kwoty liczy silnik
          reguł (backend), nie frontend.
        </Text>
        <Text style={styles.meta}>
          {mode === 'rest'
            ? `POST ${baseUrl}/api/v1/calculations/parental`
            : 'MockCalculatorAdapter (lokalny fixture)'}
        </Text>
      </View>

      <View style={[styles.layout, columns > 1 && styles.layoutRow]}>
        <Card style={columns > 1 ? styles.side : undefined}>
          <Text style={styles.section}>Dane wejściowe</Text>
          <TextField
            label="Tygodnie — rodzic A"
            value={motherWeeks}
            onChangeText={setMotherWeeks}
            keyboardType="numeric"
            hint="Przykładowy podział do porównania UI"
          />
          <TextField
            label="Tygodnie — rodzic B"
            value={fatherWeeks}
            onChangeText={setFatherWeeks}
            keyboardType="numeric"
          />
          <ChoiceChip
            label={
              workDuring
                ? 'Praca w trakcie rodzicielskiego: TAK'
                : 'Praca w trakcie rodzicielskiego: NIE'
            }
            selected={workDuring}
            onPress={() => setWorkDuring((v) => !v)}
          />
          <Button
            label={mutation.isPending ? 'Liczymy…' : 'Policz warianty'}
            onPress={() => mutation.mutate()}
            disabled={mutation.isPending}
            fullWidth={isCompact}
          />
          {mutation.isError ? (
            <Text style={styles.error}>
              {mutation.error instanceof ApiClientError
                ? mutation.error.message
                : 'Nie udało się policzyć wariantów.'}
            </Text>
          ) : null}
        </Card>

        <View style={[styles.results, columns > 1 && styles.main]}>
          {!result && !mutation.isPending ? (
            <Card>
              <Text style={styles.body}>
                Ustaw wariant i kliknij „Policz”. Wynik zawsze zawiera założenia i ostrzeżenia
                z silnika.
              </Text>
              <Button
                label="Wróć do świadczeń"
                variant="secondary"
                onPress={() => router.push('/benefits')}
              />
            </Card>
          ) : null}

          {mutation.isPending ? (
            <Card>
              <Text style={styles.body}>Liczymy warianty…</Text>
            </Card>
          ) : null}

          {result ? <ResultPanel result={result} activeId={activeScenario?.id ?? null} onSelect={setSelectedScenarioId} /> : null}

          {activeScenario ? (
            <Card>
              <Badge label={result?.isDemo ? 'Demo' : 'Wynik API'} tone="demo" />
              <Text style={styles.section}>{activeScenario.name}</Text>
              {activeScenario.periods.map((period) => (
                <Text key={period.id} style={styles.body}>
                  {period.label}: {period.weeks ?? '—'} tyg. ({period.recipient})
                </Text>
              ))}
              <Text style={styles.bodyStrong}>
                Kwota brutto:{' '}
                {activeScenario.grossAmount == null
                  ? 'niedostępna / do ustalenia w silniku'
                  : `${activeScenario.grossAmount} ${activeScenario.currency}`}
              </Text>
              {activeScenario.warnings.map((w) => (
                <Text key={w} style={styles.warning}>
                  {w}
                </Text>
              ))}
              {activeScenario.assumptions.map((a) => (
                <Text key={a} style={styles.meta}>
                  Założenie: {a}
                </Text>
              ))}
            </Card>
          ) : null}

          {result ? (
            <Card>
              <Text style={styles.section}>Założenia globalne</Text>
              <Text style={styles.meta}>Wersja reguł: {result.ruleSetVersion}</Text>
              {result.assumptions.map((a) => (
                <Text key={a} style={styles.meta}>
                  {a}
                </Text>
              ))}
              {result.warnings.map((w) => (
                <Text key={w} style={styles.warning}>
                  {w}
                </Text>
              ))}
              {result.missingInputs.length > 0 ? (
                <Text style={styles.warning}>
                  Brakuje wejść: {result.missingInputs.join(', ')}
                </Text>
              ) : null}
              <Button
                label="Moje świadczenia"
                variant="secondary"
                onPress={() => router.push('/benefits')}
              />
            </Card>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

function ResultPanel({
  result,
  activeId,
  onSelect,
}: {
  result: CalculatorResult;
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  if (result.scenarios.length === 0) {
    return (
      <Card>
        <Badge label="Brak scenariuszy" tone="warning" />
        <Text style={styles.body}>
          Silnik nie zwrócił wariantów
          {result.missingInputs.length
            ? ` — brakuje: ${result.missingInputs.join(', ')}`
            : '.'}
        </Text>
      </Card>
    );
  }

  return (
    <Card>
      <Text style={styles.section}>Porównanie scenariuszy</Text>
      <View style={styles.chips}>
        {result.scenarios.map((scenario) => (
          <ChoiceChip
            key={scenario.id}
            label={scenario.name}
            selected={scenario.id === activeId}
            onPress={() => onSelect(scenario.id)}
          />
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary, maxWidth: 720 },
  meta: { ...typography.small, color: colors.textMuted, marginBottom: spacing.xs },
  layout: { gap: spacing.md },
  layoutRow: { flexDirection: 'row', alignItems: 'flex-start' },
  side: { width: 340, maxWidth: '100%' },
  main: { flex: 1, minWidth: 0 },
  results: { gap: spacing.md, flex: 1 },
  section: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  body: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs },
  bodyStrong: { ...typography.bodyStrong, color: colors.text, marginVertical: spacing.sm },
  warning: { ...typography.small, color: colors.warning, marginTop: spacing.xs },
  error: { ...typography.small, color: colors.danger, marginTop: spacing.sm },
  chips: { gap: spacing.sm },
});
