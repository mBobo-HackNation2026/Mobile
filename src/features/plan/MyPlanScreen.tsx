import { Link, router, type Href } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ApiHealthBanner } from '@/components/ui/ApiHealthBanner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { LegalDisclaimer } from '@/components/ui/LegalDisclaimer';
import { QuickActionRow } from '@/components/ui/QuickActionRow';
import { Screen } from '@/components/ui/Screen';
import { buildParentPlan } from '@/features/plan/buildParentPlan';
import {
  buildSituationSummary,
  countEligibilityBuckets,
  ELIGIBILITY_COUNT_LABEL,
  pickDashboardFocus,
} from '@/features/plan/eligibilityDashboard';
import { useAdaptiveLayout } from '@/hooks/useAdaptiveLayout';
import { useCatalogEligibility } from '@/hooks/useCatalogEligibility';
import { apiErrorMessage } from '@/lib/apiErrorMessage';
import { formatShortDatePl } from '@/lib/format';
import { useUserJourneyStore } from '@/store/useUserJourneyStore';
import { colors, radii, spacing, typography } from '@/theme';

/**
 * Mój Plan — hierarchia Etapu 12:
 * sytuacja → możliwości (eligibility) → co teraz → formalności API → DEMO lokalne.
 */
export function MyPlanScreen() {
  const profile = useUserJourneyStore((s) => s.profile);
  const overrides = useUserJourneyStore((s) => s.checklistOverrides);
  const { columns } = useAdaptiveLayout();
  const {
    evaluation,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useCatalogEligibility();

  const localPlan = useMemo(
    () => buildParentPlan(profile, overrides),
    [profile, overrides],
  );

  const situation = useMemo(() => buildSituationSummary(profile), [profile]);
  const counts = useMemo(
    () => countEligibilityBuckets(evaluation?.benefits ?? []),
    [evaluation],
  );
  const focus = useMemo(
    () => pickDashboardFocus(evaluation, { hasError: isError }),
    [evaluation, isError],
  );

  if (!profile.onboardingCompleted) {
    return (
      <Screen title="Mój plan">
        <EmptyState
          title="Najpierw poznajmy Twoją sytuację"
          description="Krótka ankieta wystarczy, żeby sprawdzić świadczenia i ułożyć kolejne kroki."
          actionLabel="Zacznij ankietę"
          onAction={() => router.push('/welcome')}
        />
      </Screen>
    );
  }

  const twoCol = columns > 1;
  const apiFormalities = (evaluation?.checklist ?? [])
    .filter((item) => item.status !== 'done')
    .slice(0, 3);
  const apiDeadline = evaluation?.upcomingDeadline ?? null;

  return (
    <Screen title="Mój plan" subtitle="Ocena uprawnień i kolejny krok.">
      <ApiHealthBanner />
      {evaluation && !evaluation.isDemo ? (
        <DemoBanner message="Podsumowanie uprawnień pochodzi z silnika FastAPI — to nie decyzja ZUS. Wskazówki lokalne poniżej są oznaczone jako DEMO." />
      ) : (
        <DemoBanner message="Trwa łączenie z oceną uprawnień. Lokalne wskazówki DEMO nie zastępują wyniku silnika." />
      )}

      <View style={[styles.stack, twoCol && styles.stackDesktop]}>
        <View style={[styles.col, twoCol && styles.colMain]}>
          {/* A. Sytuacja */}
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Twoja sytuacja</Text>
            <Card style={styles.situationCard}>
              <Text style={styles.situationStage}>{situation.title}</Text>
              {situation.detail ? (
                <Text style={styles.situationHint}>{situation.detail}</Text>
              ) : null}
            </Card>
          </View>

          {/* B. Możliwości */}
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Twoje możliwości</Text>
            {isLoading && !evaluation ? (
              <Card style={styles.loadingCard}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.emptyCopy}>Sprawdzamy 9 świadczeń…</Text>
              </Card>
            ) : isError && !evaluation ? (
              <Card>
                <Text style={styles.emptyCopy}>
                  {apiErrorMessage(
                    error,
                    'Nie udało się połączyć z silnikiem. To nie oznacza braku uprawnienia.',
                  )}
                </Text>
                <Button label="Spróbuj ponownie" onPress={() => refetch()} />
              </Card>
            ) : evaluation ? (
              <Card style={styles.countsCard}>
                <Text style={styles.meta}>
                  Ocena katalogu · {evaluation.benefits.length} świadczeń
                  {isFetching ? ' · odświeżanie…' : ''}
                </Text>
                {(
                  [
                    'likely',
                    'needs_info',
                    'not_eligible',
                    'unchecked',
                  ] as const
                ).map((key) =>
                  counts[key] > 0 ? (
                    <View key={key} style={styles.countRow}>
                      <Text style={styles.countLabel}>
                        {ELIGIBILITY_COUNT_LABEL[key]}
                      </Text>
                      <Badge label={String(counts[key])} tone="neutral" />
                    </View>
                  ) : null,
                )}
                <Button
                  label="Zobacz wszystkie świadczenia"
                  variant="secondary"
                  onPress={() => router.push('/benefits')}
                />
              </Card>
            ) : null}
          </View>

          {/* C. Co teraz */}
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Co teraz?</Text>
            {focus ? (
              <Card style={styles.focusCard}>
                <Badge
                  label={
                    focus.source === 'missing_data'
                      ? 'Uzupełnij dane'
                      : focus.source === 'formalities'
                        ? 'Formalność'
                        : focus.source === 'retry'
                          ? 'Ponów'
                          : 'Uprawnienia'
                  }
                  tone="primary"
                />
                <Text style={styles.focusTitle}>{focus.title}</Text>
                <Text style={styles.focusSummary} numberOfLines={4}>
                  {focus.summary}
                </Text>
                <Button
                  label={focus.ctaLabel}
                  onPress={() => {
                    if (focus.source === 'retry' && focus.ctaHref === '/home') {
                      void refetch();
                      return;
                    }
                    router.push(focus.ctaHref as Href);
                  }}
                  fullWidth
                />
              </Card>
            ) : (
              <Card>
                <Text style={styles.emptyCopy}>
                  Brak jednoznacznego kolejnego kroku. Sprawdź listę świadczeń.
                </Text>
                <Button
                  label="Moje świadczenia"
                  onPress={() => router.push('/benefits')}
                />
              </Card>
            )}
          </View>
        </View>

        <View style={[styles.col, twoCol && styles.colSide]}>
          {/* D. Formalności z API */}
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Najbliższe formalności</Text>
            <Card style={styles.deadlinesCard}>
              <Text style={styles.meta}>
                Źródło: plany z oceny uprawnień / formalities (gdy silnik je zwróci).
              </Text>
              {apiDeadline ? (
                <View style={styles.deadlineHighlight}>
                  <Badge label="Najbliższy" tone="warning" />
                  <Text style={styles.deadlineTitle}>{apiDeadline.title}</Text>
                  <Text style={styles.deadlineDate}>
                    {formatShortDatePl(apiDeadline.date)}
                  </Text>
                </View>
              ) : null}
              {apiFormalities.length > 0 ? (
                apiFormalities.map((item) => (
                  <View key={item.id} style={styles.deadlineRow}>
                    <Text style={styles.deadlineRowTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.deadlineRowMeta}>
                      {item.dueDate
                        ? formatShortDatePl(item.dueDate)
                        : item.office ?? 'Do potwierdzenia'}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyCopy}>
                  Brak gotowej checklisty z silnika dla tej oceny — nie wymyślamy
                  obowiązków. Sprawdź sprawy lub uzupełnij dane.
                </Text>
              )}
              <Button
                label="Moje sprawy"
                variant="secondary"
                onPress={() => router.push('/sprawy')}
              />
            </Card>
          </View>

          {/* E. Szybkie działania */}
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Szybkie działania</Text>
            <QuickActionRow
              actions={[
                { label: 'Świadczenia', href: '/benefits', hint: '9 ocen' },
                {
                  label: 'Uzupełnij dane',
                  href: '/complete-data',
                  hint: 'Braki',
                },
                { label: 'Sprawy', href: '/sprawy', hint: 'Checklista' },
                { label: 'Kalkulator', href: '/calculator', hint: 'Kwoty' },
              ]}
            />
          </View>

          {/* Lokalne DEMO — wyraźnie oddzielone */}
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Wskazówki lokalne (DEMO)</Text>
            <Card>
              <Text style={styles.emptyCopy}>
                To pomocnicze zadania z lokalnego planu demonstracyjnego — nie są
                zatwierdzone przez silnik uprawnień.
              </Text>
              {localPlan.nextDeadline ? (
                <Text style={styles.meta}>
                  DEMO termin: {localPlan.nextDeadline.title} (
                  {formatShortDatePl(localPlan.nextDeadline.date)})
                </Text>
              ) : (
                <Text style={styles.meta}>
                  Brak sztywnej daty w lokalnych zadaniach DEMO.
                </Text>
              )}
              <Text style={styles.meta}>
                Otwarte lokalnie: {localPlan.openCount} · zrobione:{' '}
                {localPlan.doneCount}
              </Text>
            </Card>
          </View>
        </View>
      </View>

      <Button
        label="Popraw dane w ankiecie"
        variant="ghost"
        onPress={() => router.push('/onboarding')}
      />
      <Link href="/home-menu">
        <Text style={styles.menuLink}>Więcej: mapa, dokumenty, demo →</Text>
      </Link>
      <LegalDisclaimer />
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.xl },
  stackDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  col: { gap: spacing.xl, width: '100%' },
  colMain: { flexGrow: 1, flexBasis: 360, maxWidth: 720 },
  colSide: { flexGrow: 1, flexBasis: 300, maxWidth: 420 },
  block: { gap: spacing.sm },
  blockTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xxs,
  },
  situationCard: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryMuted,
    gap: spacing.xs,
  },
  situationStage: { ...typography.h2, color: colors.text },
  situationHint: {
    ...typography.body,
    color: colors.primaryHover,
  },
  countsCard: { gap: spacing.sm },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  countLabel: { ...typography.body, color: colors.textSecondary, flex: 1 },
  loadingCard: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  focusCard: {
    gap: spacing.sm,
    borderColor: colors.primaryMuted,
    borderWidth: 1.5,
  },
  focusTitle: { ...typography.h2, color: colors.text },
  focusSummary: { ...typography.body, color: colors.textSecondary },
  deadlinesCard: { gap: spacing.sm },
  deadlineHighlight: {
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  deadlineTitle: { ...typography.bodyStrong, color: colors.text },
  deadlineDate: { ...typography.h3, color: colors.warning },
  deadlineRow: {
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 2,
  },
  deadlineRowTitle: { ...typography.bodyStrong, color: colors.text },
  deadlineRowMeta: { ...typography.caption, color: colors.textMuted },
  emptyCopy: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  meta: { ...typography.small, color: colors.textMuted },
  menuLink: {
    ...typography.bodyStrong,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
