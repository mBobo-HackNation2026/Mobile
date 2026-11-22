import { Link, router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FileCheck, ChevronDown, ChevronUp } from 'lucide-react-native';

import { ApiHealthBanner } from '@/components/ui/ApiHealthBanner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LegalDisclaimer } from '@/components/ui/LegalDisclaimer';
import { QuickActionRow } from '@/components/ui/QuickActionRow';
import { Screen } from '@/components/ui/Screen';
import {
  assessmentReviewHref,
  BENEFIT_TONE,
  shouldOpenAssessmentReview,
} from '@/features/benefits/benefitUi';
import {
  countEligibilityBuckets,
  ELIGIBILITY_COUNT_LABEL,
} from '@/features/plan/eligibilityDashboard';
import { useCatalogEligibility } from '@/hooks/useCatalogEligibility';
import { apiErrorMessage } from '@/lib/apiErrorMessage';
import { getApiMode } from '@/services/api';
import { colors, radii, spacing, typography } from '@/theme';
import {
  BENEFIT_STATUS_LABEL,
  type BenefitAssessment,
  type BenefitPresentationStatus,
} from '@/types/benefits';

const PRIMARY_STATUSES: BenefitPresentationStatus[] = [
  'likely_eligible',
  'obstacle_with_options',
  'insufficient_data',
  'needs_review',
];

const REMAINING_STATUSES: BenefitPresentationStatus[] = ['not_eligible'];

