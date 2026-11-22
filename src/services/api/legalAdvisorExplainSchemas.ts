import { eligibilityStatusSchema } from '@/services/api/eligibilityCheckSchemas';
import { z } from 'zod';

/** OpenRouter / explain — FE > 15s backend + margines. */
export const LEGAL_ADVISOR_TIMEOUT_MS = 25_000;

export const legalAdvisorExplainResponseSchema = z.object({
  benefit_code: z.string(),
  status: eligibilityStatusSchema.or(z.string()),
  explanation: z.string(),
  missing_data_explained: z.array(z.string()).default([]),
  suggested_next_steps: z.array(z.string()).default([]),
  other_benefits_to_check: z.array(z.string()).default([]),
  verified_legal_basis: z.array(z.string()).default([]),
  requires_additional_verification: z.boolean().default(false),
  rules_version: z.number().int().optional(),
  ai_available: z.boolean().optional(),
  source: z.enum(['ai', 'fallback']).or(z.string()).default('fallback'),
  request_log_entry_id: z.number().int().nullable().optional(),
});

export type LegalAdvisorExplainResponse = z.infer<
  typeof legalAdvisorExplainResponseSchema
>;

/**
 * Porównanie statusu explain vs silnik eligibility.
 * Nie mapujemy AI na UI — tylko wykrywamy rozjazd.
 */
export function isExplainStatusAligned(
  engineStatus: string | null | undefined,
  explainStatus: string,
): boolean {
  if (!engineStatus) return true;
  return engineStatus === explainStatus;
}
