import { Link, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ApiHealthBanner } from '@/components/ui/ApiHealthBanner';
import { AppSection } from '@/components/ui/AppSection';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { QuickActionRow } from '@/components/ui/QuickActionRow';
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
 * FastAPI (procedure) + uzupełnienie z lokalnego Mój plan (DEMO).
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
      <Screen title="Moje sprawy" subtitle="Formalności z oceny sytuacji i planu lokalnego.">
        <ApiHealthBanner />
        <Card>
          <Text style={styles.muted}>Ładujemy formalności z oceny sytuacji…</Text>
        </Card>
        <AppSection
          step="C"
          title="Tymczasem — plan lokalny DEMO"
          subtitle="Checklista nie znika, gdy silnik jeszcze liczy."
        >
          <ChecklistList
            items={applyOverrides(localChecklist, overrides).slice(0, 5)}
            onStatusChange={setChecklistStatus}
            compact
          />
          <Button label="Otwórz pełny Mój plan" onPress={() => router.push('/home')} />
        </AppSection>
      </Screen>
    );
  }

  const apiChecklist = query.isError ? [] : (query.data?.checklist ?? []);
  const items = applyOverrides(
    mergeChecklists(apiChecklist, localChecklist),
    overrides,
  );

  return (
    <Screen
      title="Moje sprawy"
      subtitle="Formalności, terminy i checklista — ze silnika oraz lokalnego planu DEMO."
    >
      <ApiHealthBanner />
      <DemoBanner message="Najpierw formalności z oceny sytuacji, potem podpowiedzi DEMO. Żadne nie są decyzją ZUS." />

      <AppSection step="F" title="Szybkie przejścia">
        <QuickActionRow
          actions={[
            { label: 'Mój plan', href: '/home', hint: 'Oś czasu' },
            { label: 'Świadczenia', href: '/benefits', hint: 'Ocena' },
            { label: 'Kalkulator', href: '/calculator', hint: 'Kwoty' },
          ]}
        />
      </AppSection>

      {query.isError ? (
        <Card style={styles.errorCard}>
          <Badge label="Ocena API niedostępna" tone="danger" />
          <Text style={styles.body}>
            {apiErrorMessage(
              query.error,
              'Pokazujemy wyłącznie checklistę z lokalnego planu DEMO. Spróbuj ponowić połączenie.',
            )}
          </Text>
          <Button
            label="Spróbuj ponownie ocenę API"
            onPress={() => query.refetch()}
          />
        </Card>
      ) : (
        <AppSection
          step="D"
          title="Terminy i radar"
          subtitle="Daty kalendarza tylko gdy silnik podał konkretny dzień."
        >
          <DeadlineRadarSection items={query.data?.deadlineRadar ?? []} />
          <PostpartumKitSection kit={query.data?.postpartumKit ?? null} />
          <Card style={styles.deadlineCard}>
            <Text style={styles.cardHeading}>Najbliższy termin</Text>
            {query.data?.upcomingDeadline ? (
              <>
                <Badge label="Z oceny silnika" tone="primary" />
                <Text style={styles.bodyStrong}>
                  {query.data.upcomingDeadline.title}
                </Text>
                <Text style={styles.deadlineDate}>
                  {formatDatePl(query.data.upcomingDeadline.date)}
                </Text>
              </>
            ) : localPlan.nextDeadline ? (
              <>
                <Badge label="Orientacyjnie · plan DEMO" tone="demo" />
                <Text style={styles.body}>
                  Brak daty ISO w planie API. Pokazujemy termin z lokalnego planu.
                </Text>
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
        </AppSection>
      )}

      <AppSection
        step="C"
        title="Checklista formalności"
        subtitle="Źródło w opisie pozycji: ocena sytuacji albo podpowiedź DEMO."
      >
        <View style={styles.sectionHeader}>
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
            <Button
              label="Moje świadczenia"
              onPress={() => router.push('/benefits')}
            />
          </Card>
        ) : (
          <ChecklistList
            items={items.slice(0, 8)}
            onStatusChange={setChecklistStatus}
            compact
          />
        )}
      </AppSection>

      <AppSection title="Dokumenty i dane">
        <Card style={styles.docsCard}>
          <Button
            label="Asystent dokumentów"
            onPress={() => router.push('/documents')}
            fullWidth
          />
          <Button
            label="Dane ZUS (symulacja)"
            variant="secondary"
            onPress={() => router.push('/zus')}
            fullWidth
          />
        </Card>
      </AppSection>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
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
  docsCard: { gap: spacing.sm },
  errorCard: {
    gap: spacing.sm,
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  link: { ...typography.bodyStrong, color: colors.primary },
  muted: { ...typography.body, color: colors.textSecondary },
});
