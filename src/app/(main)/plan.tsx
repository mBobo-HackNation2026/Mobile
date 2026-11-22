import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ApiHealthBanner } from '@/components/ui/ApiHealthBanner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ChecklistList, type ChecklistFilter } from '@/features/checklist/ChecklistList';
import { buildParentPlan } from '@/features/plan/buildParentPlan';
import {
  mergeChecklists,
  planTasksToChecklist,
} from '@/features/plan/planTasksToChecklist';
import { apiErrorMessage } from '@/lib/apiErrorMessage';
import { eligibilityService } from '@/services/api';
import { useUserJourneyStore } from '@/store/useUserJourneyStore';
import { colors, radii, spacing, typography } from '@/theme';
import { normalizeChecklistStatus, type ChecklistItem } from '@/types/journey';

const FILTERS: { id: ChecklistFilter; label: string }[] = [
  { id: 'all', label: 'Wszystkie' },
  { id: 'todo', label: 'Do zrobienia' },
  { id: 'pending', label: 'Oczekujące' },
  { id: 'done', label: 'Wykonane' },
  { id: 'required', label: 'Obowiązkowe' },
  { id: 'optional', label: 'Opcjonalne' },
  { id: 'needs_verification', label: 'Do weryfikacji' },
];

/**
 * Checklista z filtrami — te same źródła co /sprawy:
 * FastAPI procedure + lokalny plan DEMO (zus/admin/deadline).
 * Chronologiczny Mój plan pozostaje na /home.
 */
export default function PlanScreen() {
  const profile = useUserJourneyStore((s) => s.profile);
  const overrides = useUserJourneyStore((s) => s.checklistOverrides);
  const setChecklistStatus = useUserJourneyStore((s) => s.setChecklistStatus);
  const [filter, setFilter] = useState<ChecklistFilter>('all');

  const query = useQuery({
    queryKey: ['eligibility', profile],
    queryFn: () => eligibilityService.evaluate(profile),
    enabled: profile.onboardingCompleted,
  });

  const localChecklist = useMemo(() => {
    const plan = buildParentPlan(profile, overrides);
    return planTasksToChecklist(plan.tasks);
  }, [profile, overrides]);

  if (!profile.onboardingCompleted) {
    return (
      <Screen>
        <EmptyState
          title="Brak planu"
          description="Uzupełnij ankietę, żeby zobaczyć checklistę i terminy."
          actionLabel="Ankieta"
          onAction={() => router.push('/onboarding')}
        />
      </Screen>
    );
  }

  const apiChecklist = query.isError || !query.data ? [] : query.data.checklist;
  const items: ChecklistItem[] = mergeChecklists(apiChecklist, localChecklist).map(
    (item) => ({
      ...item,
      status: normalizeChecklistStatus(overrides[item.id] ?? item.status),
    }),
  );

  const counts = {
    required: items.filter((i) => (i.priority ?? 'optional') === 'required').length,
    optional: items.filter((i) => (i.priority ?? 'optional') === 'optional').length,
    needs_verification: items.filter(
      (i) => (i.priority ?? 'optional') === 'needs_verification',
    ).length,
  };

  return (
    <Screen
      title="Checklista i terminy"
      subtitle="Filtry po priorytecie. Pozycje [FastAPI] vs [Plan lokalny DEMO] są rozdzielone w opisie."
    >
      <ApiHealthBanner />
      <DemoBanner message="To widok filtrów formalności. Pełny chronologiczny Mój plan: /home." />

      {query.isLoading ? (
        <Card>
          <Text style={styles.muted}>Dociągam ocenę FastAPI — lokalna checklista DEMO już poniżej.</Text>
        </Card>
      ) : null}

      {query.isError ? (
        <Card>
          <Text style={styles.body}>
            {apiErrorMessage(
              query.error,
              'API niedostępne — pokazujemy checklistę z lokalnego planu DEMO.',
            )}
          </Text>
          <Button label="Spróbuj ponownie" onPress={() => query.refetch()} />
        </Card>
      ) : null}

      <Button
        label="Wróć do Mój plan (oś czasu)"
        variant="secondary"
        onPress={() => router.push('/home')}
      />

      <Text style={styles.summary}>
        Obowiązkowe: {counts.required} · Opcjonalne: {counts.optional} · Do weryfikacji:{' '}
        {counts.needs_verification} · Razem: {items.length}
      </Text>

      <View style={styles.filters}>
        {FILTERS.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setFilter(item.id)}
            style={[styles.filter, filter === item.id && styles.filterActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === item.id }}
          >
            <Text style={[styles.filterText, filter === item.id && styles.filterTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ChecklistList items={items} filter={filter} onStatusChange={setChecklistStatus} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    ...typography.small,
    color: colors.textMuted,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  filter: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  filterActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  filterText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.primaryHover,
    fontWeight: '600',
  },
  muted: {
    ...typography.body,
    color: colors.textSecondary,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
});
