import { ApiClientError } from '@/services/api/httpClient';

export type NormalizedApiError = {
  status: number;
  message: string;
  code?: string;
  /** Mapowanie pola formularza → komunikat (422). */
  fieldErrors: Record<string, string>;
  body?: unknown;
};

/**
 * Jedna normalizacja różnych formatów błędów FastAPI (401 string detail, 404 error_code, 422 Pydantic).
 */
export function normalizeApiError(
  status: number,
  body: unknown,
  fallbackMessage = `Błąd API (${status})`,
): NormalizedApiError {
  const fieldErrors: Record<string, string> = {};
  let message = fallbackMessage;
  let code: string | undefined;

  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;

    if (typeof record.error_code === 'string') {
      code = record.error_code;
    }
    if (typeof record.code === 'string' && !code) {
      code = record.code;
    }

    if (typeof record.message === 'string' && record.message.trim()) {
      message = record.message;
    }

    const detail = record.detail;
    if (typeof detail === 'string' && detail.trim()) {
      message = detail;
    } else if (Array.isArray(detail)) {
      const msgs: string[] = [];
      for (const item of detail) {
        if (!item || typeof item !== 'object') continue;
        const row = item as { msg?: unknown; loc?: unknown };
        const msg = typeof row.msg === 'string' ? row.msg : null;
        if (!msg) continue;
        msgs.push(msg);
        const field = fieldFromLoc(row.loc);
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = humanizeValidationMsg(msg);
        }
      }
      if (msgs.length) {
        message = msgs.map(humanizeValidationMsg).join('; ');
      }
    }
  }

  if (status === 401 && message === fallbackMessage) {
    message = 'Nieprawidłowa lub wygasła sesja';
  }
  if (status === 404 && message === fallbackMessage) {
    message = 'Nie znaleziono zasobu lub ścieżka świadczenia nie jest obsługiwana';
  }

  return { status, message, code, fieldErrors, body };
}

export function apiClientErrorFromResponse(
  status: number,
  body: unknown,
): ApiClientError {
  const normalized = normalizeApiError(status, body);
  return new ApiClientError(
    normalized.message,
    normalized.status,
    normalized.body,
    normalized.code,
  );
}

function fieldFromLoc(loc: unknown): string | null {
  if (!Array.isArray(loc) || loc.length === 0) return null;
  const parts = loc.filter((p) => p !== 'body' && p !== 'query' && p !== 'path');
  const last = parts[parts.length - 1];
  return typeof last === 'string' || typeof last === 'number' ? String(last) : null;
}

function humanizeValidationMsg(msg: string): string {
  if (/greater than or equal to 1/i.test(msg)) {
    return 'Liczba dzieci musi wynosić co najmniej 1';
  }
  return msg;
}
