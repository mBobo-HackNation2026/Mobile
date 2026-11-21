import { getApiMode } from '@/services/api/config';
import {
  RestCalculatorAdapter,
  RestDocumentsAdapter,
  RestKnowledgeAdapter,
} from '@/services/api/RestAdapter';
import type { ApiServices } from '@/services/api/types';
import {
  MockCalculatorAdapter,
  MockDocumentsAdapter,
  MockEligibilityAdapter,
  MockKnowledgeAdapter,
} from '@/services/mock/MockAdapter';

/**
 * Hub świadczeń / rozszerzenia UX nadal na mocku evaluate —
 * FastAPI v2 udostępnia na razie tylko POST /eligibility/check (jedno świadczenie).
 * Silnik macierzyński: `checkMaternityEligibility` (zawsze REST pod EXPO_PUBLIC_API_URL).
 */
function createServices(): ApiServices {
  const rest = getApiMode() === 'rest';

  return {
    eligibility: new MockEligibilityAdapter(),
    calculator: rest ? new RestCalculatorAdapter() : new MockCalculatorAdapter(),
    documents: rest ? new RestDocumentsAdapter() : new MockDocumentsAdapter(),
    knowledge: rest ? new RestKnowledgeAdapter() : new MockKnowledgeAdapter(),
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
  checkMaternityEligibility,
  checkApiHealth,
  profileToEligibilityCheckRequest,
} from '@/services/api/eligibilityCheck';
export type {
  EligibilityCheckResult,
  MaternityLeaveEligibilityRequest,
} from '@/services/api/eligibilityCheckSchemas';
