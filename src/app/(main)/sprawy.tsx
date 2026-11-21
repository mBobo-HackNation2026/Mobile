import { Link, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ChecklistList } from '@/features/checklist/ChecklistList';
import { DeadlineRadarSection } from '@/features/extensions/DeadlineRadarSection';
import { PostpartumKitSection } from '@/features/extensions/PostpartumKitSection';
import { apiErrorMessage } from '@/lib/apiErrorMessage';
import { formatDatePl } from '@/lib/format';
import { eligibilityService } from '@/services/api';
import { useUserJourneyStore } from '@/store/useUserJourneyStore';
import { colors, spacing, typography } from '@/theme';
import { normalizeChecklistStatus, type ChecklistItem } from '@/types/journey';

/**
 * Moje sprawy — radar terminów, niezbędnik, checklista.
 */
export default function SprawyScreen() {
  const profile = useUserJourneyStore((s) => s.profile);
  const overrides = useUserJourneyStore((s) => s.checklistOverrides);
  const setChecklistStatus = useUserJourneyStore((s) => s.setChecklistStatus);

  const query = useQuery({
    queryKey: ['eligibility', profile],
    queryFn: () => eligibilityService.evaluate(profile),
    enabled: profile.onboardingCompleted,
  });

  if (!profile.onboardingCompleted) {
    return (
      <Screen>
        <EmptyState
          title="Brak spraw"
          description="Najpierw oceń świadczenia — potem tu zobaczysz formalności."
          actionLabel="Moje świadczenia"
          onAction={() => router.push('/benefits')}
        />
      </Screen>
    );
  }

  if (query.isLoading) {
    return (
      <Screen>
        <Card>
          <Text style={styles.muted}>Ładujemy sprawy…</Text>
        </Card>
      </Screen>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Screen>
        <EmptyState
          title="Nie udało się wczytać spraw"
          description={apiErrorMessage(
            query.error,
            'Sprawdź połączenie albo wróć do trybu mock.',
          )}
          actionLabel="Spróbuj ponownie"
          onAction={() => query.refetch()}
        />
      </Screen>
    );
  }

  const items: ChecklistItem[] = query.data.checklist.map((item) => ({
    ...item,
    status: normalizeChecklistStatus(overrides[item.id] ?? item.status),
  }));

  return (
    <Screen
      title="Moje sprawy"
      subtitle="Terminy z ostrzeżeniami, niezbędnik po zmianie etapu oraz formalności do odhaczenia."
    >
      <DemoBanner message="Radar, niezbędnik i checklista pochodzą z API/mocka — nie są decyzją ZUS." />

      <DeadlineRadarSection items={query.data.deadlineRadar} />

      <PostpartumKitSection kit={query.data.postpartumKit} />

      <Card>
        <Text style={styles.section}>Najbliższy termin (skrót)</Text>
        {query.data.upcomingDeadline ? (
          <>
            <Text style={styles.bodyStrong}>{query.data.upcomingDeadline.title}</Text>
            <Text style={styles.body}>
              {formatDatePl(query.data.upcomingDeadline.date)}
            </Text>
          </>
        ) : (
          <Text style={styles.body}>Brak zbliżającego się terminu w ocenie.</Text>
        )}
        <Button
          label="Otwórz kalendarz"
          variant="secondary"
          onPress={() => router.push('/calendar')}
        />
      </Card>

      <View style={styles.sectionHeader}>
        <Text style={styles.section}>Checklista formalności</Text>
        <Link href="/plan">
          <Text style={styles.link}>Wszystkie filtry →</Text>
        </Link>
      </View>
      <ChecklistList
        items={items.slice(0, 5)}
        onStatusChange={setChecklistStatus}
        compact
      />

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

const styles = StyleSheet.create({
  section: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  body: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  bodyStrong: { ...typography.bodyStrong, color: colors.text, marginBottom: spacing.xs },
  link: { ...typography.bodyStrong, color: colors.primary },
  muted: { ...typography.body, color: colors.textSecondary },
});
