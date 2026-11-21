import { getApiBaseUrl, isNgrokUrl } from '@/services/api/config';
import { apiErrorSchema } from '@/services/api/schemas';

export class ApiClientError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly body?: unknown;

  constructor(message: string, status: number, body?: unknown, code?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.body = body;
    this.code = code;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  formData?: FormData;
  signal?: AbortSignal;
};

async function parseError(response: Response): Promise<ApiClientError> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  const parsed = apiErrorSchema.safeParse(body);
  let message = `Błąd API (${response.status})`;

  if (parsed.success) {
    if (typeof parsed.data.detail === 'string') {
      message = parsed.data.detail;
    } else if (Array.isArray(parsed.data.detail) && parsed.data.detail[0]?.msg) {
      message = parsed.data.detail[0].msg;
    } else if (parsed.data.message) {
      message = parsed.data.message;
    }
  }

  return new ApiClientError(message, response.status, body, parsed.success ? parsed.data.code : undefined);
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (isNgrokUrl(baseUrl)) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? (options.body || options.formData ? 'POST' : 'GET'),
      headers,
      body,
      signal: options.signal,
    });
  } catch {
    throw new ApiClientError(
      'Brak połączenia z serwerem. Sprawdź EXPO_PUBLIC_API_URL / EXPO_PUBLIC_API_BASE_URL albo użyj scenariuszy demo z fixture, gdy tunel jest niedostępny.',
      0,
    );
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
