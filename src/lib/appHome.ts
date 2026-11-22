import type { Href } from 'expo-router';

import { useUserJourneyStore } from '@/store/useUserJourneyStore';

/** Domyślny ekran po wejściu / zakończeniu onboardingu (Etap 14). */
export const APP_HOME_HREF = '/benefits' as const satisfies Href;

/** Powrót do ankiety, gdy onboarding nieukończony. */
export const ONBOARDING_ENTRY_HREF = '/welcome' as const satisfies Href;

export function resolvePostEntryHref(onboardingCompleted: boolean): Href {
  return onboardingCompleted ? APP_HOME_HREF : ONBOARDING_ENTRY_HREF;
}

/** Hook: docelowa ścieżka po auth / wejściu do aplikacji. */
export function usePostEntryHref(): Href {
  const onboardingCompleted = useUserJourneyStore(
    (s) => s.profile.onboardingCompleted,
  );
  return resolvePostEntryHref(onboardingCompleted);
}
