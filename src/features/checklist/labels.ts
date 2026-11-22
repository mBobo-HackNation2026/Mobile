import type { ChecklistPriority, ChecklistStatus } from '@/types/journey';

export const STATUS_LABEL: Record<ChecklistStatus, string> = {
  todo: 'Do zrobienia',
  pending: 'W trakcie',
  done: 'Zakończone',
};

export const STATUS_TONE: Record<
  ChecklistStatus,
  'primary' | 'warning' | 'success'
> = {
  todo: 'primary',
  pending: 'warning',
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

/**
 * Kolejność załatwiania: termin (wcześniejszy wyżej), potem priorytet.
 * Status „wykonane” nie przenosi pozycji na dół — kolejność procedury zostaje.
 */
export function sortChecklistByProcedure<
  T extends {
    priority?: ChecklistPriority;
    dueDate?: string | null;
  },
>(items: T[]): T[] {
  return [...items]
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const da = a.item.dueDate ?? null;
      const db = b.item.dueDate ?? null;
      if (da == null && db != null) return -1;
      if (da != null && db == null) return 1;
      if (da != null && db != null && da !== db) {
        return da < db ? -1 : 1;
      }
      const pa = PRIORITY_ORDER[a.item.priority ?? 'optional'];
      const pb = PRIORITY_ORDER[b.item.priority ?? 'optional'];
      if (pa !== pb) return pa - pb;
      return a.index - b.index;
    })
    .map(({ item }) => item);
}

/** @deprecated Użyj sortChecklistByProcedure. */
export function sortChecklistByPriority<
  T extends {
    priority?: ChecklistPriority;
    status: ChecklistStatus;
    dueDate?: string | null;
  },
>(items: T[]): T[] {
  return sortChecklistByProcedure(items);
}
