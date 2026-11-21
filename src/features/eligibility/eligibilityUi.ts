import type { EligibilityCheckResult } from '@/services/api/eligibilityCheckSchemas';

export type EligibilityPresentationMode =
  | 'likely_eligible'
  | 'conditional_plan'
  | 'alternative_path'
  | 'not_eligible'
  | 'unknown';

/** Mapowanie statusu API → tryb prezentacji (bez lokalnej logiki prawnej). */
export function getEligibilityPresentation(
  result: EligibilityCheckResult,
): EligibilityPresentationMode {
  const status = result.status;

  if (status === 'likely_eligible') {
    return 'likely_eligible';
  }

  if (status === 'not_eligible') {
    return 'not_eligible';
  }

  if (status === 'requires_verification') {
    if (result.plan != null && result.missing_data.length > 0) {
      return 'conditional_plan';
    }
    if (result.plan == null && result.possible_solutions.length > 0) {
      return 'alternative_path';
    }
    if (result.plan != null) {
      return 'conditional_plan';
    }
    return 'alternative_path';
  }

  return 'unknown';
}

export function eligibilityHeadline(mode: EligibilityPresentationMode): string {
  switch (mode) {
    case 'likely_eligible':
      return 'Na podstawie podanych danych prawdopodobnie spełniasz warunki.';
    case 'conditional_plan':
      return 'Możemy przygotować wstępny scenariusz, ale potrzebujemy jeszcze informacji.';
    case 'alternative_path':
      return 'W Twojej sytuacji może istnieć inne uprawnienie — wymaga osobnego potwierdzenia.';
    case 'not_eligible':
      return 'Na podstawie dostępnych danych nie potwierdziliśmy standardowego uprawnienia.';
    case 'unknown':
      return 'Nie możemy obecnie bezpiecznie przedstawić wyniku tej oceny.';
  }
}

export function eligibilityBadgeLabel(mode: EligibilityPresentationMode): string {
  switch (mode) {
    case 'likely_eligible':
      return 'Prawdopodobnie spełniasz warunki';
    case 'conditional_plan':
      return 'Wymaga weryfikacji — plan warunkowy';
    case 'alternative_path':
      return 'Wymaga weryfikacji — inna ścieżka';
    case 'not_eligible':
      return 'Brak potwierdzonego uprawnienia';
    case 'unknown':
      return 'Nieznany status oceny';
  }
}
