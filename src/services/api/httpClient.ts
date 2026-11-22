import { getApiBaseUrl, isNgrokUrl } from '@/services/api/config';
import {
  getAccessTokenBridge,
  notifyUnauthorized,
} from '@/services/api/authTokenBridge';
import { apiClientErrorFromResponse } from '@/services/api/normalizeApiError';

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
  /** Domyślnie true — dołącz Bearer, gdy token jest w bridge. */
  auth?: boolean;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path}`;
  const useAuth = options.auth !== false;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (isNgrokUrl(baseUrl)) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  if (useAuth) {
    const token = getAccessTokenBridge();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const timeoutMs = 20_000;
  const controller = new AbortController();
  const externalSignal = options.signal;
  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', onExternalAbort, { once: true });
  }
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? (options.body || options.formData ? 'POST' : 'GET'),
      headers,
      body,
      signal: controller.signal,
    });
  } catch (error) {
    const aborted =
      (error instanceof Error && error.name === 'AbortError') ||
      controller.signal.aborted;
    throw new ApiClientError(
      aborted
        ? 'Serwer nie odpowiedział na czas. Sprawdź połączenie lub tunel i spróbuj ponownie.'
        : 'Brak połączenia z silnikiem świadczeń. Lokalny plan DEMO działa — ocena i kalkulator wymagają API.',
      0,
      null,
      aborted ? 'timeout' : 'network_error',
    );
  } finally {
    clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }

  if (!response.ok) {
    let parsedBody: unknown;
    try {
      parsedBody = await response.json();
    } catch {
      parsedBody = undefined;
    }
    const error = apiClientErrorFromResponse(response.status, parsedBody);
    if (response.status === 401 && useAuth) {
      notifyUnauthorized();
    }
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
