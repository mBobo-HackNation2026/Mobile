import type { PlanBucket, PlanTaskCategory, PlanTaskKind } from '@/types/plan';
import { colors } from '@/theme';

export const PLAN_CATEGORY_LABEL: Record<PlanTaskCategory, string> = {
  zus: 'ZUS / zasiłki',
  health: 'Zdrowie',
  admin: 'Urząd / formalności',
  deadline: 'Ważny termin',
};

export const PLAN_CATEGORY_COLORS: Record<
  PlanTaskCategory,
  { ink: string; soft: string }
> = {
  zus: { ink: colors.zusNavy, soft: colors.zusNavySoft },
  health: { ink: colors.health, soft: colors.healthSoft },
  admin: { ink: colors.admin, soft: colors.adminSoft },
  deadline: { ink: colors.warning, soft: colors.warningSoft },
};

export const PLAN_BUCKET_LABEL: Record<PlanBucket, string> = {
  now: 'Teraz',
  soon: 'Wkrótce',
  later: 'Później',
  done: 'Zrobione',
};

export const PLAN_KIND_LABEL: Record<PlanTaskKind, string> = {
  required: 'Obowiązkowe',
  conditional: 'Warunkowe',
  optional: 'Opcjonalne',
  recommended: 'Zalecane',
};

export const PLAN_BUCKET_ORDER: PlanBucket[] = ['now', 'soon', 'later', 'done'];
