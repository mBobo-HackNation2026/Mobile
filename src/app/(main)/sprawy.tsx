import { Link, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ApiHealthBanner } from '@/components/ui/ApiHealthBanner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ChecklistList } from '@/features/checklist/ChecklistList';
import { DeadlineRadarSection } from '@/features/extensions/DeadlineRadarSection';
import { PostpartumKitSection } from '@/features/extensions/PostpartumKitSection';
import { buildParentPlan } from '@/features/plan/buildParentPlan';
import {
  mergeChecklists,
  planTasksToChecklist,
} from '@/features/plan/planTasksToChecklist';
import { apiErrorMessage } from '@/lib/apiErrorMessage';
import { formatDatePl } from '@/lib/format';
import { eligibilityService, getApiMode } from '@/services/api';
import { useUserJourneyStore } from '@/store/useUserJourneyStore';
import { colors, radii, spacing, typography } from '@/theme';
import { normalizeChecklistStatus, type ChecklistItem } from '@/types/journey';

/**
 * Moje sprawy — „Co mam do załatwienia?”
 * Etap 9: checklista na pierwszym planie, radar dopiero po rozwinięciu.
 */
export default function SprawyScreen() {
  const profile = useUserJourneyStore((s) => s.profile);
  const overrides = useUserJourneyStore((s) => s.checklistOverrides);
  const setChecklistStatus = useUserJourneyStore((s) => s.setChecklistStatus);
  const mode = getApiMode();
  const [showRadar, setShowRadar] = useState(false);

  const query = useQuery({
    queryKey: ['eligibility', profile],
    queryFn: () => eligibilityService.evaluate(profile),
    enabled: profile.onboardingCompleted,
  });

  const localPlan = useMemo(
    () => buildParentPlan(profile, overrides),
    [profile, overrides],
  );

  const localChecklist = useMemo(
    () => planTasksToChecklist(localPlan.tasks),
    [localPlan.tasks],
  );

  if (!profile.onboardingCompleted) {
    return (
      <Screen title="Moje sprawy">
        <EmptyState
          title="Brak spraw"
          description="Najpierw uzupełnij ankietę — potem zobaczysz listę formalności."
          actionLabel="Mój plan"
          onAction={() => router.push('/home')}
        />
      </Screen>
    );
  }

  if (query.isLoading) {
    return (
      <Screen title="Moje sprawy" subtitle="Co masz do załatwienia.">
        <ApiHealthBanner />
        <Card>
          <Text style={styles.muted}>Ładujemy formalności…</Text>
        </Card>
        <Text style={styles.sectionTitle}>Tymczasem — plan lokalny</Text>
        <ChecklistList
          items={applyOverrides(localChecklist, overrides).slice(0, 6)}
          onStatusChange={setChecklistStatus}
          compact
        />
      </Screen>
    );
  }

  const apiChecklist = query.isError ? [] : (query.data?.checklist ?? []);
  const items = applyOverrides(
    mergeChecklists(apiChecklist, localChecklist),
    overrides,
  );

  const todoCount = items.filter((i) => i.status === 'todo').length;
  const doneCount = items.filter((i) => i.status === 'done').length;
  const pendingCount = items.filter((i) => i.status === 'pending').length;

  return (
    <Screen title="Moje sprawy" subtitle="Lista rzeczy do załatwienia.">
      <ApiHealthBanner />
      <DemoBanner message="Lista formalności z oceny i planu lokalnego — nie decyzja ZUS." />

      <Card elevated style={styles.heroCard}>
        <Text style={styles.heroTitle}>Co masz do załatwienia?</Text>
        <Text style={styles.body}>
          Oznaczaj kroki po kolei. Najważniejsze sprawy są na górze listy.
        </Text>
      </Card>

      <View style={styles.summaryRow}>
        <SummaryChip label="Do zrobienia" value={todoCount} tone="todo" />
        <SummaryChip label="W trakcie" value={pendingCount} tone="pending" />
        <SummaryChip label="Zrobione" value={doneCount} tone="done" />
      </View>

      {query.isError ? (
        <Card style={styles.errorCard}>
          <Badge label="Ocena niedostępna" tone="danger" />
          <Text style={styles.body}>
            {apiErrorMessage(
              query.error,
              'Pokazujemy checklistę z lokalnego planu. Spróbuj ponowić połączenie.',
            )}
          </Text>
          <Button label="Spróbuj ponownie" onPress={() => query.refetch()} />
        </Card>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Checklista</Text>
        <Link href="/plan">
          <Text style={styles.link}>Filtry →</Text>
        </Link>
      </View>

      {items.length === 0 ? (
        <Card>
          <Text style={styles.body}>
            Brak pozycji dla tej sytuacji
            {mode === 'rest' ? ' — silnik nie zwrócił planu formalności.' : '.'}{' '}
            Sprawdź świadczenia albo uzupełnij ankietę.
          </Text>
          <Button
            label="Moje świadczenia"
            onPress={() => router.push('/benefits')}
          />
        </Card>
      ) : (
        <ChecklistList items={items} onStatusChange={setChecklistStatus} compact />
      )}

      <Pressable
        onPress={() => setShowRadar((v) => !v)}
        accessibilityRole="button"
        style={styles.radarToggle}
      >
        <Text style={styles.radarToggleText}>
          {showRadar ? 'Ukryj terminy i radar' : 'Pokaż terminy i radar'}
        </Text>
      </Pressable>

      {showRadar ? (
        <View style={styles.radarBlock}>
          {!query.isError ? (
            <>
              <DeadlineRadarSection items={query.data?.deadlineRadar ?? []} />
              <PostpartumKitSection kit={query.data?.postpartumKit ?? null} />
            </>
          ) : null}
          <Card style={styles.deadlineCard}>
            <Text style={styles.cardHeading}>Najbliższy termin</Text>
            {query.data?.upcomingDeadline ? (
              <>
                <Text style={styles.bodyStrong}>
                  {query.data.upcomingDeadline.title}
                </Text>
                <Text style={styles.deadlineDate}>
                  {formatDatePl(query.data.upcomingDeadline.date)}
                </Text>
              </>
            ) : localPlan.nextDeadline ? (
              <>
                <Badge label="Z planu lokalnego" tone="demo" />
                <Text style={styles.bodyStrong}>{localPlan.nextDeadline.title}</Text>
                <Text style={styles.deadlineDate}>
                  {formatDatePl(localPlan.nextDeadline.date)}
                </Text>
              </>
            ) : (
              <Text style={styles.body}>Brak zbliżającego się terminu z datą.</Text>
            )}
            <Button
              label="Otwórz kalendarz"
              variant="secondary"
              onPress={() => router.push('/calendar')}
            />
          </Card>
          <Button
            label="Dokumenty"
            variant="ghost"
            onPress={() => router.push('/documents')}
          />
        </View>
      ) : null}
    </Screen>
  );
}

function SummaryChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'todo' | 'pending' | 'done';
}) {
  return (
    <View
      style={[styles.summaryChip, summaryTone[tone]]}
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text style={[styles.summaryValue, summaryValueTone[tone]]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const summaryTone = StyleSheet.create({
  todo: { backgroundColor: colors.warningSoft },
  pending: { backgroundColor: colors.infoSoft },
  done: { backgroundColor: colors.successSoft },
});

const summaryValueTone = StyleSheet.create({
  todo: { color: colors.warning },
  pending: { color: colors.info },
  done: { color: colors.success },
});

function applyOverrides(
  items: ChecklistItem[],
  overrides: Record<string, string>,
): ChecklistItem[] {
  return items.map((item) => ({
    ...item,
    status: normalizeChecklistStatus(overrides[item.id] ?? item.status),
  }));
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  heroCard: { gap: spacing.xs },
  heroTitle: { ...typography.h3, color: colors.text },
  summaryChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    gap: 2,
    minHeight: 64,
  },
  summaryValue: { ...typography.h2, fontSize: 22, lineHeight: 28 },
  summaryLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  sectionTitle: { ...typography.h3, color: colors.text },
  cardHeading: { ...typography.bodyStrong, color: colors.text },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  bodyStrong: {
    ...typography.bodyStrong,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  deadlineDate: { ...typography.h3, color: colors.warning, marginBottom: spacing.sm },
  deadlineCard: { gap: spacing.xs },
  errorCard: {
    gap: spacing.sm,
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  link: { ...typography.bodyStrong, color: colors.primary },
  muted: { ...typography.body, color: colors.textSecondary },
  radarToggle: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  radarToggleText: { ...typography.bodyStrong, color: colors.primary },
  radarBlock: { gap: spacing.md },
});
