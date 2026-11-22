import { ApiClientError } from '@/services/api/httpClient';

/** Komunikat błędu API / sieci w języku użytkownika — bez stack trace. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError) {
    return humanizeApiClientError(error) || fallback;
  }
  if (error instanceof Error && error.message) {
    return stripTechnicalNoise(error.message) || fallback;
  }
  return fallback;
}

function humanizeApiClientError(error: ApiClientError): string {
  if (error.code === 'aborted') {
    return 'Żądanie zostało anulowane.';
  }
  if (error.code === 'timeout') {
    return 'Serwer nie odpowiedział na czas. Sprawdź połączenie lub tunel i spróbuj ponownie.';
  }
  if (error.code === 'network_error' || error.status === 0) {
    return 'Brak połączenia z silnikiem świadczeń. Lokalny plan DEMO nadal działa — ocena i kalkulator wymagają API.';
  }
  if (error.status === 500 || error.status === 502 || error.status === 503) {
    return 'Silnik świadczeń ma chwilowy problem (błąd serwera). Spróbuj ponownie za chwilę — nie pokazujemy przykładowej kwoty zamiast wyniku.';
  }
  if (error.status === 422) {
    return error.message?.trim()
      ? `Dane są niekompletne lub niepoprawne: ${stripTechnicalNoise(error.message)}`
      : 'Dane są niekompletne. Uzupełnij ankietę i spróbuj ponownie.';
  }
  if (error.status === 404) {
    return error.message?.trim()
      ? stripTechnicalNoise(error.message)
      : 'Nie znaleziono tego świadczenia w silniku. Wybierz inne lub wróć do listy.';
  }
  return stripTechnicalNoise(error.message);
}

function stripTechnicalNoise(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return '';
  if (/^\s*Error:/i.test(trimmed) && trimmed.includes('\n')) {
    return trimmed.split('\n')[0]!.replace(/^Error:\s*/i, '').trim();
  }
  if (trimmed.length > 280) {
    return `${trimmed.slice(0, 277)}…`;
  }
  return trimmed;
}
