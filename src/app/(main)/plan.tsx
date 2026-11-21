import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ChecklistList, type ChecklistFilter } from '@/features/checklist/ChecklistList';
import { eligibilityService } from '@/services/api';
import { useUserJourneyStore } from '@/store/useUserJourneyStore';
import { colors, radii, spacing, typography } from '@/theme';
import type { ChecklistItem } from '@/types/journey';

const FILTERS: { id: ChecklistFilter; label: string }[] = [
  { id: 'all', label: 'Wszystkie' },
  { id: 'now', label: 'Teraz' },
  { id: 'later', label: 'Później' },
  { id: 'done', label: 'Wykonane' },
  { id: 'required', label: 'Obowiązkowe' },
  { id: 'optional', label: 'Opcjonalne' },
  { id: 'needs_verification', label: 'Do weryfikacji' },
];

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

  if (query.isLoading) {
    return (
      <Screen>
        <Card>
          <Text style={styles.muted}>Ładujemy checklistę…</Text>
        </Card>
      </Screen>
    );
  }

  if (query.isError) {
    return (
      <Screen>
        <EmptyState
          title="Nie udało się wczytać planu"
          description="Sprawdź połączenie z API albo wróć do trybu mock."
          actionLabel="Spróbuj ponownie"
          onAction={() => query.refetch()}
        />
      </Screen>
    );
  }

  const items: ChecklistItem[] = (query.data?.checklist ?? []).map((item) => ({
    ...item,
    status: overrides[item.id] ?? item.status,
  }));

  const counts = {
    required: items.filter((i) => (i.priority ?? 'optional') === 'required').length,
    optional: items.filter((i) => (i.priority ?? 'optional') === 'optional').length,
    needs_verification: items.filter(
      (i) => (i.priority ?? 'optional') === 'needs_verification',
    ).length,
  };

  return (
    <Screen>
      <DemoBanner />
      <View style={styles.header}>
        <Text style={styles.title}>Checklista i terminy</Text>
        <Text style={styles.subtitle}>
          Każdy krok: co, kiedy, dlaczego, gdzie i jakie dokumenty. Rozróżniamy działania
          obowiązkowe, opcjonalne i wymagające weryfikacji.
        </Text>
        <Text style={styles.summary}>
          Obowiązkowe: {counts.required} · Opcjonalne: {counts.optional} · Do weryfikacji:{' '}
          {counts.needs_verification}
        </Text>
      </View>

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
  header: {
    gap: spacing.xs,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    maxWidth: 720,
  },
  summary: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.xs,
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
});
