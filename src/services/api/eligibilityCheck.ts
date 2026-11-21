import { API_PATHS, getApiBaseUrl } from '@/services/api/config';
import { ApiClientError, apiRequest } from '@/services/api/httpClient';
import {
  eligibilityResultSchema,
  type EligibilityCheckResult,
  type MaternityLeaveEligibilityRequest,
} from '@/services/api/eligibilityCheckSchemas';
import { parseApiResponse } from '@/services/api/parse';
import type { EmploymentType, ParentProfile } from '@/types/journey';

export type {
  EligibilityCheckResult,
  MaternityLeaveEligibilityRequest,
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
    // unknown / null — nie wysyłamy false
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

  if (
    insurance_title === 'dzialalnosc_gospodarcza' &&
    profile.debtAmountZl != null
  ) {
    body.debt_amount_zl = profile.debtAmountZl;
  }

  if (
    insured_at_birth === false &&
    profile.employmentEndedReason
  ) {
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

export async function checkMaternityEligibility(
  input: MaternityLeaveEligibilityRequest,
  signal?: AbortSignal,
): Promise<EligibilityCheckResult> {
  const payload = serializeEligibilityCheckRequest(input);
  const raw = await apiRequest<unknown>(API_PATHS.eligibilityCheck, {
    method: 'POST',
    body: payload,
    signal,
  });
  return parseApiResponse(eligibilityResultSchema, raw, 'eligibility/check');
}

export async function checkApiHealth(): Promise<{ ok: boolean; detail: string }> {
  try {
    const raw = await apiRequest<{ status?: string; app_name?: string }>(
      API_PATHS.health,
      { method: 'GET' },
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
