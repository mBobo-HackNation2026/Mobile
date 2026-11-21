import { ApiClientError } from '@/services/api/httpClient';

/** Komunikat błędu API / sieci w języku użytkownika. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
