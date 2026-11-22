import { z } from 'zod';

/** Typy zsynchronizowane z OpenAPI FastAPI (`/openapi.json`) — Eligibility Engine. */

export const BENEFIT_CODES = [
  'zasilek_macierzynski_urlop_macierzynski',
  'zasilek_w_wysokosci_zasilku_macierzynskiego',
  'urlop_ojcowski',
  'urlop_rodzicielski',
  'zasilek_chorobowy_w_ciazy',
  'swiadczenie_rehabilitacyjne',
  'uzupelniajacy_urlop_macierzynski',
  'urlop_na_warunkach_urlopu_macierzynskiego',
  'zasilek_pogrzebowy_martwe_urodzenie',
] as const;

/** Znane 9 kodów + string z API (np. related_benefit_code spoza katalogu). */
export type BenefitCode = (typeof BENEFIT_CODES)[number] | (string & {});

export const BENEFIT_CODE_LABEL: Record<BenefitCode, string> = {
  zasilek_macierzynski_urlop_macierzynski:
    'Zasiłek macierzyński (urlop macierzyński)',
  zasilek_w_wysokosci_zasilku_macierzynskiego:
    'Zasiłek w wysokości zasiłku macierzyńskiego',
  urlop_ojcowski: 'Urlop ojcowski',
  urlop_rodzicielski: 'Urlop rodzicielski',
  zasilek_chorobowy_w_ciazy: 'Zasiłek chorobowy w ciąży',
  swiadczenie_rehabilitacyjne: 'Świadczenie rehabilitacyjne',
  uzupelniajacy_urlop_macierzynski: 'Uzupełniający urlop macierzyński',
  urlop_na_warunkach_urlopu_macierzynskiego:
    'Urlop na warunkach urlopu macierzyńskiego',
  zasilek_pogrzebowy_martwe_urodzenie:
    'Zasiłek pogrzebowy (martwe urodzenie)',
};

export const DEFAULT_MATERNITY_BENEFIT_CODE =
  'zasilek_macierzynski_urlop_macierzynski' as const;

export const insuranceTitleSchema = z.enum([
  'umowa_o_prace',
  'zlecenie',
  'dzialalnosc_gospodarcza',
  'inny',
]);

export const employmentEndedReasonSchema = z.enum([
  'upadlosc_likwidacja_smierc_pracodawcy',
  'naruszenie_prawa_wyrokiem_sadu',
]);

export const fosterCareTypeSchema = z.enum([
  'rodzina_zastepcza',
  'rodzina_zastepcza_zawodowa',
  'wniosek_o_przysposobienie',
]);

export const bonusTypeSchema = z.enum(['miesieczna', 'kwartalna', 'roczna']);

export const eligibilityStatusSchema = z.enum([
  'likely_eligible',
  'not_eligible',
  'requires_verification',
]);

export const solutionTypeSchema = z.enum([
  'alternative_benefit',
  'corrective_action',
  'limitation',
]);

const nullableBool = z.boolean().nullable().optional();
const nullableInt = z.number().int().nullable().optional();
const nullableNumberOrString = z
  .union([z.number(), z.string()])
  .nullable()
  .optional();

/** Request wspólny dla eligibility/check i benefits/calculate (OpenAPI). */
export const maternityLeaveEligibilityRequestSchema = z.object({
  children_count: z.number().int().min(1),
  /** Liczba dzieci pozostałych przy życiu — istotne przy martwym urodzeniu / śmierci i children_count > 1. */
  children_survived_count: z.number().int().min(0).nullable().optional(),
  insured_at_birth: nullableBool,
  insurance_title: insuranceTitleSchema.nullable().optional(),
  debt_amount_zl: nullableNumberOrString,
  employment_ended_reason: employmentEndedReasonSchema.nullable().optional(),
  other_employment_secured: nullableBool,
  father_insured: nullableBool,
  child_age_months: z.number().int().min(0).nullable().optional(),
  is_pregnant: nullableBool,
  insured_days_continuous: z.number().int().min(0).nullable().optional(),
  child_hospitalization_weeks: z.number().int().min(0).nullable().optional(),
  gestational_week_at_birth: z.number().int().min(0).nullable().optional(),
  birth_weight_grams: z.number().int().min(0).nullable().optional(),
  postpartum_weeks_elapsed: z.number().int().min(0).nullable().optional(),
  is_adoption_or_foster_care: nullableBool,
  foster_care_type: fosterCareTypeSchema.nullable().optional(),
  child_age_years: z.number().int().min(0).nullable().optional(),
  school_obligation_deferred: nullableBool,
  za_zyciem_certificate: nullableBool,
  full_dose_claimed_within_21_days: nullableBool,
  other_parent_used_parental_leave_weeks: z
    .number()
    .int()
    .min(0)
    .nullable()
    .optional(),
  part_time_fraction_during_parental_leave: nullableNumberOrString,
  sickness_benefit_period_exhausted: nullableBool,
  medical_prognosis_recovery_possible: nullableBool,
  excluded_from_rehabilitation_benefit: nullableBool,
  is_stillbirth_or_infant_death: nullableBool,
  days_since_death: z.number().int().min(0).nullable().optional(),
  days_since_burial: z.number().int().min(0).nullable().optional(),
  average_monthly_income_zl: nullableNumberOrString,
  is_full_time_employment: nullableBool,
  employment_duration_months: z.number().int().min(0).nullable().optional(),
  voluntary_contribution_base_zl: nullableNumberOrString,
  bonus_type: bonusTypeSchema.nullable().optional(),
  months_since_last_benefit: z.number().int().min(0).nullable().optional(),
});