export function BenefitsHubScreen() {
  const mode = getApiMode();
  const { profile, evaluation, isLoading, isError, error, refetch } =
    useCatalogEligibility();
  const [remainingOpen, setRemainingOpen] = useState(false);

  const grouped = useMemo(
    () => (evaluation ? groupBenefits(evaluation.benefits) : null),
    [evaluation],
  );
  const counts = useMemo(
    () => countEligibilityBuckets(evaluation?.benefits ?? []),
    [evaluation],
  );

  if (!profile.onboardingCompleted) {
    return (
      <Screen>
        <EmptyState
          title="Najpierw poznajmy Twoją sytuację"
          description="Krótka ankieta wystarczy, żeby sprawdzić, jakie świadczenia mogą Cię dotyczyć."
          actionLabel="Rozpocznij"
          onAction={() => router.push('/onboarding')}
        />
      </Screen>
    );
  }

  if (isLoading && !evaluation) {
    return (
      <Screen title="Twoje świadczenia" back={false}>
        <ApiHealthBanner />
        <Card style={styles.loadingCard}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingTitle}>Sprawdzamy Twoje możliwości</Text>
          <Text style={styles.muted}>
            Analizujemy świadczenia na podstawie podanych informacji…
          </Text>
        </Card>
      </Screen>
    );
  }

  if (isError || !evaluation) {
    return (
      <Screen title="Twoje świadczenia" back={false}>
        <ApiHealthBanner />
        <EmptyState
          title="Nie udało się sprawdzić świadczeń"
          description={apiErrorMessage(
            error,
            mode === 'rest'
              ? 'Ocena jest chwilowo niedostępna. To nie oznacza braku uprawnienia — spróbuj ponownie.'
              : 'Spróbuj ponownie za chwilę.',
          )}
          actionLabel="Spróbuj ponownie"
          onAction={() => refetch()}
        />
        <Button label="Otwórz Mój plan" onPress={() => router.push('/home')} />
      </Screen>
    );
  }

  if (!evaluation || !grouped) return null;

  const primaryItems = PRIMARY_STATUSES.flatMap((s) => grouped[s]);
  const remainingItems = REMAINING_STATUSES.flatMap((s) => grouped[s]);
  const showUnchecked = counts.unchecked > 0;

  return (
    <Screen title="Twoje świadczenia" back={false}>
      <ApiHealthBanner />

      <View style={styles.hero}>
        <Text style={styles.heroLead}>
          Sprawdziliśmy możliwości na podstawie podanych przez Ciebie informacji.
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <SummaryChip
          label="Może przysługiwać"
          accessibilityLabel={ELIGIBILITY_COUNT_LABEL.likely}
          value={counts.likely}
          tone="likely"
        />
        <SummaryChip
          label="Wymaga informacji"
          accessibilityLabel={ELIGIBILITY_COUNT_LABEL.needs_info}
          value={counts.needs_info}
          tone="info"
        />
        <SummaryChip
          label="Niespełnione"
          accessibilityLabel={ELIGIBILITY_COUNT_LABEL.not_eligible}
          value={counts.not_eligible}
          tone="muted"
        />
        {showUnchecked ? (
          <SummaryChip
            label="Nie sprawdzono"
            accessibilityLabel={ELIGIBILITY_COUNT_LABEL.unchecked}
            value={counts.unchecked}
            tone="error"
          />
        ) : null}
      </View>

      {evaluation.missingInputs.length > 0 ? (
        <Card style={styles.missingCard}>
          <Badge label="Potrzebujemy informacji" tone="primary" />
          <Text style={styles.cardTitle}>Uzupełnij dane, żeby dokończyć ocenę</Text>
          <Text style={styles.body} numberOfLines={2}>
            Brakuje: {evaluation.missingInputs.join(', ')}.
          </Text>
          <Button
            label="Uzupełnij informacje"
            onPress={() => router.push('/complete-data')}
          />
        </Card>
      ) : null}

      {primaryItems.length > 0 ? (
        <View style={styles.section}>
          {counts.likely > 0 ? (
            <Text style={styles.sectionTitle}>Może Ci przysługiwać</Text>
          ) : (
            <Text style={styles.sectionTitle}>Do sprawdzenia</Text>
          )}
          {grouped.likely_eligible.map((benefit) => (
            <BenefitCard key={benefit.id} benefit={benefit} priority />
          ))}
          {[
            ...grouped.obstacle_with_options,
            ...grouped.insufficient_data,
            ...grouped.needs_review,
          ].map((benefit) => (
            <BenefitCard key={benefit.id} benefit={benefit} />
          ))}
        </View>
      ) : null}

      {remainingItems.length > 0 ? (
        <View style={styles.section}>
          <Pressable
            onPress={() => setRemainingOpen((v) => !v)}
            style={({ pressed }) => [
              styles.remainingToggle,
              pressed && styles.remainingTogglePressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ expanded: remainingOpen }}
            accessibilityLabel="Pozostałe świadczenia"
          >
            <View style={styles.remainingToggleText}>
              <Text style={styles.sectionTitle}>Pozostałe świadczenia</Text>
              <Text style={styles.remainingHint}>
                {remainingItems.length}{' '}
                {remainingItems.length === 1 ? 'pozycja' : 'pozycje'} · warunki obecnie
                niespełnione
              </Text>
            </View>
            {remainingOpen ? (
              <ChevronUp size={20} color={colors.textMuted} />
            ) : (
              <ChevronDown size={20} color={colors.textMuted} />
            )}
          </Pressable>
          {remainingOpen
            ? remainingItems.map((benefit) => (
                <BenefitCard key={benefit.id} benefit={benefit} subdued />
              ))
            : null}
        </View>
      ) : null}

      {primaryItems.length === 0 && remainingItems.length === 0 ? (
        <EmptyState
          title="Brak wyników oceny"
          description="Ponów analizę albo uzupełnij dane w profilu."
          actionLabel="Spróbuj ponownie"
          onAction={() => refetch()}
        />
      ) : null}

      <QuickActionRow
        actions={[
          { label: 'Mój plan', href: '/home', hint: 'Co teraz?' },
          { label: 'Kalkulator', href: '/calculator', hint: 'Ile dostanę?' },
          { label: 'Sprawy', href: '/sprawy', hint: 'Formalności' },
        ]}
      />

      <LegalDisclaimer />
    </Screen>
  );
}

