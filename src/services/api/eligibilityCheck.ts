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
  formatPlanRate,
  isCautiousEligibilityResult,
  isKnownBenefitCode,
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

function triState(
  value: boolean | null | undefined,
): boolean | null | undefined {
  if (value === true) return true;
  if (value === false) return false;
  if (value === null) return null;
  return undefined;
}

/**
 * Mapuje profil ankiety na request FastAPI.
 * `unknown` / brak danych → null lub pominięcie (NIGDY false za „Nie wiem”).
 * Pola finansowe (dochód) NIE trafiają tu z profilu — tylko z kalkulatora.
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
  } else if (profile.insuranceStatus === 'unknown') {
    insured_at_birth = null;
  }

  const insurance_title = mapInsuranceTitle(profile.employmentType);
  const special = profile.specialCircumstances ?? [];
  const isStillbirth = special.includes('stillbirth') || special.includes('child_death');
  const isPremature = special.includes('premature_birth');

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

  body.other_employment_secured = triState(profile.otherEmploymentSecured ?? null);
  body.father_insured = triState(profile.fatherInsured ?? null);
  body.child_age_months = profile.childAgeMonths ?? null;
  body.is_pregnant =
    profile.stage === 'pregnancy'
      ? true
      : profile.stage === 'after_birth' ||
          profile.stage === 'adoption' ||
          profile.stage === 'foster'
        ? false
        : triState(profile.isPregnant ?? null);
  body.insured_days_continuous = profile.insuredDaysContinuous ?? null;
  body.child_hospitalization_weeks = profile.childHospitalizationWeeks ?? null;
  body.gestational_week_at_birth = profile.gestationalWeekAtBirth ?? null;
  body.birth_weight_grams = profile.birthWeightGrams ?? null;
  body.postpartum_weeks_elapsed = profile.postpartumWeeksElapsed ?? null;

  if (profile.stage === 'adoption' || profile.stage === 'foster') {
    body.is_adoption_or_foster_care = true;
  } else if (profile.isAdoptionOrFosterCare != null) {
    body.is_adoption_or_foster_care = profile.isAdoptionOrFosterCare;
  }

  if (profile.fosterCareType) {
    body.foster_care_type = profile.fosterCareType;
  } else if (profile.stage === 'adoption') {
    body.foster_care_type = 'wniosek_o_przysposobienie';
  } else if (profile.stage === 'foster') {
    body.foster_care_type = 'rodzina_zastepcza';
  }

  body.child_age_years = profile.childAgeYears ?? null;
  body.school_obligation_deferred = triState(
    profile.schoolObligationDeferred ?? null,
  );
  body.za_zyciem_certificate = triState(profile.zaZyciemCertificate ?? null);
  body.full_dose_claimed_within_21_days = triState(
    profile.fullDoseClaimedWithin21Days ?? null,
  );
  body.other_parent_used_parental_leave_weeks =
    profile.otherParentUsedParentalLeaveWeeks ?? null;
  body.part_time_fraction_during_parental_leave =
    profile.partTimeFractionDuringParentalLeave ?? null;
  body.sickness_benefit_period_exhausted = triState(
    profile.sicknessBenefitPeriodExhausted ?? null,
  );
  body.medical_prognosis_recovery_possible = triState(
    profile.medicalPrognosisRecoveryPossible ?? null,
  );
  body.excluded_from_rehabilitation_benefit = triState(
    profile.excludedFromRehabilitationBenefit ?? null,
  );

  if (isStillbirth) {
    body.is_stillbirth_or_infant_death = true;
  } else {
    body.is_stillbirth_or_infant_death = triState(
      profile.isStillbirthOrInfantDeath ?? null,
    );
  }

  body.days_since_death = profile.daysSinceDeath ?? null;
  body.days_since_burial = profile.daysSinceBurial ?? null;
  body.children_survived_count = profile.childrenSurvivedCount ?? null;
  body.is_full_time_employment = triState(profile.isFullTimeEmployment ?? null);
  body.employment_duration_months = profile.employmentDurationMonths ?? null;

  if (isPremature && profile.gestationalWeekAtBirth == null) {
    // nie zgadujemy tygodnia — zostaw null, BE poprosi o dane
  }

  return body;
}

/** Czyści undefined przed JSON; zachowuje jawne `null` (Nie wiem). */
export function serializeEligibilityCheckRequest(
  input: MaternityLeaveEligibilityRequest,
): Record<string, unknown> {
  const out: Record<string, unknown> = {
    children_count: input.children_count,
  };

  const keys = Object.keys(input) as (keyof MaternityLeaveEligibilityRequest)[];
  for (const key of keys) {
    if (key === 'children_count') continue;
    const value = input[key];
    if (value === undefined) continue;
    out[key] = value;
  }

  return out;
}

/** POST `/api/v1/eligibility/check/{benefit_code}` */
export async function checkBenefitEligibility(
  benefitCode: BenefitCode | string,
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
    return parseApiResponse(
      eligibilityResultSchema,
      raw,
      `eligibility/check/${benefitCode}`,
    );
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
