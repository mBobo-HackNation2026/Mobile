import { getEligibilityPresentation } from '@/features/eligibility/eligibilityUi';
import {
  formatPlanDuration,
  isCautiousEligibilityResult,
  type EligibilityCheckResult,
} from '@/services/api/eligibilityCheckSchemas';
import {
  BENEFIT_STATUS_HEADLINE,
  type BenefitAssessment,
  type BenefitCondition,
  type BenefitPresentationStatus,
  type BenefitRemedy,
  type RemedyKind,
} from '@/types/benefits';
import { resolveInstitutionFromText } from '@/types/institutions';
import type { ParentProfile } from '@/types/journey';

const MATERNITY_ID = 'maternity';

/** Mapuje wynik FastAPI `/eligibility/check/{code}` na kartę hubu A–E (bez lokalnej logiki prawnej). */
export function mapEligibilityCheckToBenefit(
  result: EligibilityCheckResult,
  profile: ParentProfile,
): BenefitAssessment {
  const status = mapPresentationStatus(result);
  const cautious = isCautiousEligibilityResult(result);
  const title =
    profile.role === 'father'
      ? 'Urlop ojcowski / zasiłek macierzyński (ocena API)'
      : result.benefit_name || 'Zasiłek macierzyński';

  const remedies = result.possible_solutions.map((solution, index) =>
    mapSolutionToRemedy(solution, index),
  );

  const next = resolveNextStep(status, remedies, cautious);

  return {
    id: MATERNITY_ID,
    title,
    status: cautious && status === 'likely_eligible' ? 'needs_review' : status,
    headline: cautious
      ? 'To wstępna możliwość z API — część przesłanek wymaga sprawdzenia (m.in. art. 30).'
      : BENEFIT_STATUS_HEADLINE[status],
    summary: buildSummary(result, status, cautious),
    rationale: buildRationale(result, cautious),
    nextStepLabel: next.label,
    nextStepHref: next.href,
    conditions: buildConditions(result),
    remedies,
    alternatives: remedies
      .filter((r) => r.kind === 'alternative_benefit')
      .map((r) => ({
        id: r.id,
        title: r.title,
        reason: r.description,
      })),
    procedure: mapPlanToProcedure(result),
    institution: resolveInstitutionFromText(result.plan?.institution) ?? 'zus_or_employer',
    amountNote: result.plan
      ? `Okres (API): ${formatPlanDuration(result.plan)} · stawka ${result.plan.rate_percentage}% — nie decyzja ZUS.`
      : null,
    sourceUrls: ['https://www.zus.pl'],
    legalBasisNote: [
      `FastAPI eligibility/check/${result.benefit_code} · rules_version ${result.rules_version}`,
      `Źródło danych: ${result.data_source}`,
      ...(result.plan?.legal_basis ?? []),
      ...result.warnings,
    ]
      .filter(Boolean)
      .join(' · '),
    requiresVerification:
      result.status === 'requires_verification' || cautious,
  };
}

export function mapPresentationStatus(
  result: EligibilityCheckResult,
): BenefitPresentationStatus {
  const mode = getEligibilityPresentation(result);
  switch (mode) {
    case 'likely_eligible':
      return 'likely_eligible';
    case 'not_eligible':
      return 'not_eligible';
    case 'conditional_plan':
      return 'insufficient_data';
    case 'alternative_path':
      return 'obstacle_with_options';
    default:
      return 'needs_review';
  }
}

function buildSummary(
  result: EligibilityCheckResult,
  status: BenefitPresentationStatus,
  cautious: boolean,
): string {
  if (cautious) {
    return 'Wstępna ocena API — sprawdź ostrzeżenia i potwierdź warunki w ZUS.';
  }
  if (status === 'insufficient_data' && result.missing_data.length) {
    return `Brakuje: ${result.missing_data.join(', ')}.`;
  }
  if (status === 'obstacle_with_options' && result.unmet_conditions.length) {
    return result.unmet_conditions[0] ?? 'Jest przeszkoda — sprawdź możliwe rozwiązania.';
  }
  if (status === 'likely_eligible' && result.plan) {
    return `Na podstawie API: ${formatPlanDuration(result.plan)} · ${result.plan.rate_percentage}%.`;
  }
  if (result.unmet_conditions[0]) return result.unmet_conditions[0];
  return result.benefit_name;
}

function buildRationale(result: EligibilityCheckResult, cautious: boolean): string {
  const parts = [
    `Wynik pochodzi z FastAPI /api/v1/eligibility/check/${result.benefit_code} — to nie jest decyzja ZUS.`,
  ];
  if (cautious) {
    parts.push(
      'Ocena jest uproszczona — nie weryfikuje wszystkich przesłanek prawnych. Nie traktuj statusu jako potwierdzonego prawa do świadczenia.',
    );
  }
  if (result.met_conditions.length) {
    parts.push(`Spełnione: ${result.met_conditions.join('; ')}.`);
  }
  if (result.unmet_conditions.length) {
    parts.push(`Niespełnione: ${result.unmet_conditions.join('; ')}.`);
  }
  if (result.missing_data.length) {
    parts.push(`Brakuje danych: ${result.missing_data.join('; ')}.`);
  }
  if (result.warnings.length) {
    parts.push(`Ostrzeżenia API: ${result.warnings.join(' ')}`);
  }
  return parts.join(' ');
}

