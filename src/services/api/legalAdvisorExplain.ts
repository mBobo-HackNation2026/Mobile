import { API_PATHS } from '@/services/api/config';
import { apiRequest } from '@/services/api/httpClient';
import type { MaternityLeaveEligibilityRequest } from '@/services/api/eligibilityCheckSchemas';
import {
  LEGAL_ADVISOR_TIMEOUT_MS,
  legalAdvisorExplainResponseSchema,
  type LegalAdvisorExplainResponse,
} from '@/services/api/legalAdvisorExplainSchemas';
import { parseApiResponse } from '@/services/api/parse';

export {
  LEGAL_ADVISOR_TIMEOUT_MS,
  isExplainStatusAligned,
  legalAdvisorExplainResponseSchema,
} from '@/services/api/legalAdvisorExplainSchemas';
export type { LegalAdvisorExplainResponse } from '@/services/api/legalAdvisorExplainSchemas';

/** POST `/api/v1/legal-advisor/explain/{benefit_code}` — ten sam payload co eligibility/check. */
export async function explainBenefitEligibility(
  benefitCode: string,
  input: MaternityLeaveEligibilityRequest,
  signal?: AbortSignal,
): Promise<LegalAdvisorExplainResponse> {
  const path = API_PATHS.legalAdvisorExplain(benefitCode);
  const raw = await apiRequest<unknown>(path, {
    method: 'POST',
    body: input,
    auth: false,
    signal,
    timeoutMs: LEGAL_ADVISOR_TIMEOUT_MS,
  });
  return parseApiResponse(
    legalAdvisorExplainResponseSchema,
    raw,
    `legal-advisor/explain/${benefitCode}`,
  );
}