export const requiredDocumentSchema = z.object({
  code: z.string(),
  name: z.string(),
  when: z.string(),
});

export const possibleSolutionSchema = z.object({
  type: solutionTypeSchema.or(z.string()),
  description: z.string(),
  legal_basis: z.string().nullable().optional(),
  related_benefit_code: z.string().nullable().optional(),
});

export const benefitPlanSchema = z.object({
  weeks: z.number().int().nullable().optional().default(null),
  duration_description: z.string().nullable().optional().default(null),
  rate_percentage: z.string().nullable().optional().default(null),
  lump_sum_amount_zl: z.string().nullable().optional().default(null),
  institution: z.string(),
  required_documents: z.array(requiredDocumentSchema).default([]),
  deadlines: z.array(z.string()).default([]),
  legal_basis: z.array(z.string()).default([]),
});

export const missingFieldInfoSchema = z.object({
  field: z.string(),
  message: z.string(),
});

export const eligibilityResultSchema = z.object({
  benefit_code: z.string(),
  benefit_name: z.string(),
  status: z.string(),
  met_conditions: z.array(z.string()).default([]),
  unmet_conditions: z.array(z.string()).default([]),
  missing_data: z.array(z.string()).default([]),
  /** Stabilne ID pól — FE mapuje bez parsowania polskiego tekstu. */
  missing_fields: z.array(missingFieldInfoSchema).default([]),
  possible_solutions: z.array(possibleSolutionSchema).default([]),
  plan: benefitPlanSchema.nullable(),
  rules_version: z.number().int(),
  data_source: z.string().default('user'),
  warnings: z.array(z.string()).default([]),
});

export type InsuranceTitle = z.infer<typeof insuranceTitleSchema>;
export type EmploymentEndedReason = z.infer<typeof employmentEndedReasonSchema>;
export type FosterCareType = z.infer<typeof fosterCareTypeSchema>;
export type EligibilityCheckStatus = z.infer<typeof eligibilityStatusSchema>;
export type MaternityLeaveEligibilityRequest = z.infer<
  typeof maternityLeaveEligibilityRequestSchema
>;
export type EligibilityCheckResult = z.infer<typeof eligibilityResultSchema>;
export type MissingFieldInfoApi = z.infer<typeof missingFieldInfoSchema>;
export type BenefitPlan = z.infer<typeof benefitPlanSchema>;
export type PossibleSolution = z.infer<typeof possibleSolutionSchema>;

export function isKnownBenefitCode(code: string): code is BenefitCode {
  return (BENEFIT_CODES as readonly string[]).includes(code);
}

/** Czy wynik wymaga ostrożnej prezentacji (uproszczenia BE / ostrzeżenia). */
export function isCautiousEligibilityResult(result: EligibilityCheckResult): boolean {
  if (result.benefit_code === 'zasilek_w_wysokosci_zasilku_macierzynskiego') {
    return true;
  }
  return result.warnings.some((w) =>
    /nie weryfikuje|art\.?\s*30|uproszczon/i.test(w),
  );
}

export function formatPlanDuration(plan: BenefitPlan): string {
  if (plan.weeks != null) {
    return `${plan.weeks} tygodni`;
  }
  if (plan.duration_description?.trim()) {
    return plan.duration_description.trim();
  }
  return 'Okres wymaga ustalenia';
}

export function formatPlanRate(plan: BenefitPlan): string | null {
  if (plan.lump_sum_amount_zl != null && plan.lump_sum_amount_zl !== '') {
    return `${plan.lump_sum_amount_zl} zł (ryczałt)`;
  }
  if (plan.rate_percentage != null && plan.rate_percentage !== '') {
    return `${plan.rate_percentage}%`;
  }
  return null;
}
