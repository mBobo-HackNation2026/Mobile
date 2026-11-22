import { useQuery, useQueryClient } from '@tanstack/react-query';

import { eligibilityService } from '@/services/api';
import { useUserJourneyStore } from '@/store/useUserJourneyStore';
import type { EligibilityEvaluation, ParentProfile } from '@/types/journey';

/** Wspólny klucz katalogu 9 świadczeń — jeden cache dla Plan / Hub / Sprawy. */
export const CATALOG_ELIGIBILITY_QUERY_KEY = 'eligibility' as const;

export function catalogEligibilityQueryKey(profile: ParentProfile) {
  return [CATALOG_ELIGIBILITY_QUERY_KEY, profile] as const;
}

/**
 * Centralny odczyt oceny katalogu (CatalogEligibilityAdapter → 9× check).
 * Nie dubluje lokalnej logiki prawnej.
 */
export function useCatalogEligibility(options?: { enabled?: boolean }) {
  const profile = useUserJourneyStore((s) => s.profile);
  const enabled =
    (options?.enabled ?? true) && profile.onboardingCompleted;

  const query = useQuery({
    queryKey: catalogEligibilityQueryKey(profile),
    queryFn: () => eligibilityService.evaluate(profile),
    enabled,
    staleTime: 30_000,
  });

  return {
    profile,
    evaluation: query.data ?? null,
    ...query,
  };
}

export function useInvalidateCatalogEligibility() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: [CATALOG_ELIGIBILITY_QUERY_KEY] });
}

export async function prefetchCatalogEligibility(
  queryClient: ReturnType<typeof useQueryClient>,
  profile: ParentProfile,
): Promise<EligibilityEvaluation | undefined> {
  if (!profile.onboardingCompleted) return undefined;
  return queryClient.fetchQuery({
    queryKey: catalogEligibilityQueryKey(profile),
    queryFn: () => eligibilityService.evaluate(profile),
  });
}
