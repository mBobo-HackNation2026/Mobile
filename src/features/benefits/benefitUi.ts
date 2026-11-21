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
