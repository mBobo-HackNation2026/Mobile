/**
 * Prezentacja wyników calculate/compare — bez lokalnego przeliczania kwot.
 *
 * Rozdzielamy:
 * - ostrzeżenia prawne / informacyjne (zawsze pokazywane jako tekst),
 * - defekt wyliczenia (np. 81,5% na nieprzenoszalnych 9 tyg.) → badge „wstępna”.
 */

import type { ParentalLeaveCompareResponse } from '@/services/api';

/** Teksty wskazujące na problem w samym wyliczeniu — nie na zwykłą informację prawną. */
const CALC_DEFECT_RE =
  /uproszczen|nie\s+uwzględni|błędn[ea]|zawyż|zaniż|81[.,]?5\s*%?\s*.{0,40}(?:także|również).{0,20}(?:9|nieprzenosz)|applied\s+81[.,]?5.{0,40}non[_\s-]?transfer/i;

export function hasCalculationDefectWarning(
  warnings: readonly string[],
): boolean {
  return warnings.some((w) => CALC_DEFECT_RE.test(w));
}

/** @deprecated Użyj hasCalculationDefectWarning — zachowane dla czytelnych diffów. */
export function hasUnverifiedRateWarning(warnings: readonly string[]): boolean {
  return hasCalculationDefectWarning(warnings);
}

function isAveragedRate(rate: string | null | undefined): boolean {
  if (rate == null || rate === '') return false;
  const n = Number(String(rate).replace(',', '.'));
  return Number.isFinite(n) && Math.abs(n - 81.5) < 0.051;
}

/**
 * Defekt compare: nieprzenoszalne N tygodni oznaczone stawką ~81,5% w polach API.
 * Gdy pól stawek brak — nie zgadujemy; zostaje tylko analiza tekstu ostrzeżeń o defekcie.
 */
export function compareHasCalculationDefect(
  result: ParentalLeaveCompareResponse,
): boolean {
  const reserved = result.non_transferable_weeks_per_parent;
  for (const variant of result.variants) {
    if (
      variant.weeks_parent_a === reserved &&
      isAveragedRate(variant.rate_percentage_parent_a)
    ) {
      return true;
    }
    if (
      variant.weeks_parent_b === reserved &&
      isAveragedRate(variant.rate_percentage_parent_b)
    ) {
      return true;
    }
  }
  return hasCalculationDefectWarning(result.warnings);
}

export function rateVariantLabel(fullDoseWithin21Days: boolean): string {
  return fullDoseWithin21Days
    ? 'Wybrany wariant wejściowy: uśredniony 81,5% (wniosek o pełny wymiar w 21 dni)'
    : 'Wybrany wariant wejściowy: 100% (macierzyński) / 70% (rodzicielski)';
}

export const NON_TRANSFERABLE_PARENT_NOTE =
  'Każdemu z rodziców przysługuje 9 tygodni urlopu rodzicielskiego, których nie można przenieść na drugiego rodzica. Za ten okres stawka zasiłku wynosi 70% podstawy — niezależnie od wariantu 81,5%.';

export const UNVERIFIED_AMOUNT_NOTE =
  'Silnik zgłasza możliwy problem w wyliczeniu stawek. Poniższa kwota jest oznaczona jako wstępna — nie traktuj jej jako ostatecznego wyliczenia ZUS.';

export const LEGAL_DISCLAIMER_SHORT =
  'eBobo jest projektem demonstracyjnym przygotowanym na Hackathon 2026. Nie jest oficjalną aplikacją Zakładu Ubezpieczeń Społecznych. Przedstawione informacje i wyliczenia mają charakter informacyjny i nie stanowią decyzji o przyznaniu świadczeń.';

export const LEGAL_DISCLAIMER_CALC =
  'Szacunek z silnika przy Twoich założeniach. To nie jest decyzja ZUS ani potwierdzenie prawa do świadczenia.';
