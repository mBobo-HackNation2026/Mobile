import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { EligibilityResultView } from '@/features/eligibility/EligibilityResultView';
import { useEligibilityCheck } from '@/hooks/useEligibilityCheck';
import { apiErrorMessage } from '@/lib/apiErrorMessage';
import {
  checkApiHealth,
  profileToEligibilityCheckRequest,
  type EligibilityCheckResult,
  type MaternityLeaveEligibilityRequest,
} from '@/services/api/eligibilityCheck';
import { getApiBaseUrl } from '@/services/api/config';
import { API_ELIGIBILITY_DEMO_SCENARIOS } from '@/services/mock/fixtures';
import { useUserJourneyStore } from '@/store/useUserJourneyStore';
import { colors, spacing, typography } from '@/theme';

/**
 * Integracja FastAPI POST /api/v1/eligibility/check
 * Jedno świadczenie: zasiłek macierzyński za okres urlopu macierzyńskiego.
 */
export function EligibilityCheckScreen() {
  const profile = useUserJourneyStore((s) => s.profile);
  const mutation = useEligibilityCheck();
  const [lastRequest, setLastRequest] = useState<MaternityLeaveEligibilityRequest | null>(
    null,
  );
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  const healthQuery = useQuery({
    queryKey: ['api-health', getApiBaseUrl()],
    queryFn: checkApiHealth,
    staleTime: 30_000,
    retry: 1,
  });

  const runCheck = (request: MaternityLeaveEligibilityRequest, scenarioId?: string) => {
    setLastRequest(request);
    setActiveScenarioId(scenarioId ?? null);
    mutation.mutate(request);
  };

  const runFromProfile = () => {
    if (!profile.onboardingCompleted) {
      router.push('/onboarding');
      return;
    }
    runCheck(profileToEligibilityCheckRequest(profile));
  };

  return (
    <Screen>
      <DemoBanner message="Ocena z FastAPI — nie decyzja ZUS. Endpoint obsługuje jedno świadczenie (urlop macierzyński)." />

      <View style={styles.header}>
        <Text style={styles.title}>Ocena uprawnienia (API)</Text>
        <Text style={styles.subtitle}>
          Rzeczywisty request do silnika reguł. Pozostałe obszary aplikacji (hub świadczeń,
          niezbędnik, kalkulator) mogą nadal korzystać z mocków.
        </Text>
        <Badge
          label={healthQuery.data?.ok ? 'API dostępne' : 'API / tunel — sprawdź'}
          tone={healthQuery.data?.ok ? 'success' : 'warning'}
        />
        <Text style={styles.meta}>{getApiBaseUrl()}</Text>
        {healthQuery.data ? (
          <Text style={styles.meta}>{healthQuery.data.detail}</Text>
        ) : null}
      </View>

      <Card>
        <Text style={styles.section}>Z ankiety / profilu</Text>
        <Text style={styles.body}>
          Mapujemy liczbę dzieci, ubezpieczenie w dniu porodu (null ≠ „nie”), tytuł
          ubezpieczenia, zadłużenie (tylko działalność) i powód ustania zatrudnienia.
        </Text>
        <Button
          label={
            mutation.isPending && !activeScenarioId
              ? 'Ocena w toku…'
              : 'Oceń na podstawie moich danych'
          }
          onPress={runFromProfile}
          disabled={mutation.isPending}
        />
        {!profile.onboardingCompleted ? (
          <Button
            label="Najpierw ankieta"
            variant="secondary"
            onPress={() => router.push('/onboarding')}
          />
        ) : null}
      </Card>

      <Card>
        <Text style={styles.section}>5 scenariuszy demo → FastAPI</Text>
        <Text style={styles.body}>
          Każdy przycisk wysyła prawdziwy request (bez podstawiania wyniku lokalnie).
        </Text>
        {API_ELIGIBILITY_DEMO_SCENARIOS.map((scenario) => (
          <View key={scenario.id} style={styles.scenario}>
            <Text style={styles.bodyStrong}>{scenario.title}</Text>
            <Text style={styles.meta}>{scenario.description}</Text>
            <Button
              label={
                mutation.isPending && activeScenarioId === scenario.id
                  ? 'Wysyłam…'
                  : 'Wyślij do API'
              }
              variant="secondary"
              disabled={mutation.isPending}
              onPress={() => runCheck(scenario.request, scenario.id)}
            />
          </View>
        ))}
      </Card>

      {mutation.isPending ? (
        <Card>
          <Text style={styles.body}>Łączę z FastAPI i oceniam uprawnienie…</Text>
        </Card>
      ) : null}

      {mutation.isError ? (
        <EmptyState
          title="Nie udało się ocenić uprawnienia"
          description={apiErrorMessage(
            mutation.error,
            'Sprawdź tunel ngrok / EXPO_PUBLIC_API_URL. Możesz ponowić lub wrócić do hubu mocków.',
          )}
          actionLabel="Ponów"
          onAction={() => {
            if (lastRequest) mutation.mutate(lastRequest);
          }}
        />
      ) : null}

      {mutation.data ? (
        <EligibilityResultView
          result={mutation.data as EligibilityCheckResult}
          pregnancyNote={
            profile.stage === 'pregnancy' &&
            profileToEligibilityCheckRequest(profile).insured_at_birth === true &&
            activeScenarioId == null
          }
          onRetry={() => lastRequest && mutation.mutate(lastRequest)}
          onFillMissing={() => router.push('/onboarding')}
        />
      ) : null}

      <Card>
        <Text style={styles.meta}>
          Ten ekran nie zastępuje hubu „Moje świadczenia” z mockami rozszerzeń. Integrujemy
          jeden endpoint silnika uprawnień.
        </Text>
        <Button
          label="Wróć do Moich świadczeń"
          variant="ghost"
          onPress={() => router.push('/benefits')}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary, maxWidth: 720 },
  section: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  body: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  bodyStrong: { ...typography.bodyStrong, color: colors.text },
  meta: { ...typography.small, color: colors.textMuted, marginBottom: spacing.xs },
  scenario: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
