import { create } from 'zustand';

import {
  createAnonymousSession,
  fetchAuthMe,
  loginMobywatelDemo,
} from '@/services/api/authApi';
import type { AuthStatus, UserProfile } from '@/services/api/authSchemas';
import { ApiClientError } from '@/services/api/httpClient';
import {
  setAccessTokenBridge,
  setUnauthorizedHandler,
} from '@/services/api/authTokenBridge';
import {
  clearStoredSession,
  loadStoredSession,
  saveStoredSession,
} from '@/services/api/tokenStorage';

type AuthPhase = 'idle' | 'bootstrapping' | 'ready' | 'error';
export type EntryMode = 'guest' | 'mobywatel' | null;

interface AuthState {
  phase: AuthPhase;
  accessToken: string | null;
  userId: string | null;
  status: AuthStatus | null;
  profile: UserProfile | null;
  /** Jak użytkownik wszedł z ekranu loginu (lokalnie, nie z JWT). */
  entryMode: EntryMode;
  sessionExpiredNotice: string | null;
  bootstrapError: string | null;
  isLoggingIn: boolean;
  isEnteringAsGuest: boolean;
  bootstrap: () => Promise<void>;
  /** Gość: zapewnia sesję anonimową jeśli się da, nigdy nie blokuje UI. */
  enterAsGuest: () => Promise<void>;
  loginMobywatel: () => Promise<void>;
  startNewAnonymousSession: () => Promise<void>;
  handleUnauthorized: () => Promise<void>;
  clearSessionExpiredNotice: () => void;
  refreshProfile: () => Promise<void>;
  setEntryMode: (mode: EntryMode) => void;
}

let bootstrapPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => {
  setUnauthorizedHandler(() => {
    void get().handleUnauthorized();
  });

  return {
    phase: 'idle',
    accessToken: null,
    userId: null,
    status: null,
    profile: null,
    entryMode: null,
    sessionExpiredNotice: null,
    bootstrapError: null,
    isLoggingIn: false,
    isEnteringAsGuest: false,

    setEntryMode: (mode) => set({ entryMode: mode }),

    bootstrap: async () => {
      if (bootstrapPromise) return bootstrapPromise;
      bootstrapPromise = (async () => {
        set({ phase: 'bootstrapping', bootstrapError: null });
        try {
          const stored = await loadStoredSession();
          if (stored) {
            setAccessTokenBridge(stored.accessToken);
            set({
              accessToken: stored.accessToken,
              userId: stored.userId,
              status: stored.status,
            });
            try {
              const profile = await fetchAuthMe();
              set({
                profile,
                status: profile.status,
                userId: profile.user_id,
                phase: 'ready',
              });
              await saveStoredSession({
                accessToken: stored.accessToken,
                userId: profile.user_id,
                status: profile.status,
              });
              return;
            } catch (error) {
              if (error instanceof ApiClientError && error.status === 401) {
                await clearStoredSession();
                setAccessTokenBridge(null);
              } else {
                // Sieć / 5xx — zostaw token, nie blokuj ankiety
                set({
                  phase: 'ready',
                  bootstrapError:
                    error instanceof Error
                      ? error.message
                      : 'Nie udało się potwierdzić sesji',
                });
                return;
              }
            }
          }

          try {
            const session = await createAnonymousSession();
            setAccessTokenBridge(session.access_token);
            await saveStoredSession({
              accessToken: session.access_token,
              userId: session.user_id,
              status: session.status,
            });
            let profile: UserProfile | null = null;
            try {
              profile = await fetchAuthMe();
            } catch {
              profile = {
                user_id: session.user_id,
                status: session.status,
                first_name: null,
                last_name: null,
                pesel: null,
              };
            }
            set({
              accessToken: session.access_token,
              userId: session.user_id,
              status: session.status,
              profile,
              phase: 'ready',
              bootstrapError: null,
            });
          } catch (error) {
            // Awaria sesji nie blokuje publicznych funkcji
            set({
              phase: 'ready',
              bootstrapError:
                error instanceof Error
                  ? error.message
                  : 'Nie utworzono sesji anonimowej',
              accessToken: null,
              userId: null,
              status: null,
              profile: null,
            });
            setAccessTokenBridge(null);
          }
        } finally {
          bootstrapPromise = null;
        }
      })();
      return bootstrapPromise;
    },

    enterAsGuest: async () => {
      set({ isEnteringAsGuest: true, sessionExpiredNotice: null });
      try {
        if (!get().accessToken) {
          try {
            await get().startNewAnonymousSession();
          } catch {
            // Brief: awaria sesji nie blokuje ankiety / silnika.
          }
        }
        set({ entryMode: 'guest', isEnteringAsGuest: false });
      } catch {
        set({ entryMode: 'guest', isEnteringAsGuest: false });
      }
    },

    loginMobywatel: async () => {
      set({ isLoggingIn: true, sessionExpiredNotice: null });
      try {
        if (!get().accessToken) {
          await get().startNewAnonymousSession();
        }
        const previousUserId = get().userId;
        const session = await loginMobywatelDemo();
        setAccessTokenBridge(session.access_token);
        await saveStoredSession({
          accessToken: session.access_token,
          userId: session.user_id,
          status: session.status,
        });
        const profile = await fetchAuthMe();
        set({
          accessToken: session.access_token,
          userId: session.user_id,
          status: session.status,
          profile,
          entryMode: 'mobywatel',
          isLoggingIn: false,
          phase: 'ready',
          sessionExpiredNotice:
            previousUserId && previousUserId !== session.user_id
              ? 'Uwaga: identyfikator użytkownika zmienił się po logowaniu DEMO.'
              : null,
        });
      } catch (error) {
        set({ isLoggingIn: false });
        if (error instanceof ApiClientError && error.status === 401) {
          await get().handleUnauthorized();
        }
        throw error;
      }
    },

    startNewAnonymousSession: async () => {
      const session = await createAnonymousSession();
      setAccessTokenBridge(session.access_token);
      await saveStoredSession({
        accessToken: session.access_token,
        userId: session.user_id,
        status: session.status,
      });
      let profile: UserProfile | null = null;
      try {
        profile = await fetchAuthMe();
      } catch {
        profile = {
          user_id: session.user_id,
          status: session.status,
          first_name: null,
          last_name: null,
          pesel: null,
        };
      }
      set({
        accessToken: session.access_token,
        userId: session.user_id,
        status: session.status,
        profile,
        phase: 'ready',
        sessionExpiredNotice: null,
        bootstrapError: null,
      });
    },

    handleUnauthorized: async () => {
      await clearStoredSession();
      setAccessTokenBridge(null);
      set({
        accessToken: null,
        userId: null,
        status: null,
        profile: null,
        sessionExpiredNotice:
          'Sesja wygasła lub jest nieprawidłowa. Ankieta lokalna została zachowana — możesz rozpocząć nową sesję anonimową.',
        phase: 'ready',
      });
    },

    clearSessionExpiredNotice: () => set({ sessionExpiredNotice: null }),

    refreshProfile: async () => {
      if (!get().accessToken) return;
      const profile = await fetchAuthMe();
      set({ profile, status: profile.status, userId: profile.user_id });
    },
  };
});
