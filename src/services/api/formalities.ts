import { z } from 'zod';

import { getApiMode } from '@/services/api/config';
import { ApiClientError, apiRequest } from '@/services/api/httpClient';
import { parseApiResponse } from '@/services/api/parse';

/**
 * GET /api/v1/formalities/{benefit_code}
 * GET /api/v1/formalities/general
 * Kontrakt zsynchronizowany z live OpenAPI (Etap 17).
 */

const RequiredDocumentSchema = z.object({
  code: z.string(),
  name: z.string(),
  when: z.string().nullable().optional(),
});

export const BenefitFormalitiesSchema = z.object({
  benefit_code: z.string(),
  benefit_name: z.string(),
  institution: z.string().nullable().optional(),
  required_documents: z.array(RequiredDocumentSchema).default([]),
  deadlines: z.array(z.string()).default([]),
  legal_basis: z.array(z.string()).default([]),
  general_risks: z.array(z.string()).default([]),
  employment_protection_note: z.string().nullable().optional(),
  next_steps: z.array(z.string()).default([]),
  rules_version: z.union([z.number(), z.string()]).optional(),
});

export const GeneralFormalitiesSchema = z.object({
  how_benefits_are_paid: z.string().nullable().optional(),
  general_risks: z.array(z.string()).default([]),
  employment_protection_note: z.string().nullable().optional(),
  charitable_support_note: z.string().nullable().optional(),
  difficult_situation_benefit_codes: z.array(z.string()).default([]),
});

export type BenefitFormalities = z.infer<typeof BenefitFormalitiesSchema>;
export type GeneralFormalities = z.infer<typeof GeneralFormalitiesSchema>;

export type FormalitiesFetchResult<T> =
  | { status: 'ok'; data: T }
  | { status: 'unavailable'; reason: string }
  | { status: 'error'; reason: string };

export const FORMALITIES_PATHS = {
  byBenefit: (benefitCode: string) =>
    `/api/v1/formalities/${encodeURIComponent(benefitCode)}`,
  general: '/api/v1/formalities/general',
} as const;

async function getJson(
  path: string,
): Promise<{ ok: true; raw: unknown } | { ok: false; result: FormalitiesFetchResult<never> }> {
  if (getApiMode() !== 'rest') {
    return {
      ok: false,
      result: {
        status: 'unavailable',
        reason: 'Endpoint formalities wymaga trybu REST.',
      },
    };
  }

  try {
    const raw = await apiRequest<unknown>(path, { method: 'GET' });
    return { ok: true, raw };
  } catch (error) {
    if (
      error instanceof ApiClientError &&
      (error.status === 404 || error.status === 501)
    ) {
      return {
        ok: false,
        result: {
          status: 'unavailable',
          reason:
            'Backend nie udostępnia formalities — używamy procedury z oceny uprawnień.',
        },
      };
    }
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, result: { status: 'error', reason: message } };
  }
}

export async function fetchFormalitiesForBenefit(
  benefitCode: string,
): Promise<FormalitiesFetchResult<BenefitFormalities>> {
  const got = await getJson(FORMALITIES_PATHS.byBenefit(benefitCode));
  if (!got.ok) return got.result;
  try {
    const data = parseApiResponse(
      BenefitFormalitiesSchema,
      got.raw,
      'formalities/benefit',
    );
    return { status: 'ok', data };
  } catch (error) {
    return {
      status: 'error',
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function fetchGeneralFormalities(): Promise<
  FormalitiesFetchResult<GeneralFormalities>
> {
  const got = await getJson(FORMALITIES_PATHS.general);
  if (!got.ok) return got.result;
  try {
    const data = parseApiResponse(
      GeneralFormalitiesSchema,
      got.raw,
      'formalities/general',
    );
    return { status: 'ok', data };
  } catch (error) {
    return {
      status: 'error',
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

/** @deprecated Alias kompatybilności — preferuj BenefitFormalities. */
export type FormalitiesResponse = BenefitFormalities;
