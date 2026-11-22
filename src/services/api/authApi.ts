import { API_PATHS } from '@/services/api/config';
import { apiRequest } from '@/services/api/httpClient';
import {
  sessionResponseSchema,
  userProfileSchema,
  type SessionResponse,
  type UserProfile,
} from '@/services/api/authSchemas';
import { parseApiResponse } from '@/services/api/parse';

/** Tworzy anonimową sesję — bez Bearer. */
export async function createAnonymousSession(
  signal?: AbortSignal,
): Promise<SessionResponse> {
  const raw = await apiRequest<unknown>(API_PATHS.authSession, {
    method: 'POST',
    auth: false,
    signal,
  });
  return parseApiResponse(sessionResponseSchema, raw, 'auth/session');
}

/** Symulowane logowanie mObywatel — wymaga Bearer sesji anonimowej. */
export async function loginMobywatelDemo(
  signal?: AbortSignal,
): Promise<SessionResponse> {
  const raw = await apiRequest<unknown>(API_PATHS.authMobywatelLogin, {
    method: 'POST',
    body: {},
    auth: true,
    signal,
  });
  return parseApiResponse(sessionResponseSchema, raw, 'auth/mobywatel/login');
}

export async function fetchAuthMe(signal?: AbortSignal): Promise<UserProfile> {
  const raw = await apiRequest<unknown>(API_PATHS.authMe, {
    method: 'GET',
    auth: true,
    signal,
  });
  return parseApiResponse(userProfileSchema, raw, 'auth/me');
}

/** Wylogowanie sesji API — błędy sieci nie blokują lokalnego czyszczenia. */
export async function logoutSession(signal?: AbortSignal): Promise<void> {
  try {
    await apiRequest<unknown>(API_PATHS.authLogout, {
      method: 'POST',
      auth: true,
      signal,
    });
  } catch {
    // Lokalne czyszczenie i tak nastąpi po stronie store.
  }
}
