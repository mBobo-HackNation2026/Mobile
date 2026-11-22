export function formatNullableZl(value: string | null | undefined): string {
  if (value == null || value === '') return 'niedostępna';
  return `${value} zł`;
}

export function formatAmountDisplay(value: string | null | undefined): string {
  if (value == null || value === '') return '—';
  const n = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(n)) return `${value} zł`;
  return `${n.toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} zł`;
}

export function isZeroAmount(value: string | null | undefined): boolean {
  if (value == null || value === '') return false;
  const n = Number(String(value).replace(',', '.'));
  return Number.isFinite(n) && n === 0;
}

export function parseOptionalNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function primaryRateFromBreakdown(
  breakdown: ReadonlyArray<{ rate_percentage: string }>,
): string | null {
  if (!breakdown.length) return null;
  return breakdown[0]?.rate_percentage ?? null;
}
