import type { PinnedFacilityEvent } from '@/store/useFacilitiesStore';
import type { BenefitDeadline } from '@/types/calendar';
import type { PlanTask } from '@/types/plan';

/** Mapuje datowane zadania planu na terminy kalendarza. */
export function planTasksToDeadlines(tasks: PlanTask[]): BenefitDeadline[] {
  return tasks
    .filter((task) => task.dueDate && task.status !== 'done')
    .map((task) => ({
      id: `plan-${task.id}`,
      title: task.title,
      submitBy: task.dueDate!,
      windowStart: null,
      kind: mapKind(task),
      benefitId: null,
      description: task.summary,
      office: task.institution,
      officialUrl: task.officialUrl,
      relatedChecklistId: task.id,
      isDemo: true as const,
    }));
}

/** Wydarzenia placówek DEMO (np. dzień otwarty) przypięte z mapy. */
export function facilityPinsToDeadlines(
  pins: PinnedFacilityEvent[],
): BenefitDeadline[] {
  return pins.map((pin) => ({
    id: `facility-event-${pin.id}`,
    title: pin.title,
    submitBy: pin.date,
    windowStart: null,
    kind: 'custom' as const,
    benefitId: null,
    description: `${pin.facilityName} · wydarzenie DEMO z mapy pomocy`,
    office: pin.facilityName,
    officialUrl: pin.registrationUrl,
    relatedChecklistId: null,
    isDemo: true as const,
  }));
}

function mapKind(task: PlanTask): BenefitDeadline['kind'] {
  if (task.category === 'zus') return 'benefit_submission';
  if (task.category === 'admin') return 'document';
  if (task.category === 'deadline') return 'follow_up';
  return 'custom';
}

export function mergeDeadlines(
  ...groups: BenefitDeadline[][]
): BenefitDeadline[] {
  const byId = new Map<string, BenefitDeadline>();
  for (const group of groups) {
    for (const item of group) {
      if (!byId.has(item.id)) byId.set(item.id, item);
    }
  }
  return [...byId.values()].sort((a, b) => a.submitBy.localeCompare(b.submitBy));
}
