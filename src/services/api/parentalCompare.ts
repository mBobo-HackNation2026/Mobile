import { API_PATHS } from '@/services/api/config';
import {
  insuranceTitleSchema,
  type InsuranceTitle,
} from '@/services/api/eligibilityCheckSchemas';
import { apiRequest } from '@/services/api/httpClient';
import { parseApiResponse } from '@/services/api/parse';
import { z } from 'zod';

export const parentCalculationInputSchema = z.object({
  label: z.string(),
  average_monthly_income_zl: z
    .union([z.number(), z.string()])
    .nullable()
    .optional(),
  insurance_title: insuranceTitleSchema.nullable().optional(),
  voluntary_contribution_base_zl: z
    .union([z.number(), z.string()])
    .nullable()
    .optional(),
  is_full_time_employment: z.boolean().nullable().optional(),
});

export const parentalLeaveCompareRequestSchema = z.object({
  children_count: z.number().int().min(1),
  za_zyciem_certificate: z.boolean().nullable().optional(),
  full_dose_claimed_within_21_days: z.boolean().nullable().optional(),
  parent_a: parentCalculationInputSchema,
  parent_b: parentCalculationInputSchema,
});

const variantSchema = z.object({
  label: z.string(),
  weeks_parent_a: z.number().int(),
  weeks_parent_b: z.number().int(),
  amount_parent_a_zl: z.string().nullable(),
  amount_parent_b_zl: z.string().nullable(),
  total_household_amount_zl: z.string().nullable(),
});

export const parentalLeaveCompareResponseSchema = z.object({
  total_pool_weeks: z.number().int(),
  non_transferable_weeks_per_parent: z.number().int(),
  rate_percentage: z.string(),
  variants: z.array(variantSchema),
  warnings: z.array(z.string()).default([]),
});

export type ParentCalculationInput = z.infer<typeof parentCalculationInputSchema>;
export type ParentalLeaveCompareRequest = z.infer<
  typeof parentalLeaveCompareRequestSchema
>;
export type ParentalLeaveCompareResponse = z.infer<
  typeof parentalLeaveCompareResponseSchema
>;

export type { InsuranceTitle };

/** POST `/api/v1/benefits/compare/urlop-rodzicielski` */
export async function compareParentalLeave(
  input: ParentalLeaveCompareRequest,
  signal?: AbortSignal,
): Promise<ParentalLeaveCompareResponse> {
  const raw = await apiRequest<unknown>(API_PATHS.benefitsCompareParental, {
    method: 'POST',
    body: input,
    auth: false,
    signal,
  });
  return parseApiResponse(
    parentalLeaveCompareResponseSchema,
    raw,
    'benefits/compare/urlop-rodzicielski',
  );
}
