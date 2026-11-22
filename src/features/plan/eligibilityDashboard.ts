import { assessmentReviewHref, shouldOpenAssessmentReview } from '@/features/benefits/benefitUi';
import type { BenefitAssessment, BenefitPresentationStatus } from '@/types/benefits';
import type { EligibilityEvaluation, ParentProfile } from '@/types/journey';
import { EMPLOYMENT_LABELS, STAGE_LABELS } from '@/types/journey';

export type EligibilityCountBucket =
  | 'likely'
  | 'needs_info'
  | 'not_eligible'
  | 'unchecked';

export type EligibilityCounts = Record<EligibilityCountBucket, number>;

export type DashboardFocusAction = {
  title: string;
  summary: string;
  ctaLabel: string;
  ctaHref: string;
  source: 'eligibility' | 'formalities' | 'missing_data' | 'retry';
};

const NEEDS_INFO: BenefitPresentationStatus[] = [
  'needs_review',
  'insufficient_data',
  'obstacle_with_options',
];

/** Krótki kontekst z ankiety — bez dopowiadania faktów. */
export function buildSituationSummary(profile: ParentProfile): {
  title: string;
  detail: string | null;
} {
  const stage = profile.stage ? STAGE_LABELS[profile.stage] : 'Sytuacja nieustalona';
  const work = profile.employmentType
    ? EMPLOYMENT_LABELS[profile.employmentType]
    : null;
  const detailParts: string[] = [];
  if (work) detailParts.push(work);
  if (profile.insuranceStatus === 'insured') {
    detailParts.push('ubezpieczenie chorobowe zadeklarowane');
  } else if (profile.insuranceStatus === 'not_insured') {
    detailParts.push('brak ubezpieczenia chorobowego w dniu porodu');
  } else if (profile.insuranceStatus === 'unknown') {
    detailParts.push('status ubezpieczenia nieznany');
  }
  if (profile.childrenCount != null) {
    detailParts.push(
      profile.childrenCount === 1
        ? '1 dziecko w profilu'
        : `${profile.childrenCount} dzieci w profilu`,
    );
  }
  return {
    title: stage,
    detail: detailParts.length ? detailParts.join(' · ') : null,
  };
}

export function countEligibilityBuckets(
  benefits: BenefitAssessment[],
): EligibilityCounts {
  const counts: EligibilityCounts = {
    likely: 0,
    needs_info: 0,
    not_eligible: 0,
    unchecked: 0,
  };
  for (const b of benefits) {
    if (b.engineStatus == null && b.status === 'needs_review') {
      counts.unchecked += 1;
      continue;
    }
    if (b.status === 'likely_eligible') counts.likely += 1;
    else if (b.status === 'not_eligible') counts.not_eligible += 1;
    else if (NEEDS_INFO.includes(b.status)) counts.needs_info += 1;
    else counts.needs_info += 1;
  }
  return counts;
}

/**
 * Jedno główne CTA — priorytet UX (nie reguła prawna):
 * 1) znany termin z formalities/eligibility
 * 2) braki danych możliwe do uzupełnienia
 * 3) formalność przy likely_eligible
 * 4) świadczenie do weryfikacji
 * 5) lista świadczeń / ponów błąd
 */
export function pickDashboardFocus(
  evaluation: EligibilityEvaluation | null,
  opts?: { hasError?: boolean },
): DashboardFocusAction | null {
  if (opts?.hasError && !evaluation) {
    return {
      title: 'Nie udało się sprawdzić uprawnień',
      summary:
        'Brak połączenia z silnikiem nie oznacza odmowy. Spróbuj ponownie — lokalny plan DEMO nie zastępuje oceny.',
      ctaLabel: 'Spróbuj ponownie',
      ctaHref: '/home',
      source: 'retry',
    };
  }

  if (!evaluation) return null;

  const unchecked = evaluation.benefits.filter(
    (b) => b.engineStatus == null && b.status === 'needs_review',
  );
  if (unchecked.length > 0 && evaluation.benefits.every((b) => b.engineStatus == null)) {
    return {
      title: 'Ocena nie doszła do skutku',
      summary: 'Żadne świadczenie nie zostało sprawdzone. Ponów analizę katalogu.',
      ctaLabel: 'Ponów ocenę',
      ctaHref: '/benefits',
      source: 'retry',
    };
  }

  if (evaluation.upcomingDeadline) {
    return {
      title: evaluation.upcomingDeadline.title,
      summary: 'Termin powiązany z planem formalności z oceny uprawnień.',
      ctaLabel: 'Zobacz sprawy',
      ctaHref: '/sprawy',
      source: 'formalities',
    };
  }

  if (evaluation.missingInputs.length > 0) {
    const preview = evaluation.missingInputs.slice(0, 2).join('; ');
    return {
      title: 'Możemy dokładniej sprawdzić Twoje uprawnienia',
      summary: `Do oceny części świadczeń potrzebujemy jeszcze informacji. Przykład: ${preview}.`,
      ctaLabel: 'Uzupełnij dane',
      ctaHref: '/complete-data',
      source: 'missing_data',
    };
  }

  const likelyWithPlan = evaluation.benefits.find(
    (b) => b.status === 'likely_eligible' && b.procedure,
  );
  if (likelyWithPlan) {
    return {
      title: likelyWithPlan.title,
      summary:
        'Na podstawie danych spełniasz sprawdzone warunki — to nie decyzja ZUS. Sprawdź dokumenty i kolejny krok.',
      ctaLabel: likelyWithPlan.nextStepLabel,
      ctaHref: likelyWithPlan.nextStepHref,
      source: 'eligibility',
    };
  }

  const needsReview = evaluation.benefits.find((b) =>
    shouldOpenAssessmentReview(b.status),
  );
  if (needsReview) {
    return {
      title: needsReview.title,
      summary: needsReview.headline,
      ctaLabel: 'Sprawdź szczegóły',
      ctaHref: assessmentReviewHref(needsReview.id),
      source: 'eligibility',
    };
  }

  return {
    title: evaluation.nextAction.title,
    summary: evaluation.nextAction.description,
    ctaLabel: evaluation.nextAction.ctaLabel,
    ctaHref: evaluation.nextAction.ctaHref,
    source: 'eligibility',
  };
}

export const ELIGIBILITY_COUNT_LABEL: Record<EligibilityCountBucket, string> = {
  likely: 'Może Ci przysługiwać',
  needs_info: 'Potrzebujemy więcej informacji',
  not_eligible: 'Warunki obecnie niespełnione',
  unchecked: 'Nie udało się sprawdzić',
};
