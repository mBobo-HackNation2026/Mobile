import type { ZodType } from 'zod';

import { ApiClientError } from '@/services/api/httpClient';

export function parseApiResponse<T>(
  schema: ZodType<T>,
  raw: unknown,
  label: string,
): T {
  const result = schema.safeParse(raw);
  if (result.success) return result.data;

  const details = result.error.issues
    .slice(0, 5)
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('; ');

  throw new ApiClientError(
    `Niepoprawna odpowiedź API (${label}): ${details}`,
    422,
    raw,
    'INVALID_RESPONSE_SHAPE',
  );
}
