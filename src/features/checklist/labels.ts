import type { ChecklistPriority, ChecklistStatus } from '@/types/journey';

export const STATUS_LABEL: Record<ChecklistStatus, string> = {
  now: 'Teraz',
  later: 'Później',
  done: 'Wykonane',
};

export const STATUS_TONE: Record<ChecklistStatus, 'primary' | 'neutral' | 'success'> = {
  now: 'primary',
  later: 'neutral',
  done: 'success',
};

export const PRIORITY_LABEL: Record<ChecklistPriority, string> = {
  required: 'Obowiązkowe',
  optional: 'Opcjonalne',
  needs_verification: 'Do weryfikacji',
};

export const PRIORITY_TONE: Record<
  ChecklistPriority,
  'danger' | 'neutral' | 'warning'
> = {
  required: 'danger',
  optional: 'neutral',
  needs_verification: 'warning',
};

export const PRIORITY_ORDER: Record<ChecklistPriority, number> = {
  required: 0,
  needs_verification: 1,
  optional: 2,
};

export function sortChecklistByPriority<
  T extends { priority?: ChecklistPriority; status: ChecklistStatus },
>(items: T[]): T[] {
  const statusOrder: Record<ChecklistStatus, number> = {
    now: 0,
    later: 1,
    done: 2,
  };

  return [...items].sort((a, b) => {
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    const pa = PRIORITY_ORDER[a.priority ?? 'optional'];
    const pb = PRIORITY_ORDER[b.priority ?? 'optional'];
    return pa - pb;
  });
}