function SummaryChip({
  label,
  value,
  tone,
  accessibilityLabel,
}: {
  label: string;
  value: number;
  tone: 'likely' | 'info' | 'muted' | 'error';
  accessibilityLabel?: string;
}) {
  return (
    <View
      style={[styles.chip, toneStyles[tone]]}
      accessibilityLabel={`${accessibilityLabel ?? label}: ${value}`}
    >
      <Text style={[styles.chipValue, toneValueStyles[tone]]}>{value}</Text>
      <Text style={styles.chipLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

function BenefitCard({
  benefit,
  priority = false,
  subdued = false,
}: {
  benefit: BenefitAssessment;
  priority?: boolean;
  subdued?: boolean;
}) {
  const openReview = shouldOpenAssessmentReview(benefit.status);
  const reviewHref = assessmentReviewHref(benefit.id);
  const detailHref = (openReview ? reviewHref : `/benefits/${benefit.id}`) as Href;
  const needsInfo =
    benefit.status === 'insufficient_data' ||
    benefit.status === 'needs_review' ||
    benefit.status === 'obstacle_with_options';
  const completeData =
    needsInfo && benefit.nextStepHref.includes('complete-data');
  const primaryLabel = completeData
    ? 'Uzupełnij informacje'
    : 'Zobacz szczegóły';

  const primaryHref = (completeData ? benefit.nextStepHref : detailHref) as Href;

  return (
    <Card
      style={{
        ...styles.benefitCard,
        ...(priority ? styles.benefitCardPriority : null),
        ...(subdued ? styles.benefitCardSubdued : null),
      }}
    >
      <View style={styles.cardTop}>
        <View style={styles.iconBadge}>
          <FileCheck
            size={18}
            color={priority ? colors.primary : colors.textMuted}
            strokeWidth={2.2}
          />
        </View>
        <Badge
          label={BENEFIT_STATUS_LABEL[benefit.status]}
          tone={BENEFIT_TONE[benefit.status]}
        />
      </View>
      <Text style={styles.cardTitle}>{benefit.title}</Text>
      <Text style={styles.body} numberOfLines={2}>
        {benefit.headline}
      </Text>
      <Button
        label={primaryLabel}
        onPress={() => router.push(primaryHref)}
        fullWidth
        variant={priority ? 'primary' : needsInfo ? 'primary' : 'secondary'}
      />
      <Link href={detailHref}>
        <Text style={styles.link}>Szczegóły →</Text>
      </Link>
    </Card>
  );
}

function groupBenefits(benefits: BenefitAssessment[]) {
  const map = {
    likely_eligible: [] as BenefitAssessment[],
    obstacle_with_options: [] as BenefitAssessment[],
    insufficient_data: [] as BenefitAssessment[],
    needs_review: [] as BenefitAssessment[],
    not_eligible: [] as BenefitAssessment[],
  };

  for (const benefit of benefits) {
    map[benefit.status].push(benefit);
  }
  return map;
}

const toneStyles = StyleSheet.create({
  likely: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  info: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
  },
  muted: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  error: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
});

const toneValueStyles = StyleSheet.create({
  likely: { color: colors.accent },
  info: { color: colors.warning },
  muted: { color: colors.textSecondary },
  error: { color: colors.danger },
});

const styles = StyleSheet.create({
  hero: {
    gap: spacing.xxs,
    marginBottom: spacing.xs,
  },
  heroLead: {
    ...typography.body,
    color: colors.textSecondary,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  chip: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 96,
    maxWidth: '48%',
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  chipValue: {
    ...typography.h3,
    fontSize: 20,
    lineHeight: 24,
  },
  chipLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  section: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  remainingToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 44,
  },
  remainingTogglePressed: {
    opacity: 0.75,
  },
  remainingToggleText: {
    flex: 1,
    gap: 2,
  },
  remainingHint: {
    ...typography.small,
    color: colors.textMuted,
  },
  benefitCard: {
    gap: spacing.xs,
  },
  benefitCardPriority: {
    borderColor: colors.primaryMuted,
    backgroundColor: colors.surface,
  },
  benefitCardSubdued: {
    opacity: 0.92,
    backgroundColor: colors.surfaceMuted,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.xs,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  link: {
    ...typography.bodyStrong,
    color: colors.primary,
    marginTop: spacing.xs,
    minHeight: 44,
    paddingTop: spacing.xs,
  },
  muted: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  loadingCard: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  loadingTitle: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
  },
  missingCard: { gap: spacing.xs },
});
