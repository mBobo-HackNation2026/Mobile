/**
 * Instytucje obsługujące świadczenie / wniosek.
 * Monogramy UI — nie oficjalne logo (znaki towarowe).
 */
export type InstitutionId =
  | 'zus'
  | 'employer'
  | 'municipality'
  | 'zus_or_employer'
  | 'gov';

export interface InstitutionMeta {
  id: InstitutionId;
  /** Krótki monogram w rogu karty. */
  mark: string;
  /** Etykieta obok / pod monogramem. */
  label: string;
  /** Pełna nazwa dla accessibility. */
  fullLabel: string;
}

export const INSTITUTIONS: Record<InstitutionId, InstitutionMeta> = {
  zus: {
    id: 'zus',
    mark: 'ZUS',
    label: 'ZUS',
    fullLabel: 'Zakład Ubezpieczeń Społecznych',
  },
  employer: {
    id: 'employer',
    mark: 'PR',
    label: 'Pracodawca',
    fullLabel: 'Pracodawca',
  },
  municipality: {
    id: 'municipality',
    mark: 'UG',
    label: 'Gmina',
    fullLabel: 'Urząd gminy / ośrodek pomocy społecznej',
  },
  zus_or_employer: {
    id: 'zus_or_employer',
    mark: 'Z/P',
    label: 'ZUS lub pracodawca',
    fullLabel: 'ZUS lub pracodawca — zależnie od przypadku',
  },
  gov: {
    id: 'gov',
    mark: 'gov',
    label: 'gov.pl',
    fullLabel: 'Serwis rządowy gov.pl',
  },
};

export const INSTITUTION_IDS = Object.keys(INSTITUTIONS) as InstitutionId[];

/** Heurystyka z tekstu `office` / `institution` z API — bez logiki prawnej. */
export function resolveInstitutionFromText(
  text: string | null | undefined,
): InstitutionId | null {
  if (!text?.trim()) return null;
  const o = text.toLowerCase();
  const hasZus = o.includes('zus');
  const hasEmployer = o.includes('pracodawc');
  const hasGmina =
    o.includes('gmin') || o.includes('ops') || o.includes('mops') || o.includes('pomocy społecznej');
  const hasGov = o.includes('gov.pl') || o.includes('gov ') || o === 'gov';

  if (hasZus && hasEmployer) return 'zus_or_employer';
  if (hasZus) return 'zus';
  if (hasEmployer) return 'employer';
  if (hasGmina) return 'municipality';
  if (hasGov) return 'gov';
  return null;
}
