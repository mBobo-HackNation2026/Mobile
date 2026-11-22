import type { BenefitAssessment } from '@/types/benefits';
import {
  resolveInstitutionFromText,
  type InstitutionId,
} from '@/types/institutions';

/** Kody katalogu 9 — domyślnie ZUS, gdy procedura nie wskazuje inaczej. */
const ZUS_BENEFIT_IDS = new Set([
  'zasilek_macierzynski_urlop_macierzynski',
  'zasilek_w_wysokosci_zasilku_macierzynskiego',
  'urlop_ojcowski',
  'urlop_rodzicielski',
  'zasilek_chorobowy_w_ciazy',
  'swiadczenie_rehabilitacyjne',
  'uzupelniajacy_urlop_macierzynski',
  'urlop_na_warunkach_urlopu_macierzynskiego',
  'zasilek_pogrzebowy_martwe_urodzenie',
]);

/** Preferuje pole z API, potem `procedure.office`, potem domyślne dla znanych id. */
export function resolveBenefitInstitution(
  benefit: Pick<BenefitAssessment, 'id' | 'institution' | 'procedure'>,
): InstitutionId | null {
  if (benefit.institution) return benefit.institution;

  const fromOffice = resolveInstitutionFromText(benefit.procedure?.office);
  if (fromOffice) return fromOffice;

  if (ZUS_BENEFIT_IDS.has(benefit.id)) return 'zus_or_employer';
  return null;
}
