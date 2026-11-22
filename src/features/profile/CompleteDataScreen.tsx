import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
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
  MISSING_FIELD_LABEL,
  isKnownMissingFieldId,
  partitionMissingFields,
  type KnownMissingFieldId,
} from '@/features/profile/missingFields';
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
 * Uzupełnianie danych — mapowanie po `missing_fields[].field` (bez heurystyki message).
 * Po zapisie: invalidate + ponowna ocena katalogu 9.
 */
export function CompleteDataScreen() {
  const profile = useUserJourneyStore((s) => s.profile);
  const setProfile = useUserJourneyStore((s) => s.setProfile);
  const queryClient = useQueryClient();
  const { evaluation, isLoading, isError, error, refetch, isFetching } =
    useCatalogEligibility();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const aggregated = evaluation?.missingFields ?? [];
  const { known, unknown } = useMemo(
    () => partitionMissingFields(aggregated),
    [aggregated],
  );
  const priorityFields = useMemo(
    () => known.map((f) => f.field as KnownMissingFieldId),
    [known],
  );

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
      backFallbackHref="/benefits"
    >
      <DemoBanner message="Uzupełnij tylko to, czego potrzebujemy do oceny. Nie zgadujemy pól automatycznie." />

      <Card elevated>
        <Text style={styles.title}>Uzupełnij brakujące informacje</Text>
        <Text style={styles.body}>
          Potrzebujemy jeszcze kilku odpowiedzi, żeby dokładniej ocenić świadczenia.
          To nie jest decyzja ZUS.
        </Text>
      </Card>

      <Card elevated>
        <Text style={styles.section}>Czego potrzebujemy?</Text>
        {isLoading && !evaluation ? (
          <Text style={styles.meta}>Ładowanie oceny…</Text>
        ) : isError && !evaluation ? (
          <>
            <Text style={styles.body}>
              {apiErrorMessage(error, 'Nie udało się wczytać braków.')}
            </Text>
            <Button label="Spróbuj ponownie" onPress={() => refetch()} />
          </>
        ) : aggregated.length === 0 ? (
          <Text style={styles.body}>
            Silnik nie zgłasza obecnie brakujących informacji. Możesz mimo to
            skorygować odpowiedzi poniżej.
          </Text>
        ) : (
          <>
            {known.map((item) => (
              <View key={item.field} style={styles.missingRow}>
                <Badge label="Do uzupełnienia" tone="warning" />
                <Text style={styles.missingText}>
                  {isKnownMissingFieldId(item.field)
                    ? MISSING_FIELD_LABEL[item.field]
                    : item.field}
                </Text>
                <Text style={styles.meta}>{item.message}</Text>
              </View>
            ))}
            {unknown.length > 0 ? (
              <View style={styles.unknownBox}>
                <Badge label="Nieznane pole" tone="neutral" />
                <Text style={styles.body}>
                  Silnik wskazał identyfikatory, których ten formularz jeszcze nie
                  mapuje. Możesz uzupełnić je w pełnej ankiecie albo skorygować
                  odpowiedzi poniżej.
                </Text>
                {unknown.map((item) => (
                  <Text key={item.field} style={styles.meta}>
                    • {item.field}: {item.message}
                  </Text>
                ))}
              </View>
            ) : null}
          </>
        )}
      </Card>

      <ProfileAnswersReview
        profile={profile}
        busy={saving || isFetching}
        priorityFields={priorityFields}
        startEditing={priorityFields.length > 0}
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
  missingRow: { gap: spacing.xxs, marginBottom: spacing.md },
  missingText: { ...typography.bodyStrong, color: colors.text },
  unknownBox: { gap: spacing.xs, marginTop: spacing.sm },
  error: { ...typography.body, color: colors.danger, marginBottom: spacing.sm },
});
