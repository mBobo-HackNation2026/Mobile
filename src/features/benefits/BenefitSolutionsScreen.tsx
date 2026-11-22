import { useQuery } from '@tanstack/react-query';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { eligibilityService } from '@/services/api';
import { useUserJourneyStore } from '@/store/useUserJourneyStore';
import { colors, spacing, typography } from '@/theme';
import { REMEDY_KIND_LABEL } from '@/types/benefits';

export function BenefitSolutionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useUserJourneyStore((s) => s.profile);

  const query = useQuery({
    queryKey: ['eligibility', profile],
    queryFn: () => eligibilityService.evaluate(profile),
    enabled: profile.onboardingCompleted,
  });

  const benefit = query.data?.benefits.find((item) => item.id === id);
  const unmet = benefit?.conditions.filter((c) => c.state === 'unmet') ?? [];

  if (!profile.onboardingCompleted || query.isLoading) {
    return (
      <Screen>
        <Card>
          <Text style={styles.muted}>Ładowanie rozwiązań…</Text>
        </Card>
      </Screen>
    );
  }

  if (!benefit) {
    return (
      <Screen>
        <EmptyState
          title="Brak świadczenia"
          description="Wróć do listy."
          actionLabel="Moje świadczenia"
          onAction={() => router.push('/benefits')}
        />
      </Screen>
    );
  }

  return (
    <Screen
      title="Możliwe rozwiązania"
      subtitle={benefit.title}
      backFallbackHref={`/benefits/${benefit.id}`}
    >
      <DemoBanner message="Pokazujemy tylko działania z fixture/API — bez gwarancji świadczenia i bez obchodzenia prawa." />

      <Card>
        <Text style={styles.section}>Problem</Text>
        {unmet.length > 0 ? (
          unmet.map((condition) => (
            <View key={condition.id} style={styles.block}>
              <Text style={styles.bodyStrong}>{condition.label}</Text>
              <Text style={styles.body}>{condition.explanation}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.body}>{benefit.summary}</Text>
        )}
      </Card>

      <Card>
        <Text style={styles.section}>Dlaczego to istotne</Text>
        <Text style={styles.body}>{benefit.rationale}</Text>
      </Card>

      <Card>
        <Text style={styles.section}>Możliwe działania</Text>
        {benefit.remedies.length === 0 ? (
          <Text style={styles.body}>
            Na podstawie dostępnych informacji nie mamy potwierdzonego działania naprawczego.
          </Text>
        ) : (
          benefit.remedies.map((remedy) => (
            <View key={remedy.id} style={styles.remedy}>
              <Badge label={REMEDY_KIND_LABEL[remedy.kind]} tone="warning" />
              <Text style={styles.bodyStrong}>{remedy.title}</Text>
              <Text style={styles.body}>{remedy.description}</Text>
              <Text style={styles.meta}>
                Skutek:{" "}
                {remedy.affects === 'future'
                  ? 'raczej na przyszłe uprawnienie'
                  : remedy.affects === 'current'
                    ? 'może dotyczyć bieżącej oceny (po weryfikacji)'
                    : 'nieustalony'}
              </Text>
              {remedy.limitations.map((limit) => (
                <Text key={limit} style={styles.warning}>
                  Ograniczenie: {limit}
                </Text>
              ))}
              <Button
                label={remedy.ctaLabel}
                onPress={() => router.push(remedy.ctaHref as '/onboarding')}
              />
            </View>
          ))
        )}
      </Card>

      {benefit.alternatives.length > 0 ? (
        <Card>
          <Text style={styles.section}>Alternatywy</Text>
          {benefit.alternatives.map((alt) => (
            <View key={alt.id} style={styles.block}>
              <Text style={styles.bodyStrong}>{alt.title}</Text>
              <Text style={styles.body}>{alt.reason}</Text>
              <Link href={`/benefits/${alt.id}`}>
                <Text style={styles.link}>Otwórz ocenę →</Text>
              </Link>
            </View>
          ))}
        </Card>
      ) : null}

      <Card>
        <Text style={styles.section}>Następny krok</Text>
        <Text style={styles.body}>
          Wybierz działanie powyżej albo wróć do formalności, jeśli przeszkoda nie dotyczy
          Twojej ścieżki.
        </Text>
        <Button
          label="Moje świadczenia"
          variant="secondary"
          onPress={() => router.push('/benefits')}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  body: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  bodyStrong: { ...typography.bodyStrong, color: colors.text, marginBottom: spacing.xs },
  meta: { ...typography.small, color: colors.textMuted, marginBottom: spacing.xs },
  warning: { ...typography.small, color: colors.warning, marginBottom: spacing.xs },
  remedy: { gap: spacing.xs, marginBottom: spacing.lg },
  block: { marginBottom: spacing.md },
  link: { ...typography.bodyStrong, color: colors.primary },
  muted: { ...typography.body, color: colors.textSecondary },
});
