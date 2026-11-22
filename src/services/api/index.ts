import { CatalogEligibilityAdapter } from '@/services/api/CatalogEligibilityAdapter';
import { getApiMode } from '@/services/api/config';
import {
  RestDocumentsAdapter,
  RestKnowledgeAdapter,
} from '@/services/api/RestAdapter';
import type { ApiServices, CalculatorService } from '@/services/api/types';
import {
  withDocumentsFallback,
  withKnowledgeFallback,
} from '@/services/api/withMockFallback';
import {
  MockCalculatorAdapter,
  MockDocumentsAdapter,
  MockEligibilityAdapter,
  MockKnowledgeAdapter,
} from '@/services/mock/MockAdapter';

/**
 * rest: katalog 9 świadczeń z FastAPI — BEZ cichego mocka eligibility/calculate/compare.
 * Dokumenty/knowledge: jawny fallback mock z ostrzeżeniem (poza silnikiem uprawnień).
 * mock: wszystko lokalnie, oznaczone DEMO.
 */
function createServices(): ApiServices {
  const rest = getApiMode() === 'rest';

  if (!rest) {
    return {
      eligibility: new MockEligibilityAdapter(),
      calculator: new MockCalculatorAdapter(),
      documents: new MockDocumentsAdapter(),
      knowledge: new MockKnowledgeAdapter(),
    };
  }

  /** Legacy CalculatorService — ekran kalkulatora P0 używa calculateBenefitAmount / compare bezpośrednio. */
  const restCalculator: CalculatorService = {
    async calculate() {
      throw new Error(
        'Użyj POST /api/v1/benefits/calculate/{benefit_code} oraz compare/urlop-rodzicielski — legacy /calculations/parental nie jest używany w REST P0.',
      );
    },
  };

  return {
    eligibility: new CatalogEligibilityAdapter(),
    calculator: restCalculator,
    documents: withDocumentsFallback(
      new RestDocumentsAdapter(),
      new MockDocumentsAdapter(),
    ),
    knowledge: withKnowledgeFallback(
      new RestKnowledgeAdapter(),
      new MockKnowledgeAdapter(),
    ),
  };
}

export const api: ApiServices = createServices();

export const eligibilityService = api.eligibility;
export const calculatorService = api.calculator;
export const documentsService = api.documents;
export const knowledgeService = api.knowledge;

export { getApiBaseUrl, getApiMode } from '@/services/api/config';
export { ApiClientError } from '@/services/api/httpClient';
export {
  checkBenefitEligibility,
  checkMaternityEligibility,
  checkApiHealth,
  profileToEligibilityCheckRequest,
  mapInsuranceTitle,
  DEFAULT_MATERNITY_BENEFIT_CODE,
  BENEFIT_CODES,
  BENEFIT_CODE_LABEL,
  formatPlanDuration,
  formatPlanRate,
  isCautiousEligibilityResult,
  isKnownBenefitCode,
} from '@/services/api/eligibilityCheck';
export { mapEligibilityCheckToBenefit } from '@/services/api/mapEligibilityCheckToBenefit';
export type {
  BenefitCode,
  EligibilityCheckResult,
  MaternityLeaveEligibilityRequest,
} from '@/services/api/eligibilityCheckSchemas';
export { calculateBenefitAmount } from '@/services/api/benefitsCalculate';
export type { CalculatedAmount } from '@/services/api/benefitsCalculate';
export { compareParentalLeave } from '@/services/api/parentalCompare';
export type { ParentalLeaveCompareResponse } from '@/services/api/parentalCompare';
export {
  fetchFormalitiesForBenefit,
  fetchGeneralFormalities,
  FORMALITIES_PATHS,
} from '@/services/api/formalities';
export type {
  BenefitFormalities,
  FormalitiesFetchResult,
  FormalitiesResponse,
  GeneralFormalities,
} from '@/services/api/formalities';
export type { MissingFieldInfoApi } from '@/services/api/eligibilityCheckSchemas';
export {
  explainBenefitEligibility,
  isExplainStatusAligned,
  LEGAL_ADVISOR_TIMEOUT_MS,
} from '@/services/api/legalAdvisorExplain';
export type { LegalAdvisorExplainResponse } from '@/services/api/legalAdvisorExplain';
export {
  createAnonymousSession,
  loginMobywatelDemo,
  fetchAuthMe,
  logoutSession,
} from '@/services/api/authApi';
export type { SessionResponse, UserProfile, AuthStatus } from '@/services/api/authSchemas';
