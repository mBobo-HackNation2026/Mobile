import { API_PATHS } from '@/services/api/config';
import {
  serializeEligibilityCheckRequest,
  type MaternityLeaveEligibilityRequest,
} from '@/services/api/eligibilityCheck';
import type { BenefitCode } from '@/services/api/eligibilityCheckSchemas';
import { ApiClientError, apiRequest } from '@/services/api/httpClient';
import { parseApiResponse } from '@/services/api/parse';
import { z } from 'zod';

const ratePeriodSchema = z.object({
  days: z.number().int(),
  rate_percentage: z.string(),
  amount_zl: z.string(),
});

const basisSchema = z.object({
  monthly_basis_zl: z.string(),
  daily_basis_zl: z.string(),
  deduction_rate_percent: z.string(),
  minimum_basis_applied: z.boolean(),
  warnings: z.array(z.string()).default([]),
});

export const calculatedAmountSchema = z.object({
  benefit_code: z.string(),
  benefit_name: z.string(),
  basis: basisSchema.nullable().optional().default(null),
  total_days: z.number().int().nullable().optional().default(null),
  total_amount_zl: z.string().nullable().optional().default(null),
  lump_sum_amount_zl: z.string().nullable().optional().default(null),
  rate_breakdown: z.array(ratePeriodSchema).default([]),
  rules_version: z.number().int(),
  warnings: z.array(z.string()).default([]),
});

export type CalculatedAmount = z.infer<typeof calculatedAmountSchema>;

/** POST `/api/v1/benefits/calculate/{benefit_code}` — bez lokalnych formuł. */
export async function calculateBenefitAmount(
  benefitCode: BenefitCode | string,
  input: MaternityLeaveEligibilityRequest,
  signal?: AbortSignal,
): Promise<CalculatedAmount> {
  const payload = serializeEligibilityCheckRequest(input);
  const path = API_PATHS.benefitsCalculate(benefitCode);
  try {
    const raw = await apiRequest<unknown>(path, {
      method: 'POST',
      body: payload,
      auth: false,
      signal,
    });
    return parseApiResponse(
      calculatedAmountSchema,
      raw,
      `benefits/calculate/${benefitCode}`,
    );
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      throw new ApiClientError(
        'Kalkulacja tego świadczenia nie jest obecnie dostępna w silniku.',
        404,
        error.body,
        error.code ?? 'not_found',
      );
    }
    throw error;
  }
}
