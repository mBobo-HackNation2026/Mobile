import { useQuery } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { RelatedBenefitsSection } from '@/features/extensions/RelatedBenefitsSection';
import { apiErrorMessage } from '@/lib/apiErrorMessage';
import { eligibilityService } from '@/services/api';
import { useUserJourneyStore } from '@/store/useUserJourneyStore';
import { colors, spacing, typography } from '@/theme';
import type { RelatedBenefitHint } from '@/types/extensions';

/**
 * Świadczenia poza silnikiem ZUS eBobo — tylko informacje / źródła.
 * Nie mieszamy ich z oceną A–E na hubie „Moje świadczenia”.
 */
export function OtherBenefitsScreen() {
  const profile = useUserJourneyStore((s) => s.profile);

  const query = useQuery({
    queryKey: ['eligibility', profile],
    queryFn: () => eligibilityService.evaluate(profile),
    enabled: profile.onboardingCompleted,
  });

  if (!profile.onboardingCompleted) {
    return (
      <Screen>
        <EmptyState
          title="Najpierw poznajmy Twoją sytuację"
          description="Po ankiecie pokażemy też informacyjne świadczenia poza zasiłkami ZUS."
          actionLabel="Rozpocznij"
          onAction={() => router.push('/onboarding')}
        />
      </Screen>
    );
  }

  if (query.isLoading) {
    return (
      <Screen>
        <Card>
          <Text style={styles.muted}>Ładowanie informacji…</Text>
        </Card>
      </Screen>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Screen>
        <EmptyState
          title="Nie udało się wczytać listy"
          description={apiErrorMessage(query.error, 'Spróbuj ponownie.')}
          actionLabel="Spróbuj ponownie"
          onAction={() => query.refetch()}
        />
      </Screen>
    );
  }

  const { externalBenefits, zusSources } = splitRelatedHints(query.data.relatedBenefits);

  return (
    <Screen
      title="Inne świadczenia"
      subtitle="Świadczenia poza zasiłkami ZUS (np. 800+, becikowe). eBobo nie ma dla nich silnika uprawnień — sprawdzisz warunki w oficjalnym źródle."
      backFallbackHref="/benefits"
    >
      <DemoBanner message="Tu nie oceniamy uprawnień — tylko wskazujemy oficjalne źródła. Ocena A–E dotyczy zasiłków ZUS na ekranie Moje świadczenia." />
      <Badge label="Bez silnika oceny" tone="demo" />

      <RelatedBenefitsSection
        items={externalBenefits}
        title="Informacje i źródła"
        subtitle="Bez statusu „przysługuje / nie przysługuje” — tylko kierunek, gdzie zweryfikować."
      />

      {externalBenefits.length === 0 ? (
        <Card>
          <Text style={styles.body}>
            Brak pozycji informacyjnych w odpowiedzi API / mocka dla tej sytuacji.
          </Text>
        </Card>
      ) : null}

      {zusSources.length > 0 ? (
        <RelatedBenefitsSection
          items={zusSources}
          title="Oficjalne źródła ZUS"
          subtitle="Kompendia i poradniki — nie są oceną Twojego uprawnienia w eBobo."
        />
      ) : null}

      <Card>
        <Text style={styles.meta}>
          Najważniejsze dla eBobo pozostają świadczenia ZUS z indywidualną oceną i kolejnym
          krokiem wniosku.
        </Text>
        <Link href="/benefits">
          <Text style={styles.link}>Wróć do Moich świadczeń (ZUS) →</Text>
        </Link>
      </Card>
    </Screen>
  );
}

/**
 * Poradniki ZUS vs świadczenia bez silnika oceny.
 * Uwaga: 800+ wypłaca ZUS, ale eBobo nie ocenia uprawnienia — zostaje tu, nie na hubie A–E.
 */
function splitRelatedHints(items: RelatedBenefitHint[]) {
  const zusSources: RelatedBenefitHint[] = [];
  const externalBenefits: RelatedBenefitHint[] = [];

  for (const item of items) {
    const isZusGuide =
      item.id.startsWith('hint-zus') || item.id.includes('zus-rodzic');

    if (isZusGuide) {
      zusSources.push(item);
    } else {
      externalBenefits.push(item);
    }
  }

  return { externalBenefits, zusSources };
}

const styles = StyleSheet.create({
  body: { ...typography.body, color: colors.textSecondary },
  meta: { ...typography.small, color: colors.textMuted, marginBottom: spacing.sm },
  link: { ...typography.bodyStrong, color: colors.primary },
  muted: { ...typography.body, color: colors.textSecondary },
});
