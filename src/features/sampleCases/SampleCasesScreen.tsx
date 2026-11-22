import { useQueryClient } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { LegalDisclaimer } from '@/components/ui/LegalDisclaimer';
import { Screen } from '@/components/ui/Screen';
import {
  SAMPLE_CASE_LEGAL_NOTE,
  SAMPLE_CASES,
  type SampleCase,
  type SampleCaseKind,
} from '@/features/sampleCases/sampleCaseCatalog';
import { CATALOG_ELIGIBILITY_QUERY_KEY } from '@/hooks/useCatalogEligibility';
import { useUserJourneyStore } from '@/store/useUserJourneyStore';
import { colors, spacing, typography } from '@/theme';

const KIND_LABEL: Record<SampleCaseKind, string> = {
  positive: 'Pozytywne uprawnienie (orientacyjnie)',
  not_eligible: 'Brak prawa / odmowa',
  insufficient_data: 'Brak danych',
  other_insurance: 'Inna forma ubezpieczenia',
  special: 'Przypadek szczególny',
};

const KIND_TONE: Record<
  SampleCaseKind,
  'success' | 'danger' | 'warning' | 'primary' | 'neutral'
> = {
  positive: 'success',
  not_eligible: 'danger',
  insufficient_data: 'warning',
  other_insurance: 'primary',
  special: 'neutral',
};

export function SampleCasesScreen() {
  const loadDemoScenario = useUserJourneyStore((s) => s.loadDemoScenario);
  const activeId = useUserJourneyStore((s) => s.profile.demoScenarioId);
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => SAMPLE_CASES.find((c) => c.id === selectedId) ?? null,
    [selectedId],
  );

  const loadCase = (sample: SampleCase) => {
    if (sample.profileId) {
      loadDemoScenario(sample.profileId);
      // Nie zostawiaj wyników poprzedniego profilu w cache.
      void queryClient.invalidateQueries({
        queryKey: [CATALOG_ELIGIBILITY_QUERY_KEY],
      });
    }
    setSelectedId(sample.id);
  };

  return (
    <Screen
      title="Sprawdź przykładową sprawę"
      subtitle="Syntetyczne przypadki do testów — bez oryginalnych PDF ZUS."
      backFallbackHref="/benefits"
    >
      <DemoBanner message={SAMPLE_CASE_LEGAL_NOTE} />
      <LegalDisclaimer />

      <Card elevated style={styles.intro}>
        <Text style={styles.body}>
          Wybierz przykładową sytuację i zobacz, jak eBobo ocenia świadczenia.
          To syntetyczne profile demonstracyjne — nie oryginalne dokumenty ZUS.
        </Text>
        <Button
          label="Wgraj własny PDF (analiza)"
          variant="secondary"
          onPress={() => router.push('/documents')}
        />
        <Text style={styles.meta}>
          Analiza PDF działa tylko gdy backend `/documents/analyze` odpowiada.
          Fallback mock nie udaje odczytu dokumentu konkursowego.
        </Text>
      </Card>

      <View style={styles.list}>
        {SAMPLE_CASES.map((sample) => {
          const isOpen = selectedId === sample.id;
          const profileActive =
            sample.profileId != null && activeId === sample.profileId;
          return (
            <Card key={sample.id}>
              <Badge
                label={KIND_LABEL[sample.kind]}
                tone={KIND_TONE[sample.kind]}
              />
              <Text style={styles.title}>{sample.title}</Text>
              <Text style={styles.body}>{sample.summary}</Text>
              <Button
                label={isOpen ? 'Ukryj szczegóły' : 'Wybierz sprawę'}
                variant={isOpen ? 'secondary' : 'primary'}
                onPress={() =>
                  isOpen ? setSelectedId(null) : loadCase(sample)
                }
                fullWidth
              />
              {profileActive ? (
                <Badge label="Profil wczytany" tone="success" />
              ) : null}

              {isOpen ? <CaseDetail sample={sample} /> : null}
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

function CaseDetail({ sample }: { sample: SampleCase }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.section}>Co sprawdzić</Text>
      {sample.checks.map((c) => (
        <Text key={c} style={styles.meta}>
          • {c}
        </Text>
      ))}

      <Text style={styles.section}>Orientacyjny wynik</Text>
      <Text style={styles.meta}>Ubezpieczenie: {sample.expectedOrientation.insurance}</Text>
      <Text style={styles.meta}>
        Uprawnienie: {sample.expectedOrientation.eligibility}
      </Text>
      <Text style={styles.meta}>Kwota: {sample.expectedOrientation.amount}</Text>
      <Text style={styles.meta}>
        Referencja: {sample.expectedOrientation.reference}
      </Text>

      <View style={styles.actions}>
        {sample.runCatalog ? (
          <>
            <Button
              label="1. Oceń 9 świadczeń"
              onPress={() => router.push('/benefits')}
              fullWidth
            />
            <Button
              label="2. Oblicz kwotę"
              variant="secondary"
              onPress={() =>
                router.push(
                  `/calculator?benefit=${encodeURIComponent(sample.focusBenefit)}&from=benefit` as Href,
                )
              }
              fullWidth
            />
            <Button
              label="3. Szczegóły świadczenia"
              variant="secondary"
              onPress={() =>
                router.push(
                  `/benefits/${encodeURIComponent(sample.focusBenefit)}` as Href,
                )
              }
              fullWidth
            />
          </>
        ) : null}
        {sample.apiScenarioId ? (
          <Button
            label="Otwórz scenariusz FastAPI (eligibility)"
            variant="secondary"
            onPress={() => router.push('/eligibility')}
            fullWidth
          />
        ) : null}
        {sample.id === 'stillbirth' || sample.id === 'preemie' ? (
          <Button
            label="Gdzie szukać pomocy"
            variant="ghost"
            onPress={() => router.push('/help')}
            fullWidth
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.sm },
  list: { gap: spacing.md },
  title: { ...typography.h3, color: colors.text, marginTop: spacing.sm },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    marginVertical: spacing.sm,
  },
  meta: { ...typography.small, color: colors.textMuted, marginBottom: spacing.xs },
  detail: { gap: spacing.xs, marginTop: spacing.md },
  section: {
    ...typography.bodyStrong,
    color: colors.text,
    marginTop: spacing.sm,
  },
  actions: { gap: spacing.sm, marginTop: spacing.md },
});
