import { z } from 'zod';

/** Typy zsynchronizowane z OpenAPI FastAPI (MaternityLeaveEligibilityRequest / EligibilityResult). */

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
});

export const benefitPlanSchema = z.object({
  weeks: z.number().int(),
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
