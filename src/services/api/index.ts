import { getApiMode } from '@/services/api/config';
import { HybridEligibilityAdapter } from '@/services/api/HybridEligibilityAdapter';
import {
  RestCalculatorAdapter,
  RestDocumentsAdapter,
  RestKnowledgeAdapter,
} from '@/services/api/RestAdapter';
import type { ApiServices } from '@/services/api/types';
import {
  withCalculatorFallback,
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
 * rest: macierzyński z FastAPI (hybrid hub), kalkulator/docs/knowledge — REST z fallbackiem mock.
 * mock: wszystko lokalnie.
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

  return {
    eligibility: new HybridEligibilityAdapter(),
    calculator: withCalculatorFallback(
      new RestCalculatorAdapter(),
      new MockCalculatorAdapter(),
    ),
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
  DEFAULT_MATERNITY_BENEFIT_CODE,
  BENEFIT_CODES,
  BENEFIT_CODE_LABEL,
  formatPlanDuration,
  isCautiousEligibilityResult,
} from '@/services/api/eligibilityCheck';
export type {
  BenefitCode,
  EligibilityCheckResult,
  MaternityLeaveEligibilityRequest,
} from '@/services/api/eligibilityCheckSchemas';
export {
  createAnonymousSession,
  loginMobywatelDemo,
  fetchAuthMe,
} from '@/services/api/authApi';
export type { SessionResponse, UserProfile, AuthStatus } from '@/services/api/authSchemas';
