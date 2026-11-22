import {
  differenceInCalendarDays,
  formatISO,
  isValid,
  parseISO,
} from 'date-fns';

import { STAGE_LABELS, type ParentProfile, type ParentStage } from '@/types/journey';
import type { ParentTimeline } from '@/types/plan';

/** Orientacyjny wiek ciąży przy znanej dacie porodu (≈ 40 tyg.). */
export function pregnancyWeekFromDueDate(
  dueDateIso: string,
  today = new Date(),
): number | null {
  const due = parseISO(dueDateIso);
  if (!isValid(due)) return null;
  const daysUntil = differenceInCalendarDays(due, today);
  const week = Math.round(40 - daysUntil / 7);
  if (week < 1) return 1;
  if (week > 42) return 42;
  return week;
}

export function childAgeLabel(
  birthDateIso: string,
  today = new Date(),
): string | null {
  const birth = parseISO(birthDateIso);
  if (!isValid(birth)) return null;
  const days = differenceInCalendarDays(today, birth);
  if (days < 0) return 'Termin w przyszłości — sprawdź datę';
  if (days === 0) return 'Dzień porodu';
  if (days === 1) return 'Dziecko ma 1 dzień';
  if (days < 30) return `Dziecko ma ${days} dni`;
  const months = Math.floor(days / 30);
  if (months === 1) return 'Dziecko ma ok. 1 miesiąc';
  if (months < 24) return `Dziecko ma ok. ${months} miesięcy`;
  const years = Math.floor(months / 12);
  return years === 1 ? 'Dziecko ma ok. 1 rok' : `Dziecko ma ok. ${years} lat`;
}

export function buildTimeline(
  profile: ParentProfile,
  today = new Date(),
): ParentTimeline {
  const stage = profile.stage;
  const stageLabel = stage ? STAGE_LABELS[stage] : 'Uzupełnij ankietę';
  const eventDate = profile.eventDate;

  let progressLabel: string | null = null;
  if (stage === 'pregnancy' && eventDate) {
    const week = pregnancyWeekFromDueDate(eventDate, today);
    progressLabel = week ? `Orientacyjnie ${week}. tydzień ciąży` : null;
  } else if (
    (stage === 'after_birth' || stage === 'adoption' || stage === 'foster') &&
    eventDate
  ) {
    progressLabel = childAgeLabel(eventDate, today);
  } else if (stage === 'planning') {
    progressLabel = 'Etap przygotowań — bez sztywnego terminu porodu';
  }

  return {
    stage,
    stageLabel,
    progressLabel,
    eventDate,
  };
}

export function isoDaysFrom(
  baseIso: string | null,
  days: number,
  fallbackToday = new Date(),
): string {
  const base = baseIso && isValid(parseISO(baseIso)) ? parseISO(baseIso) : fallbackToday;
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return formatISO(d, { representation: 'date' });
}

export function stageOrDefault(stage: ParentStage | null): ParentStage {
  return stage ?? 'pregnancy';
}
