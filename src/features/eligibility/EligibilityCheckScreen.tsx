import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { getApiBaseUrl } from '@/services/api/config';
import {
  BENEFIT_CODE_LABEL,
  DEFAULT_MATERNITY_BENEFIT_CODE,
  checkApiHealth,
  profileToEligibilityCheckRequest,
  type BenefitCode,
  type EligibilityCheckResult,
  type MaternityLeaveEligibilityRequest,
} from '@/services/api/eligibilityCheck';
import { API_ELIGIBILITY_DEMO_SCENARIOS } from '@/services/mock/fixtures';
import { useUserJourneyStore } from '@/store/useUserJourneyStore';
import { colors, spacing, typography } from '@/theme';

/**
 * Integracja FastAPI POST /api/v1/eligibility/check/{benefit_code}
 */
export function EligibilityCheckScreen() {
  const params = useLocalSearchParams<{ benefit?: string }>();
  const profile = useUserJourneyStore((s) => s.profile);
  const mutation = useEligibilityCheck();

  const [benefitCode, setBenefitCode] = useState<BenefitCode>(
    params.benefit?.trim() || DEFAULT_MATERNITY_BENEFIT_CODE,
  );
  const [lastRequest, setLastRequest] = useState<MaternityLeaveEligibilityRequest | null>(
    null,
  );
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [resultStack, setResultStack] = useState<EligibilityCheckResult[]>([]);
  const [checkingRelatedCode, setCheckingRelatedCode] = useState<string | null>(null);

  const healthQuery = useQuery({
    queryKey: ['api-health', getApiBaseUrl()],
    queryFn: checkApiHealth,
    staleTime: 30_000,
    retry: 1,
  });

  useEffect(() => {
    if (params.benefit?.trim()) {
      setBenefitCode(params.benefit.trim());
    }
  }, [params.benefit]);

  useEffect(() => {
    if (mutation.isSuccess && mutation.data) {
      setResultStack((prev) => {
        if (prev[prev.length - 1]?.benefit_code === mutation.data.benefit_code) {
          return [...prev.slice(0, -1), mutation.data];
        }
        return [...prev, mutation.data];
      });
      setCheckingRelatedCode(null);
    }
  }, [mutation.isSuccess, mutation.data]);

  useEffect(() => {
    if (mutation.isError) {
      setCheckingRelatedCode(null);
    }
  }, [mutation.isError]);

  const currentResult = resultStack[resultStack.length - 1] ?? null;

  const runCheck = (
    code: BenefitCode,
    request: MaternityLeaveEligibilityRequest,
    scenarioId?: string,
  ) => {
    setBenefitCode(code);
    setLastRequest(request);
    setActiveScenarioId(scenarioId ?? null);
    mutation.mutate({ benefitCode: code, request });
  };

  const runFromProfile = () => {
    if (!profile.onboardingCompleted) {
      router.push('/onboarding');
      return;
    }
    setResultStack([]);
    runCheck(benefitCode, profileToEligibilityCheckRequest(profile));
  };

  const checkRelated = (relatedCode: string) => {
    if (!lastRequest) return;
    if (resultStack.some((r) => r.benefit_code === relatedCode)) {
      return;
    }
    setCheckingRelatedCode(relatedCode);
    runCheck(relatedCode, lastRequest);
  };

  return (
    <Screen
      title="Ocena uprawnienia (API)"
      subtitle="Silnik obsługuje wiele kodów świadczeń. Powiązane ścieżki otwierasz świadomie — bez automatycznych pętli."
    >
      <DemoBanner message="Ocena z FastAPI v2 — nie decyzja ZUS. Endpoint: /eligibility/check/{benefit_code}." />
      <View style={styles.headerMeta}>
        <Badge
          label={healthQuery.data?.ok ? 'API dostępne' : 'API / tunel — sprawdź'}
          tone={healthQuery.data?.ok ? 'success' : 'warning'}
        />
        <Text style={styles.meta}>{getApiBaseUrl()}</Text>
        <Text style={styles.meta}>
          Aktywny kod: {BENEFIT_CODE_LABEL[benefitCode] ?? benefitCode}
        </Text>
      </View>

      <Card>
        <Text style={styles.section}>Świadczenie</Text>
        <View style={styles.chipRow}>
          <Button
            label="Urlop macierzyński"
            variant={
              benefitCode === DEFAULT_MATERNITY_BENEFIT_CODE ? 'primary' : 'secondary'
            }
            onPress={() => setBenefitCode(DEFAULT_MATERNITY_BENEFIT_CODE)}
          />
          <Button
            label="Art. 30 (wysokość macierzyńskiego)"
            variant={
              benefitCode === 'zasilek_w_wysokosci_zasilku_macierzynskiego'
                ? 'primary'
                : 'secondary'
            }
            onPress={() =>
              setBenefitCode('zasilek_w_wysokosci_zasilku_macierzynskiego')
            }
          />
        </View>
        <Button
          label={
            mutation.isPending && !activeScenarioId
              ? 'Ocena w toku…'
              : 'Oceń na podstawie moich danych'
          }
          onPress={runFromProfile}
          disabled={mutation.isPending}
        />
      </Card>

      <Card>
        <Text style={styles.section}>Scenariusze demo → FastAPI</Text>
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
              onPress={() => {
                setResultStack([]);
                runCheck(
                  scenario.benefitCode ?? DEFAULT_MATERNITY_BENEFIT_CODE,
                  scenario.request,
                  scenario.id,
                );
              }}
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
            'Sprawdź tunel ngrok / EXPO_PUBLIC_API_URL. Możesz ponowić lub wrócić do hubu.',
          )}
          actionLabel="Ponów"
          onAction={() => {
            if (lastRequest) mutation.mutate({ benefitCode, request: lastRequest });
          }}
        />
      ) : null}

      {currentResult ? (
        <EligibilityResultView
          result={currentResult}
          pregnancyNote={
            profile.stage === 'pregnancy' &&
            profileToEligibilityCheckRequest(profile).insured_at_birth === true &&
            activeScenarioId == null
          }
          onRetry={() => lastRequest && mutation.mutate({ benefitCode, request: lastRequest })}
          onFillMissing={() => router.push('/onboarding')}
          onCheckRelated={checkRelated}
          checkingRelatedCode={checkingRelatedCode}
          onBackToPrevious={
            resultStack.length > 1
              ? () => {
                  setResultStack((prev) => prev.slice(0, -1));
                  const prev = resultStack[resultStack.length - 2];
                  if (prev) setBenefitCode(prev.benefit_code);
                }
              : undefined
          }
          requestSnapshot={lastRequest}
        />
      ) : null}

      <Card>
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
  headerMeta: { gap: spacing.xs },
  section: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  body: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  bodyStrong: { ...typography.bodyStrong, color: colors.text },
  meta: { ...typography.small, color: colors.textMuted, marginBottom: spacing.xs },
  chipRow: { gap: spacing.sm, marginBottom: spacing.sm },
  scenario: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