function buildConditions(result: EligibilityCheckResult): BenefitCondition[] {
  const met: BenefitCondition[] = result.met_conditions.map((label, i) => ({
    id: `api-met-${i}`,
    label,
    state: 'met',
    explanation: 'Warunek oznaczony jako spełniony przez silnik FastAPI.',
  }));
  const unmet: BenefitCondition[] = result.unmet_conditions.map((label, i) => ({
    id: `api-unmet-${i}`,
    label,
    state: 'unmet',
    explanation: 'Warunek oznaczony jako niespełniony przez silnik FastAPI.',
  }));
  const missing: BenefitCondition[] = result.missing_data.map((label, i) => ({
    id: `api-missing-${i}`,
    label,
    state: 'unknown',
    explanation: 'Brakuje tej informacji do pełnej oceny.',
  }));
  return [...met, ...unmet, ...missing];
}

function mapSolutionToRemedy(
  solution: EligibilityCheckResult['possible_solutions'][number],
  index: number,
): BenefitRemedy {
  const kind = mapSolutionKind(solution.type);
  const related = solution.related_benefit_code?.trim();
  return {
    id: related ? `related-${related}` : `api-sol-${index}`,
    title: related
      ? 'Możliwe inne świadczenie'
      : truncate(solution.description, 80),
    description: solution.description,
    kind,
    affects: 'unknown',
    limitations: [
      'Działanie pochodzi z FastAPI — nie jest gwarancją świadczenia.',
      ...(solution.legal_basis ? [`Podstawa: ${solution.legal_basis}`] : []),
      ...(related ? [`Powiązany kod: ${related}`] : []),
    ],
    ctaLabel: related
      ? 'Sprawdź moje uprawnienia'
      : kind === 'alternative_benefit'
        ? 'Sprawdź możliwe rozwiązania'
        : kind === 'correct_data'
          ? 'Uzupełnij informacje'
          : 'Zobacz szczegóły',
    ctaHref: related
      ? `/eligibility?benefit=${encodeURIComponent(related)}`
      : kind === 'correct_data'
        ? '/onboarding'
        : kind === 'alternative_benefit'
          ? `/benefits/${MATERNITY_ID}/solutions`
          : `/benefits/${MATERNITY_ID}`,
  };
}

function mapSolutionKind(type: string): RemedyKind {
  switch (type) {
    case 'alternative_benefit':
      return 'alternative_benefit';
    case 'corrective_action':
      return 'correct_data';
    case 'limitation':
      return 'institution_contact';
    default:
      return 'institution_contact';
  }
}

function mapPlanToProcedure(
  result: EligibilityCheckResult,
): BenefitAssessment['procedure'] {
  const plan = result.plan;
  if (!plan) return null;

  const docs = plan.required_documents.map((d) => d.name || d.code);
  const formFromDocs = plan.required_documents.find((d) =>
    /zam/i.test(`${d.code} ${d.name}`),
  );

  return {
    formCode: formFromDocs?.code?.toUpperCase().includes('ZAM')
      ? 'ZAM'
      : formFromDocs?.code ?? null,
    documents: docs.length ? docs : ['Dokumenty wg planu API'],
    office: plan.institution,
    submitBy: plan.deadlines[0] ?? null,
    steps: [
      'Sprawdź warunki zwrócone przez silnik uprawnień.',
      ...plan.required_documents.map(
        (d) => `Dokument: ${d.name}${d.when ? ` (${d.when})` : ''}`,
      ),
      ...plan.deadlines.map((d) => `Termin / uwaga: ${d}`),
      'Złóż wniosek we właściwym trybie (w app — tylko symulacja).',
    ],
    simulatedSubmission: true,
  };
}

function resolveNextStep(
  status: BenefitPresentationStatus,
  remedies: BenefitRemedy[],
  cautious: boolean,
): { label: string; href: string } {
  const related = remedies.find((r) => r.ctaHref.includes('/eligibility?'));
  if (status === 'obstacle_with_options' && related) {
    return { label: related.ctaLabel, href: related.ctaHref };
  }
  if (cautious) {
    return {
      label: 'Zobacz ostrzeżenia i szczegóły',
      href: `/eligibility?benefit=${encodeURIComponent('zasilek_w_wysokosci_zasilku_macierzynskiego')}`,
    };
  }
  switch (status) {
    case 'likely_eligible':
      return {
        label: 'Zobacz, jak złożyć wniosek',
        href: `/benefits/${MATERNITY_ID}`,
      };
    case 'obstacle_with_options':
      return {
        label: 'Sprawdź możliwe rozwiązania',
        href: `/benefits/${MATERNITY_ID}/solutions`,
      };
    case 'insufficient_data':
      return { label: 'Uzupełnij informacje', href: '/onboarding' };
    case 'needs_review':
      return {
        label: remedies[0]?.ctaLabel ?? 'Zobacz szczegóły',
        href: remedies[0]?.ctaHref ?? `/benefits/${MATERNITY_ID}`,
      };
    case 'not_eligible':
    default:
      return { label: 'Zobacz szczegóły oceny', href: `/benefits/${MATERNITY_ID}` };
  }
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}
