import { Link, router, type Href } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
import { PLAN_CATEGORY_LABEL, PLAN_KIND_LABEL } from '@/features/plan/planUi';
import { useAdaptiveLayout } from '@/hooks/useAdaptiveLayout';
import { formatShortDatePl } from '@/lib/format';
import { useUserJourneyStore } from '@/store/useUserJourneyStore';
import { colors, radii, spacing, typography } from '@/theme';

/**
 * Mój Plan — „Co powinienem zrobić teraz?”
 * Etap 9: krótsza hierarchia, bez pełnej checklisty (ta jest w Moich sprawach).
 */
export function MyPlanScreen() {
  const profile = useUserJourneyStore((s) => s.profile);
  const overrides = useUserJourneyStore((s) => s.checklistOverrides);
  const { columns } = useAdaptiveLayout();

  const plan = useMemo(
    () => buildParentPlan(profile, overrides),
    [profile, overrides],
  );

  if (!profile.onboardingCompleted) {
    return (
      <Screen title="Mój plan">
        <EmptyState
          title="Najpierw poznajmy Twoją sytuację"
          description="Krótka ankieta wystarczy, żeby ułożyć pierwsze konkretne kroki."
          actionLabel="Zacznij ankietę"
          onAction={() => router.push('/welcome')}
        />
      </Screen>
    );
  }

  const openTasks = plan.tasks.filter((t) => t.status !== 'done');
  const focusTask =
    openTasks.find((t) => t.bucket === 'now') ??
    openTasks.find((t) => t.priority === 'required') ??
    openTasks[0] ??
    null;

  const upcoming = plan.tasks
    .filter((t) => t.status !== 'done' && (t.dueDate || t.windowLabel))
    .slice(0, 3);

  const progress =
    plan.tasks.length === 0 ? 0 : plan.doneCount / plan.tasks.length;
  const twoCol = columns > 1;

  return (
    <Screen title="Mój plan" subtitle="Co zrobić teraz — w skrócie.">
      <ApiHealthBanner />
      <DemoBanner message="To lokalny plan demonstracyjny. Ocena świadczeń i kwoty są w Świadczeniach oraz Kalkulatorze." />

      <View style={[styles.stack, twoCol && styles.stackDesktop]}>
        <View style={[styles.col, twoCol && styles.colMain]}>
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Twoja sytuacja</Text>
            <Card style={styles.situationCard}>
              <Text style={styles.situationStage}>{plan.timeline.stageLabel}</Text>
              {plan.timeline.progressLabel ? (
                <Text style={styles.situationHint}>{plan.timeline.progressLabel}</Text>
              ) : null}
              <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.round(progress * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressMeta}>
                  {plan.doneCount}/{plan.tasks.length}
                </Text>
              </View>
            </Card>
          </View>

          <View style={styles.block}>
            <Text style={styles.blockTitle}>Co teraz?</Text>
            {focusTask ? (
              <Card style={styles.focusCard}>
                <View style={styles.focusBadges}>
                  <Badge label={PLAN_CATEGORY_LABEL[focusTask.category]} tone="primary" />
                  <Badge label={PLAN_KIND_LABEL[focusTask.kind]} tone="neutral" />
                </View>
                <Text style={styles.focusTitle}>{focusTask.title}</Text>
                <Text style={styles.focusSummary} numberOfLines={3}>
                  {focusTask.summary}
                </Text>
                {focusTask.dueDate || focusTask.windowLabel ? (
                  <Text style={styles.focusDue}>
                    {focusTask.dueDate
                      ? `Termin: ${formatShortDatePl(focusTask.dueDate)}`
                      : focusTask.windowLabel}
                  </Text>
                ) : null}
                <Button
                  label={focusTask.ctaLabel}
                  onPress={() => router.push(focusTask.ctaHref as Href)}
                  fullWidth
                />
              </Card>
            ) : (
              <Card>
                <Text style={styles.emptyCopy}>
                  Brak otwartych zadań. Sprawdź świadczenia albo popraw ankietę.
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
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Najbliższe terminy</Text>
            <Card style={styles.deadlinesCard}>
              {plan.nextDeadline ? (
                <View style={styles.deadlineHighlight}>
                  <Badge label="Najbliższy" tone="warning" />
                  <Text style={styles.deadlineTitle}>{plan.nextDeadline.title}</Text>
                  <Text style={styles.deadlineDate}>
                    {formatShortDatePl(plan.nextDeadline.date)}
                  </Text>
                </View>
              ) : (
                <Text style={styles.emptyCopy}>
                  Brak sztywnej daty w otwartych zadaniach.
                </Text>
              )}
              {upcoming.map((task) => (
                <View key={task.id} style={styles.deadlineRow}>
                  <Text style={styles.deadlineRowTitle} numberOfLines={2}>
                    {task.title}
                  </Text>
                  <Text style={styles.deadlineRowMeta}>
                    {task.dueDate
                      ? formatShortDatePl(task.dueDate)
                      : task.windowLabel}
                  </Text>
                </View>
              ))}
              <Button
                label="Pełna lista spraw"
                variant="secondary"
                onPress={() => router.push('/sprawy')}
              />
            </Card>
          </View>

          <View style={styles.block}>
            <Text style={styles.blockTitle}>Co jeszcze?</Text>
            <QuickActionRow
              actions={[
                { label: 'Sprawy', href: '/sprawy', hint: 'Checklista' },
                { label: 'Świadczenia', href: '/benefits', hint: 'Uprawnienia' },
                { label: 'Kalkulator', href: '/calculator', hint: 'Kwoty' },
                { label: 'Kalendarz', href: '/calendar', hint: 'Terminy' },
              ]}
            />
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
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  progressMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    minWidth: 40,
    textAlign: 'right',
  },
  focusCard: {
    gap: spacing.sm,
    borderColor: colors.primaryMuted,
    borderWidth: 1.5,
  },
  focusBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  focusTitle: { ...typography.h2, color: colors.text },
  focusSummary: { ...typography.body, color: colors.textSecondary },
  focusDue: { ...typography.small, color: colors.warning },
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
  menuLink: {
    ...typography.bodyStrong,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
