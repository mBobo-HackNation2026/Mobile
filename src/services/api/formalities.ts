import { z } from 'zod';

import { getApiMode } from '@/services/api/config';
import { ApiClientError, apiRequest } from '@/services/api/httpClient';
import { parseApiResponse } from '@/services/api/parse';

/**
 * Kontrakt opcjonalny — brief Etap 15:
 * GET /api/v1/formalities/{benefit_code}
 * GET /api/v1/formalities/general
 *
 * Gdy endpoint niedostępny (404/501), UI korzysta z `procedure` z eligibility.
 */

const FormalityDocumentSchema = z.object({
  title: z.string(),
  when: z.string().nullable().optional(),
  required: z.boolean().optional(),
});

export const FormalitiesResponseSchema = z.object({
  benefit_code: z.string().optional(),
  office: z.string().nullable().optional(),
  submit_by: z.string().nullable().optional(),
  steps: z.array(z.string()).default([]),
  documents: z
    .array(z.union([z.string(), FormalityDocumentSchema]))
    .default([]),
  risks: z.array(z.string()).default([]),
  payer: z.string().nullable().optional(),
});

export type FormalitiesResponse = z.infer<typeof FormalitiesResponseSchema>;

export type FormalitiesFetchResult =
  | { status: 'ok'; data: FormalitiesResponse }
  | { status: 'unavailable'; reason: string }
  | { status: 'error'; reason: string };

export const FORMALITIES_PATHS = {
  byBenefit: (benefitCode: string) =>
    `/api/v1/formalities/${encodeURIComponent(benefitCode)}`,
  general: '/api/v1/formalities/general',
} as const;

async function getFormalities(path: string): Promise<FormalitiesFetchResult> {
  if (getApiMode() !== 'rest') {
    return {
      status: 'unavailable',
      reason: 'Endpoint formalities wymaga trybu REST.',
    };
  }

  try {
    const raw = await apiRequest<unknown>(path, { method: 'GET' });
    const data = parseApiResponse(
      FormalitiesResponseSchema,
      raw,
      'formalities',
    );
    return { status: 'ok', data };
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 404 || error.status === 501)) {
      return {
        status: 'unavailable',
        reason:
          'Backend nie udostępnia GET /formalities — używamy procedury z oceny uprawnień.',
      };
    }
    const message = error instanceof Error ? error.message : String(error);
    if (/404|501|not found/i.test(message)) {
      return {
        status: 'unavailable',
        reason:
          'Backend nie udostępnia GET /formalities — używamy procedury z oceny uprawnień.',
      };
    }
    return { status: 'error', reason: message };
  }
}

export function fetchFormalitiesForBenefit(
  benefitCode: string,
): Promise<FormalitiesFetchResult> {
  return getFormalities(FORMALITIES_PATHS.byBenefit(benefitCode));
}

export function fetchGeneralFormalities(): Promise<FormalitiesFetchResult> {
  return getFormalities(FORMALITIES_PATHS.general);
}
