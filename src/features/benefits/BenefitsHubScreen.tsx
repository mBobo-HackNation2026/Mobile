import { useQuery } from '@tanstack/react-query';
import { Link, router, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ApiHealthBanner } from '@/components/ui/ApiHealthBanner';
import { AppSection } from '@/components/ui/AppSection';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { InstitutionMark } from '@/components/ui/InstitutionMark';
import { LegalDisclaimer } from '@/components/ui/LegalDisclaimer';
import { QuickActionRow } from '@/components/ui/QuickActionRow';
import { Screen } from '@/components/ui/Screen';
import { BENEFIT_TONE } from '@/features/benefits/benefitUi';
import { resolveBenefitInstitution } from '@/features/benefits/resolveBenefitInstitution';
import { apiErrorMessage } from '@/lib/apiErrorMessage';
import { eligibilityService, getApiMode } from '@/services/api';
import { useUserJourneyStore } from '@/store/useUserJourneyStore';
import { colors, spacing, typography } from '@/theme';
import {
  BENEFIT_GROUP_ORDER,
  BENEFIT_GROUP_TITLE,
  BENEFIT_STATUS_LABEL,
  type BenefitAssessment,
  type BenefitPresentationStatus,
} from '@/types/benefits';

export function BenefitsHubScreen() {
  const profile = useUserJourneyStore((s) => s.profile);
  const mode = getApiMode();

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
          description="Krótka ankieta lub profil demo — potem pokażemy, jakie świadczenia możesz mieć i co zrobić dalej."
          actionLabel="Rozpocznij"
          onAction={() => router.push('/onboarding')}
        />
      </Screen>
    );
  }

  if (query.isLoading) {
    return (
      <Screen title="Moje świadczenia">
        <ApiHealthBanner />
        <Card>
          <Text style={styles.muted}>Analizujemy potencjalne uprawnienia…</Text>
        </Card>
      </Screen>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Screen title="Moje świadczenia">
        <ApiHealthBanner />
        <EmptyState
          title="Nie udało się ocenić świadczeń"
          description={apiErrorMessage(
            query.error,
            mode === 'rest'
              ? 'Silnik nie odpowiedział. Lokalny plan DEMO w „Mój plan” nadal działa — bez przykładowych kwot zamiast wyniku.'
              : 'Spróbuj ponownie — tryb demonstracyjny powinien działać offline.',
          )}
          actionLabel="Spróbuj ponownie"
          onAction={() => query.refetch()}
        />
        <Button label="Otwórz Mój plan DEMO" onPress={() => router.push('/home')} />
      </Screen>
    );
  }

  const grouped = groupBenefits(query.data.benefits);

  return (
    <Screen
      title="Moje świadczenia"
      subtitle="Ocena zasiłków ZUS na podstawie Twoich danych — z kolejnym krokiem do wniosku."
    >
      <ApiHealthBanner />
      <DemoBanner
        message={
          mode === 'rest'
            ? 'Ocena z silnika. To nie decyzja ZUS — deklaracja w ankiecie nie zastępuje potwierdzenia.'
            : 'Ocena demonstracyjna lokalna — nie decyzja ZUS.'
        }
      />

      <QuickActionRow
        actions={[
          { label: 'Mój plan', href: '/home', hint: 'Oś czasu' },
          { label: 'Moje sprawy', href: '/sprawy', hint: 'Formalności' },
          { label: 'Kalkulator', href: '/calculator', hint: 'Kwoty' },
        ]}
      />

      {query.data.missingInputs.length > 0 ? (
        <Card style={styles.missingCard}>
          <Badge label="Brakuje danych" tone="primary" />
          <Text style={styles.cardTitle}>Uzupełnij, żeby doprecyzować ocenę</Text>
          <Text style={styles.body}>
            Brakuje: {query.data.missingInputs.join(', ')}.
          </Text>
          <Button
            label="Uzupełnij informacje"
            onPress={() => router.push('/onboarding')}
          />
        </Card>
      ) : null}

      {BENEFIT_GROUP_ORDER.map((status) => {
        const items = grouped[status];
        if (!items.length) return null;
        return (
          <AppSection
            key={status}
            title={BENEFIT_GROUP_TITLE[status]}
            subtitle={
              status === 'needs_review'
                ? 'Wynik wymaga potwierdzenia w ZUS lub u płatnika — nie traktuj go jako odmowy ani przyznania.'
                : undefined
            }
          >
            {items.map((benefit) => (
              <BenefitCard key={benefit.id} benefit={benefit} />
            ))}
          </AppSection>
        );
      })}

      <AppSection title="Poza silnikiem ZUS">
        <Card style={styles.asideCard}>
          <Badge label="Informacyjnie" tone="demo" />
          <Text style={styles.cardTitle}>Inne świadczenia (800+, becikowe…)</Text>
          <Text style={styles.body}>
            Nie oceniamy ich w eBobo — brak silnika uprawnień. Tu zostają tylko zasiłki ZUS
            z indywidualną oceną.
          </Text>
          <Button
            label="Zobacz inne świadczenia"
            variant="secondary"
            onPress={() => router.push('/other-benefits')}
          />
        </Card>
      </AppSection>

      <AppSection title="Kalkulator">
        <Card style={styles.asideCard}>
          <Badge label={mode === 'rest' ? 'Silnik' : 'Demo'} tone="primary" />
          <Text style={styles.body}>
            Szacowane kwoty i warianty podziału urlopu rodzicielskiego, w tym 9 tygodni
            zarezerwowanych dla drugiego rodzica (70%).
          </Text>
          <Button
            label="Otwórz kalkulator"
            onPress={() => router.push('/calculator')}
          />
        </Card>
      </AppSection>

      <Text style={styles.meta}>
        Wersja reguł hubu: {query.data.ruleSetVersion}.{' '}
        {query.data.warnings.join(' ')}
      </Text>
      <LegalDisclaimer />
    </Screen>
  );
}

