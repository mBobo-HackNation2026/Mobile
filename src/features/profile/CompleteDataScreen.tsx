import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { LegalDisclaimer } from '@/components/ui/LegalDisclaimer';
import { Screen } from '@/components/ui/Screen';
import { ProfileAnswersReview } from '@/features/benefits/ProfileAnswersReview';
import {
  catalogEligibilityQueryKey,
  CATALOG_ELIGIBILITY_QUERY_KEY,
  useCatalogEligibility,
} from '@/hooks/useCatalogEligibility';
import { apiErrorMessage } from '@/lib/apiErrorMessage';
import { eligibilityService } from '@/services/api';
import { useUserJourneyStore } from '@/store/useUserJourneyStore';
import { colors, spacing, typography } from '@/theme';

/**
 * Uzupełnianie danych wpływających na ocenę — bez heurystycznego parsowania missing_data.
 * Po zapisie: unieważnienie katalogu + ponowna ocena 9 świadczeń.
 */
export function CompleteDataScreen() {
  const profile = useUserJourneyStore((s) => s.profile);
  const setProfile = useUserJourneyStore((s) => s.setProfile);
  const queryClient = useQueryClient();
  const { evaluation, isLoading, isError, error, refetch, isFetching } =
    useCatalogEligibility();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!profile.onboardingCompleted) {
    return (
      <Screen title="Uzupełnij dane">
        <EmptyState
          title="Najpierw wypełnij ankietę"
          description="Po krótkiej ankiecie pokażemy, czego jeszcze brakuje do dokładniejszej oceny."
          actionLabel="Ankieta"
          onAction={() => router.push('/onboarding')}
        />
      </Screen>
    );
  }

  const missing = evaluation?.missingInputs ?? [];

  const onApplyAndRecheck = async (patch: Partial<typeof profile>) => {
    setSaving(true);
    setSaveError(null);
    try {
      setProfile(patch);
      const nextProfile = useUserJourneyStore.getState().profile;
      await queryClient.invalidateQueries({
        queryKey: [CATALOG_ELIGIBILITY_QUERY_KEY],
      });
      await queryClient.fetchQuery({
        queryKey: catalogEligibilityQueryKey(nextProfile),
        queryFn: () => eligibilityService.evaluate(nextProfile),
      });
      router.replace('/benefits');
    } catch (e) {
      setSaveError(
        apiErrorMessage(e, 'Zapisano dane, ale ponowna ocena się nie powiodła.'),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      title="Uzupełnij dane"
      subtitle="Dokładniejsza ocena uprawnień"
      backFallbackHref="/home"
    >
      <DemoBanner message="Uzupełnij tylko to, czego potrzebujemy do oceny. Nie zgadujemy pól automatycznie." />

      <Card>
        <Text style={styles.title}>Możemy dokładniej sprawdzić Twoje uprawnienia</Text>
        <Text style={styles.body}>
          Do oceny części świadczeń potrzebujemy jeszcze kilku informacji. Uzupełnij
          je, aby otrzymać bardziej szczegółowy wynik. To nie jest decyzja ZUS.
        </Text>
      </Card>

      <Card>
        <Text style={styles.section}>Czego brakuje według silnika?</Text>
        {isLoading && !evaluation ? (
          <Text style={styles.meta}>Ładowanie oceny…</Text>
        ) : isError && !evaluation ? (
          <>
            <Text style={styles.body}>
              {apiErrorMessage(error, 'Nie udało się wczytać braków.')}
            </Text>
            <Button label="Spróbuj ponownie" onPress={() => refetch()} />
          </>
        ) : missing.length === 0 ? (
          <Text style={styles.body}>
            Silnik nie zgłasza obecnie brakujących informacji w zbiorczej ocenie.
            Możesz mimo to skorygować odpowiedzi poniżej.
          </Text>
        ) : (
          <>
            <Text style={styles.meta}>
              Poniżej dokładne komunikaty `missing_data` (bez mapowania na pola).
            </Text>
            {missing.map((item) => (
              <View key={item} style={styles.missingRow}>
                <Badge label="Brak" tone="warning" />
                <Text style={styles.missingText}>{item}</Text>
              </View>
            ))}
          </>
        )}
      </Card>

      <ProfileAnswersReview
        profile={profile}
        busy={saving || isFetching}
        onApplyAndRecheck={(patch) => {
          void onApplyAndRecheck(patch);
        }}
      />

      {saveError ? (
        <Card>
          <Text style={styles.error}>{saveError}</Text>
          <Button label="Ponów ocenę" onPress={() => refetch()} />
        </Card>
      ) : null}

      <Button
        label="Pełna ankieta"
        variant="ghost"
        onPress={() => router.push('/onboarding')}
      />
      <LegalDisclaimer />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  section: {
    ...typography.bodyStrong,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  meta: { ...typography.small, color: colors.textMuted, marginBottom: spacing.sm },
  missingRow: { gap: spacing.xs, marginBottom: spacing.sm },
  missingText: { ...typography.body, color: colors.textSecondary },
  error: { ...typography.body, color: colors.danger, marginBottom: spacing.sm },
});
