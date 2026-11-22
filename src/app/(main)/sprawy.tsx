import { Link, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ApiHealthBanner } from '@/components/ui/ApiHealthBanner';
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
import { colors, spacing, typography } from '@/theme';
import { normalizeChecklistStatus, type ChecklistItem } from '@/types/journey';

/**
 * Moje sprawy — radar i checklista formalności.
 * FastAPI (procedure) + uzupełnienie z lokalnego Mój plan (DEMO, kategorie zus/admin/deadline).
 */
export default function SprawyScreen() {
  const profile = useUserJourneyStore((s) => s.profile);
  const overrides = useUserJourneyStore((s) => s.checklistOverrides);
  const setChecklistStatus = useUserJourneyStore((s) => s.setChecklistStatus);
  const mode = getApiMode();

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
          description="Najpierw uzupełnij ankietę — potem zobaczysz formalności i Mój plan."
          actionLabel="Mój plan"
          onAction={() => router.push('/home')}
        />
      </Screen>
    );
  }

  if (query.isLoading) {
    return (
      <Screen title="Moje sprawy">
        <ApiHealthBanner />
        <Card>
          <Text style={styles.muted}>Ładujemy formalności z oceny sytuacji…</Text>
        </Card>
        <Card>
          <Text style={styles.section}>Tymczasem — plan lokalny DEMO</Text>
          <ChecklistList
            items={applyOverrides(localChecklist, overrides).slice(0, 5)}
            onStatusChange={setChecklistStatus}
            compact
          />
          <Button label="Otwórz pełny Mój plan" onPress={() => router.push('/home')} />
        </Card>
      </Screen>
    );
  }

  const apiChecklist = query.isError ? [] : (query.data?.checklist ?? []);
  const items = applyOverrides(
    mergeChecklists(apiChecklist, localChecklist),
    overrides,
  );

  return (
    <Screen title="Moje sprawy">
      <ApiHealthBanner />
      <DemoBanner message="Najpierw formalności z oceny Twojej sytuacji, potem podpowiedzi demonstracyjne z lokalnego planu. Żadne nie są decyzją ZUS." />
      <View style={styles.navRow}>
        <Button label="Mój plan" onPress={() => router.push('/home')} />
        <Button
          label="Świadczenia"
          variant="secondary"
          onPress={() => router.push('/benefits')}
        />
        <Button
          label="Kalkulator"
          variant="secondary"
          onPress={() => router.push('/calculator')}
        />
      </View>

      {query.isError ? (
        <Card>
          <Text style={styles.section}>Ocena API niedostępna</Text>
          <Text style={styles.body}>
            {apiErrorMessage(
              query.error,
              'Pokazujemy wyłącznie checklistę z lokalnego planu DEMO. Spróbuj ponowić połączenie.',
            )}
          </Text>
          <Button label="Spróbuj ponownie ocenę API" onPress={() => query.refetch()} />
        </Card>
      ) : (
        <>
          <DeadlineRadarSection items={query.data?.deadlineRadar ?? []} />
          <PostpartumKitSection kit={query.data?.postpartumKit ?? null} />
          <Card>
            <Text style={styles.section}>Najbliższy termin (gdy silnik podał konkretną datę)</Text>
            {query.data?.upcomingDeadline ? (
              <>
                <Text style={styles.bodyStrong}>{query.data.upcomingDeadline.title}</Text>
                <Text style={styles.body}>
                  {formatDatePl(query.data.upcomingDeadline.date)}
                </Text>
              </>
            ) : localPlan.nextDeadline ? (
              <>
                <Text style={styles.body}>
                  Brak daty ISO w planie API. Orientacyjnie z planu lokalnego DEMO:
                </Text>
                <Text style={styles.bodyStrong}>{localPlan.nextDeadline.title}</Text>
                <Text style={styles.body}>
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
        </>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.section}>Checklista formalności</Text>
        <Link href="/plan">
          <Text style={styles.link}>Wszystkie filtry →</Text>
        </Link>
      </View>

      {items.length === 0 ? (
        <Card>
          <Text style={styles.body}>
            Brak pozycji formalnych dla tej sytuacji
            {mode === 'rest'
              ? ' (silnik nie zwrócił planu, a lokalny plan nie ma zadań zus/admin).'
              : '.'}{' '}
            Sprawdź świadczenia albo uzupełnij ankietę.
          </Text>
          <Button label="Moje świadczenia" onPress={() => router.push('/benefits')} />
        </Card>
      ) : (
        <ChecklistList
          items={items.slice(0, 8)}
          onStatusChange={setChecklistStatus}
          compact
        />
      )}

      <Card>
        <Text style={styles.section}>Dokumenty i dane</Text>
        <Button label="Asystent dokumentów" onPress={() => router.push('/documents')} />
        <Button
          label="Dane ZUS (symulacja)"
          variant="secondary"
          onPress={() => router.push('/zus')}
        />
      </Card>
    </Screen>
  );
}

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
  section: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  body: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  bodyStrong: { ...typography.bodyStrong, color: colors.text, marginBottom: spacing.xs },
  link: { ...typography.bodyStrong, color: colors.primary },
  muted: { ...typography.body, color: colors.textSecondary },
});