function BenefitCard({ benefit }: { benefit: BenefitAssessment }) {
  const institutionId = resolveBenefitInstitution(benefit);
  const needsReview = benefit.status === 'needs_review';

  return (
    <Card style={needsReview ? styles.reviewCard : undefined}>
      <View style={styles.cardTop}>
        <Badge
          label={BENEFIT_STATUS_LABEL[benefit.status]}
          tone={BENEFIT_TONE[benefit.status]}
        />
        {institutionId ? <InstitutionMark institutionId={institutionId} /> : null}
      </View>
      <Text style={styles.cardTitle}>{benefit.title}</Text>
      <Text style={styles.body}>{benefit.headline}</Text>
      <Text style={styles.meta}>{benefit.summary}</Text>
      {needsReview ? (
        <Text style={styles.reviewHint}>
          Wymagana weryfikacja — część warunków ustaliliśmy, ale wynik trzeba potwierdzić
          w instytucji.
        </Text>
      ) : null}
      {benefit.warnings && benefit.warnings.length > 0 ? (
        <Badge label={`${benefit.warnings.length} ostrzeżeń`} tone="warning" />
      ) : null}
      {benefit.planMissing ? (
        <Badge label="Brak planu formalności" tone="neutral" />
      ) : null}
      <Text style={styles.next}>Następny krok: {benefit.nextStepLabel}</Text>
      <Button
        label={benefit.nextStepLabel}
        onPress={() => router.push(benefit.nextStepHref as Href)}
      />
      <Link href={`/benefits/${benefit.id}` as Href}>
        <Text style={styles.link}>Szczegóły świadczenia →</Text>
      </Link>
    </Card>
  );
}

function groupBenefits(benefits: BenefitAssessment[]) {
  const map = BENEFIT_GROUP_ORDER.reduce(
    (acc, status) => {
      acc[status] = [];
      return acc;
    },
    {} as Record<BenefitPresentationStatus, BenefitAssessment[]>,
  );

  for (const benefit of benefits) {
    map[benefit.status].push(benefit);
  }
  return map;
}

const styles = StyleSheet.create({
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitle: { ...typography.h3, color: colors.text, marginTop: spacing.sm },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    marginVertical: spacing.sm,
  },
  meta: { ...typography.small, color: colors.textMuted, marginBottom: spacing.sm },
  next: {
    ...typography.bodyStrong,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  link: { ...typography.bodyStrong, color: colors.primary, marginTop: spacing.sm },
  muted: { ...typography.body, color: colors.textSecondary },
  missingCard: { gap: spacing.xs },
  asideCard: { gap: spacing.sm },
  reviewCard: {
    borderColor: colors.warning,
    backgroundColor: colors.warningSoft,
  },
  reviewHint: {
    ...typography.small,
    color: colors.warning,
    marginBottom: spacing.sm,
  },
});
