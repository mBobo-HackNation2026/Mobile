/**
 * Mapowanie stabilnych `missing_fields[].field` (OpenAPI) → kontrolki profilu.
 * Bez heurystycznego parsowania `message`.
 */

export type MissingFieldInfo = {
  field: string;
  message: string;
};

/** Pola, które `/complete-data` umie zebrać bezpośrednio. */
export const KNOWN_MISSING_FIELD_IDS = [
  'insured_at_birth',
  'insurance_title',
  'debt_amount_zl',
  'father_insured',
  'child_age_months',
  'children_count',
  'children_survived_count',
  'insured_days_continuous',
  'za_zyciem_certificate',
  'full_dose_claimed_within_21_days',
  'other_parent_used_parental_leave_weeks',
  'is_full_time_employment',
  'child_hospitalization_weeks',
  'gestational_week_at_birth',
  'birth_weight_grams',
  'is_stillbirth_or_infant_death',
  'days_since_death',
  'days_since_burial',
  'employment_ended_reason',
  'other_employment_secured',
] as const;

export type KnownMissingFieldId = (typeof KNOWN_MISSING_FIELD_IDS)[number];

export function isKnownMissingFieldId(field: string): field is KnownMissingFieldId {
  return (KNOWN_MISSING_FIELD_IDS as readonly string[]).includes(field);
}

export const MISSING_FIELD_LABEL: Record<KnownMissingFieldId, string> = {
  insured_at_birth: 'Ubezpieczenie chorobowe w dniu porodu',
  insurance_title: 'Tytuł ubezpieczenia / forma zatrudnienia',
  debt_amount_zl: 'Zadłużenie składkowe (zł)',
  father_insured: 'Czy drugi rodzic jest ubezpieczony',
  child_age_months: 'Wiek dziecka (miesiące)',
  children_count: 'Liczba dzieci',
  children_survived_count: 'Liczba dzieci pozostałych przy życiu',
  insured_days_continuous: 'Dni ciągłego ubezpieczenia',
  za_zyciem_certificate: 'Zaświadczenie „Za życiem”',
  full_dose_claimed_within_21_days: 'Pełny wymiar zgłoszony w 21 dni',
  other_parent_used_parental_leave_weeks:
    'Tygodnie urlopu rodzicielskiego wykorzystane przez drugiego rodzica',
  is_full_time_employment: 'Zatrudnienie w pełnym wymiarze',
  child_hospitalization_weeks: 'Tygodnie hospitalizacji dziecka',
  gestational_week_at_birth: 'Tydzień ciąży w momencie porodu',
  birth_weight_grams: 'Masa urodzeniowa (g)',
  is_stillbirth_or_infant_death: 'Martwe urodzenie / śmierć dziecka',
  days_since_death: 'Dni od śmierci',
  days_since_burial: 'Dni od pochówku',
  employment_ended_reason: 'Powód ustania zatrudnienia',
  other_employment_secured: 'Czy zabezpieczono inne zatrudnienie',
};

/**
 * Deduplikacja po `field` — ten sam brak z wielu świadczeń = jedno pytanie.
 * Zachowuje pierwszą napotkaną `message`.
 */
export function aggregateMissingFields(
  items: MissingFieldInfo[],
): MissingFieldInfo[] {
  const map = new Map<string, MissingFieldInfo>();
  for (const item of items) {
    const key = item.field?.trim();
    if (!key) continue;
    if (!map.has(key)) {
      map.set(key, { field: key, message: item.message });
    }
  }
  return [...map.values()];
}

export function partitionMissingFields(items: MissingFieldInfo[]): {
  known: MissingFieldInfo[];
  unknown: MissingFieldInfo[];
} {
  const known: MissingFieldInfo[] = [];
  const unknown: MissingFieldInfo[] = [];
  for (const item of items) {
    if (isKnownMissingFieldId(item.field)) known.push(item);
    else unknown.push(item);
  }
  return { known, unknown };
}
