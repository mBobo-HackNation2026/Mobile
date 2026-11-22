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
import {
  assessmentReviewHref,
  BENEFIT_TONE,
  shouldOpenAssessmentReview,
} from '@/features/benefits/benefitUi';
import { resolveBenefitInstitution } from '@/features/benefits/resolveBenefitInstitution';
import { useCatalogEligibility } from '@/hooks/useCatalogEligibility';
import { apiErrorMessage } from '@/lib/apiErrorMessage';
import { getApiMode } from '@/services/api';
import { colors, spacing, typography } from '@/theme';
import {
  BENEFIT_GROUP_ORDER,
  BENEFIT_GROUP_TITLE,
  BENEFIT_STATUS_LABEL,
  type BenefitAssessment,
  type BenefitPresentationStatus,
} from '@/types/benefits';

export function BenefitsHubScreen() {
  const mode = getApiMode();
  const { profile, evaluation, isLoading, isError, error, refetch } =
    useCatalogEligibility();

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

  if (isLoading) {
    return (
      <Screen title="Moje świadczenia">
        <ApiHealthBanner />
        <Card>
          <Text style={styles.muted}>Analizujemy potencjalne uprawnienia…</Text>
        </Card>
      </Screen>
    );
  }

  if (isError || !evaluation) {
    return (
      <Screen title="Moje świadczenia">
        <ApiHealthBanner />
        <EmptyState
          title="Nie udało się ocenić świadczeń"
          description={apiErrorMessage(
            error,
            mode === 'rest'
              ? 'Silnik nie odpowiedział. To nie oznacza braku uprawnienia — spróbuj ponownie.'
              : 'Spróbuj ponownie — tryb demonstracyjny powinien działać offline.',
          )}
          actionLabel="Spróbuj ponownie"
          onAction={() => refetch()}
        />
        <Button label="Otwórz Mój plan" onPress={() => router.push('/home')} />
      </Screen>
    );
  }

  const grouped = groupBenefits(evaluation.benefits);

  return (
    <Screen
      title="Moje świadczenia"
      subtitle="Co może Ci przysługiwać i co zrobić dalej."
    >
      <ApiHealthBanner />
      <DemoBanner
        message={
          mode === 'rest'
            ? 'Ocena informacyjna — nie decyzja ZUS.'
            : 'Ocena demonstracyjna — nie decyzja ZUS.'
        }
      />

      {evaluation.missingInputs.length > 0 ? (
        <Card style={styles.missingCard}>
          <Badge label="Uzupełnij dane" tone="primary" />
          <Text style={styles.cardTitle}>Potrzebujemy jeszcze informacji</Text>
          <Text style={styles.body} numberOfLines={2}>
            Brakuje: {evaluation.missingInputs.join(', ')}.
          </Text>
          <Button
            label="Uzupełnij dane"
            onPress={() => router.push('/complete-data')}
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
                ? 'Wymaga potwierdzenia w ZUS lub u płatnika.'
                : undefined
            }
          >
            {items.map((benefit) => (
              <BenefitCard key={benefit.id} benefit={benefit} />
            ))}
          </AppSection>
        );
      })}

      <QuickActionRow
        actions={[
          { label: 'Kalkulator', href: '/calculator', hint: 'Ile dostanę?' },
          { label: 'Sprawy', href: '/sprawy', hint: 'Formalności' },
          { label: 'Inne (800+)', href: '/other-benefits', hint: 'Informacyjnie' },
        ]}
      />

      {evaluation.ruleSetVersion ? (
        <Text style={styles.meta}>Wersja reguł: {evaluation.ruleSetVersion}</Text>
      ) : null}
      <LegalDisclaimer />
    </Screen>
  );
}

function BenefitCard({ benefit }: { benefit: BenefitAssessment }) {
  const institutionId = resolveBenefitInstitution(benefit);
  const needsReview = benefit.status === 'needs_review';
  const openReview = shouldOpenAssessmentReview(benefit.status);
  const reviewHref = assessmentReviewHref(benefit.id);

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
      <Text style={styles.body} numberOfLines={2}>
        {benefit.headline}
      </Text>
      {openReview ? (
        <Button
          label="Sprawdź szczegóły"
          onPress={() => router.push(reviewHref as Href)}
          fullWidth
        />
      ) : (
        <Button
          label={benefit.nextStepLabel}
          onPress={() => router.push(benefit.nextStepHref as Href)}
          fullWidth
        />
      )}
      <Link href={(openReview ? reviewHref : `/benefits/${benefit.id}`) as Href}>
        <Text style={styles.link}>
          {openReview ? 'Szczegóły oceny →' : 'Szczegóły →'}
        </Text>
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
