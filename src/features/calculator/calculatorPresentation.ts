/**
 * Prezentacja wyników calculate/compare — bez lokalnego przeliczania kwot.
 * Wykrywa ostrzeżenia silnika o 81,5% / 9 tygodniach nieprzenoszalnych.
 */

const RATE_CAUTION_RE =
  /81[.,]?5|nieprzenoszal|9\s*tyg|non[_\s-]?transfer|70\s*%.*9|9.*70\s*%/i;

export function hasUnverifiedRateWarning(warnings: readonly string[]): boolean {
  return warnings.some((w) => RATE_CAUTION_RE.test(w));
}

export function rateVariantLabel(fullDoseWithin21Days: boolean): string {
  return fullDoseWithin21Days
    ? 'Wybrany wariant wejściowy: uśredniony 81,5% (wniosek o pełny wymiar w 21 dni)'
    : 'Wybrany wariant wejściowy: 100% (macierzyński) / 70% (rodzicielski)';
}

export const NON_TRANSFERABLE_PARENT_NOTE =
  'Każdemu z rodziców przysługuje 9 tygodni urlopu rodzicielskiego, których nie można przenieść na drugiego rodzica. Za ten okres stawka zasiłku wynosi 70% podstawy — niezależnie od wariantu 81,5%.';

export const UNVERIFIED_AMOUNT_NOTE =
  'Silnik zgłasza uproszczenie stawek. Poniższa kwota jest wstępna i nie jest oznaczona jako zweryfikowana — nie traktuj jej jako ostatecznego wyliczenia ZUS.';
