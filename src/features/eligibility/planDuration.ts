import {
  formatPlanDuration,
  type BenefitPlan,
} from '@/services/api/eligibilityCheckSchemas';

export function planDurationLabel(plan: BenefitPlan | null | undefined): string {
  if (!plan) return 'Brak planu';
  return formatPlanDuration(plan);
}
