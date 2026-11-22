import type { ChecklistItem } from '@/types/journey';
import type { PlanTask } from '@/types/plan';

/**
 * Mapuje zadania lokalnego Mój plan → ChecklistItem.
 * Tylko kategorie formalne (zus/admin/deadline) — bez zdrowia DEMO mieszanego jako „prawo ZUS”.
 * Opis zawsze zawiera znacznik źródła DEMO.
 */
export function planTasksToChecklist(tasks: PlanTask[]): ChecklistItem[] {
  return tasks
    .filter((task) => task.category === 'zus' || task.category === 'admin' || task.category === 'deadline')
    .map((task) => ({
      id: `local-plan-${task.id}`,
      title: task.title,
      description: `[Plan lokalny DEMO] Podpowiedź demonstracyjna: ${task.summary} Nie zastępuje oceny z silnika ani decyzji ZUS.`,
      status: task.status,
      dueDate: task.dueDate,
      documents: task.documents,
      office: task.institution,
      officialUrl: task.officialUrl,
      ctaLabel: task.ctaLabel,
      ctaHref: task.ctaHref,
      priority: task.priority,
    }));
}

/** Składa checklistę: najpierw FastAPI, potem lokalne DEMO bez duplikatów po id. */
export function mergeChecklists(
  apiItems: ChecklistItem[],
  localDemoItems: ChecklistItem[],
): ChecklistItem[] {
  const byId = new Map<string, ChecklistItem>();
  for (const item of apiItems) byId.set(item.id, item);
  for (const item of localDemoItems) {
    if (!byId.has(item.id)) byId.set(item.id, item);
  }
  return [...byId.values()];
}
