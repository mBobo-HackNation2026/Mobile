import type { BenefitAssessment } from '@/types/benefits';
import {
  resolveInstitutionFromText,
  type InstitutionId,
} from '@/types/institutions';

const ZUS_BENEFIT_IDS = new Set(['maternity', 'parental', 'paternity']);

/** Preferuje pole z API, potem `procedure.office`, potem domyślne dla znanych id. */
export function resolveBenefitInstitution(
  benefit: Pick<BenefitAssessment, 'id' | 'institution' | 'procedure'>,
): InstitutionId | null {
  if (benefit.institution) return benefit.institution;

  const fromOffice = resolveInstitutionFromText(benefit.procedure?.office);
  if (fromOffice) return fromOffice;

  if (ZUS_BENEFIT_IDS.has(benefit.id)) return 'zus';
  return null;
}
