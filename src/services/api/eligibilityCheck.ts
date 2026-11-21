import { API_PATHS, getApiBaseUrl } from '@/services/api/config';
import { ApiClientError, apiRequest } from '@/services/api/httpClient';
import {
  DEFAULT_MATERNITY_BENEFIT_CODE,
  eligibilityResultSchema,
  type BenefitCode,
  type EligibilityCheckResult,
  type MaternityLeaveEligibilityRequest,
} from '@/services/api/eligibilityCheckSchemas';
import { parseApiResponse } from '@/services/api/parse';
import type { EmploymentType, ParentProfile } from '@/types/journey';

export type {
  BenefitCode,
  EligibilityCheckResult,
  MaternityLeaveEligibilityRequest,
} from '@/services/api/eligibilityCheckSchemas';

export {
  BENEFIT_CODES,
  BENEFIT_CODE_LABEL,
  DEFAULT_MATERNITY_BENEFIT_CODE,
  formatPlanDuration,
  isCautiousEligibilityResult,
} from '@/services/api/eligibilityCheckSchemas';

/** Mapowanie tytułu ubezpieczenia z ankiety → kontrakt BE. */
export function mapInsuranceTitle(
  employmentType: EmploymentType | null,
): MaternityLeaveEligibilityRequest['insurance_title'] {
  switch (employmentType) {
    case 'employment_contract':
      return 'umowa_o_prace';
    case 'civil_contract':
      return 'zlecenie';
    case 'self_employed':
      return 'dzialalnosc_gospodarcza';
    case 'other':
      return 'inny';
    case 'unemployed':
    case 'unknown':
    case null:
      return null;
    default:
      return null;
  }
}

/**
 * Mapuje profil ankiety na request FastAPI.
 * `unknown` / brak danych → pomijamy pole lub null (NIGDY nie wysyłamy false za „Nie wiem”).
 */
export function profileToEligibilityCheckRequest(
  profile: ParentProfile,
): MaternityLeaveEligibilityRequest {
  const children = Math.max(1, profile.childrenCount ?? 1);

  let insured_at_birth: boolean | null | undefined;
  if (profile.insuranceStatus === 'insured') {
    insured_at_birth = true;
  } else if (profile.insuranceStatus === 'not_insured') {
    insured_at_birth = false;
  } else {
    insured_at_birth = null;
  }

  const insurance_title = mapInsuranceTitle(profile.employmentType);

  const body: MaternityLeaveEligibilityRequest = {
    children_count: children,
    insured_at_birth,
  };

  if (insurance_title) {
    body.insurance_title = insurance_title;
  }

  if (insurance_title === 'dzialalnosc_gospodarcza' && profile.debtAmountZl != null) {
    body.debt_amount_zl = profile.debtAmountZl;
  }

  if (insured_at_birth === false && profile.employmentEndedReason) {
    body.employment_ended_reason = profile.employmentEndedReason;
  }

  return body;
}

/** Czyści undefined / niepotrzebne null opcjonalne przed JSON. */
export function serializeEligibilityCheckRequest(
  input: MaternityLeaveEligibilityRequest,
): Record<string, unknown> {
  const out: Record<string, unknown> = {
    children_count: input.children_count,
  };

  if (input.insured_at_birth !== undefined) {
    out.insured_at_birth = input.insured_at_birth;
  }
  if (input.insurance_title != null) {
    out.insurance_title = input.insurance_title;
  }
  if (input.debt_amount_zl != null && input.debt_amount_zl !== '') {
    out.debt_amount_zl = input.debt_amount_zl;
  }
  if (input.employment_ended_reason != null) {
    out.employment_ended_reason = input.employment_ended_reason;
  }

  return out;
}

/** POST `/api/v1/eligibility/check/{benefit_code}` — wspólny serwis dla wszystkich świadczeń. */
export async function checkBenefitEligibility(
  benefitCode: BenefitCode,
  input: MaternityLeaveEligibilityRequest,
  signal?: AbortSignal,
): Promise<EligibilityCheckResult> {
  const payload = serializeEligibilityCheckRequest(input);
  const path = API_PATHS.eligibilityCheck(benefitCode);
  try {
    const raw = await apiRequest<unknown>(path, {
      method: 'POST',
      body: payload,
      auth: false,
      signal,
    });
    return parseApiResponse(eligibilityResultSchema, raw, `eligibility/check/${benefitCode}`);
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      throw new ApiClientError(
        'Ta ścieżka świadczenia nie jest obecnie obsługiwana przez silnik uprawnień.',
        404,
        error.body,
        error.code ?? 'not_found',
      );
    }
    throw error;
  }
}

/** @deprecated używaj checkBenefitEligibility z kodem świadczenia */
export async function checkMaternityEligibility(
  input: MaternityLeaveEligibilityRequest,
  signal?: AbortSignal,
): Promise<EligibilityCheckResult> {
  return checkBenefitEligibility(DEFAULT_MATERNITY_BENEFIT_CODE, input, signal);
}

export async function checkApiHealth(): Promise<{ ok: boolean; detail: string }> {
  try {
    const raw = await apiRequest<{ status?: string; app_name?: string }>(
      API_PATHS.health,
      { method: 'GET', auth: false },
    );
    const ok = raw?.status === 'ok';
    return {
      ok,
      detail: ok
        ? `API OK (${getApiBaseUrl()})`
        : `Nieoczekiwana odpowiedź health: ${JSON.stringify(raw)}`,
    };
  } catch (error) {
    if (error instanceof ApiClientError) {
      return { ok: false, detail: error.message };
    }
    return { ok: false, detail: 'Health check nieudany.' };
  }
}
