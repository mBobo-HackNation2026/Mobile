import { z } from 'zod';

/** Typy zsynchronizowane z OpenAPI FastAPI v2 (Eligibility Engine). */

export const BENEFIT_CODES = [
  'zasilek_macierzynski_urlop_macierzynski',
  'zasilek_w_wysokosci_zasilku_macierzynskiego',
] as const;

export type BenefitCode = (typeof BENEFIT_CODES)[number] | (string & {});

export const BENEFIT_CODE_LABEL: Record<string, string> = {
  zasilek_macierzynski_urlop_macierzynski:
    'Zasiłek macierzyński (urlop macierzyński)',
  zasilek_w_wysokosci_zasilku_macierzynskiego:
    'Zasiłek w wysokości zasiłku macierzyńskiego (art. 30)',
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

export const maternityLeaveEligibilityRequestSchema = z.object({
  children_count: z.number().int().min(1),
  insured_at_birth: z.boolean().nullable().optional(),
  insurance_title: insuranceTitleSchema.nullable().optional(),
  debt_amount_zl: z.union([z.number(), z.string()]).nullable().optional(),
  employment_ended_reason: employmentEndedReasonSchema.nullable().optional(),
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
  weeks: z.number().int().nullable(),
  duration_description: z.string().nullable().optional().default(null),
  rate_percentage: z.string(),
  institution: z.string(),
  required_documents: z.array(requiredDocumentSchema).default([]),
  deadlines: z.array(z.string()).default([]),
  legal_basis: z.array(z.string()).default([]),
});

export const eligibilityResultSchema = z.object({
  benefit_code: z.string(),
  benefit_name: z.string(),
  /** Znane statusy + catch-all — nieznany nie wywala UI. */
  status: z.string(),
  met_conditions: z.array(z.string()).default([]),
  unmet_conditions: z.array(z.string()).default([]),
  missing_data: z.array(z.string()).default([]),
  possible_solutions: z.array(possibleSolutionSchema).default([]),
  plan: benefitPlanSchema.nullable(),
  rules_version: z.number().int(),
  data_source: z.string().default('user'),
  warnings: z.array(z.string()).default([]),
});

export type InsuranceTitle = z.infer<typeof insuranceTitleSchema>;
export type EmploymentEndedReason = z.infer<typeof employmentEndedReasonSchema>;
export type EligibilityCheckStatus = z.infer<typeof eligibilityStatusSchema>;
export type MaternityLeaveEligibilityRequest = z.infer<
  typeof maternityLeaveEligibilityRequestSchema
>;
export type EligibilityCheckResult = z.infer<typeof eligibilityResultSchema>;
export type BenefitPlan = z.infer<typeof benefitPlanSchema>;
export type PossibleSolution = z.infer<typeof possibleSolutionSchema>;

/** Czy wynik wymaga ostrożnej prezentacji (np. art. 30 — uproszczona ocena). */
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
