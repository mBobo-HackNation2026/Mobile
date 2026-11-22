import type { BenefitPresentationStatus } from '@/types/benefits';

export const BENEFIT_TONE: Record<
  BenefitPresentationStatus,
  'success' | 'warning' | 'danger' | 'neutral' | 'primary'
> = {
  likely_eligible: 'success',
  obstacle_with_options: 'warning',
  not_eligible: 'neutral',
  insufficient_data: 'primary',
  needs_review: 'warning',
};

/** Negatywny / niejednoznaczny wynik → osobny widok „Szczegóły oceny”. */
export function shouldOpenAssessmentReview(
  status: BenefitPresentationStatus,
): boolean {
  return (
    status === 'not_eligible' ||
    status === 'needs_review' ||
    status === 'insufficient_data' ||
    status === 'obstacle_with_options'
  );
}

export function assessmentReviewHref(benefitId: string): string {
  return `/benefits/${encodeURIComponent(benefitId)}/review`;
}

export const CONDITION_LABEL = {
  met: 'Spełniony',
  unmet: 'Niespełniony',
  unknown: 'Nieznany',
} as const;

export const CONDITION_TONE = {
  met: 'success',
  unmet: 'danger',
  unknown: 'warning',
} as const;
