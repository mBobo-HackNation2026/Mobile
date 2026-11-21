import {
  checkBenefitEligibility,
  DEFAULT_MATERNITY_BENEFIT_CODE,
  profileToEligibilityCheckRequest,
} from '@/services/api/eligibilityCheck';
import { ApiClientError } from '@/services/api/httpClient';
import { mapEligibilityCheckToBenefit } from '@/services/api/mapEligibilityCheckToBenefit';
import type { EligibilityService } from '@/services/api/types';
import { MockEligibilityAdapter } from '@/services/mock/MockAdapter';
import type { EligibilityEvaluation, ParentProfile } from '@/types/journey';

/**
 * Hub: macierzyński z FastAPI `/eligibility/check/{benefit_code}`, reszta z mocka.
 * Przy niedostępności BE — pełny mock + ostrzeżenie (nie wywala UI).
 */
export class HybridEligibilityAdapter implements EligibilityService {
  private readonly mock = new MockEligibilityAdapter();

  async evaluate(profile: ParentProfile): Promise<EligibilityEvaluation> {
    const base = await this.mock.evaluate(profile);

    try {
      const live = await checkBenefitEligibility(
        DEFAULT_MATERNITY_BENEFIT_CODE,
        profileToEligibilityCheckRequest(profile),
      );
      const maternity = mapEligibilityCheckToBenefit(live, profile);
      const otherBenefits = base.benefits.filter((b) => b.id !== 'maternity');

      const missingInputs = unique([
        ...base.missingInputs,
        ...live.missing_data,
      ]);

      return {
        ...base,
        isDemo: false,
        ruleSetVersion: `fastapi-maternity-v${live.rules_version}+mock-hub`,
        evaluatedAt: new Date().toISOString(),
        benefits: [maternity, ...otherBenefits],
        nextAction: {
          title: maternity.title,
          description: maternity.summary,
          ctaLabel: maternity.nextStepLabel,
          ctaHref: maternity.nextStepHref,
        },
        missingInputs,
        warnings: [
          'Zasiłek macierzyński: wynik FastAPI (nie decyzja ZUS).',
          'Pozostałe świadczenia i rozszerzenia hubu: mock demonstracyjny.',
          ...live.warnings,
          ...base.warnings.filter((w) => !/symulacja demonstracyjna/i.test(w)),
        ],
        assumptions: [
          `Macierzyński: FastAPI rules_version ${live.rules_version}, data_source=${live.data_source}.`,
          'Hub poza macierzyńskim pozostaje na MockAdapter do czasu pełnego katalogu BE.',
          ...base.assumptions.filter((a) => !/Wersja reguł demo/i.test(a)),
        ],
      };
    } catch (error) {
      const detail =
        error instanceof ApiClientError
          ? error.message
          : 'nieznany błąd połączenia';

      return {
        ...base,
        warnings: [
          `FastAPI niedostępne (${detail}) — hub tymczasowo na mocku.`,
          ...base.warnings,
        ],
        assumptions: [
          'Próba `/api/v1/eligibility/check/{benefit_code}` nieudana — użyto MockEligibilityAdapter.',
          ...base.assumptions,
        ],
      };
    }
  }
}

function unique(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))];
}
