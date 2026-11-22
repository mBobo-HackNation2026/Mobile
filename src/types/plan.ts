import type { ChecklistPriority, ChecklistStatus, ParentStage } from '@/types/journey';

/** Kategoria wizualna zadania (brief: kolor + etykieta + ikona). */
export type PlanTaskCategory = 'zus' | 'health' | 'admin' | 'deadline';

/** Sekcja chronologiczna na ekranie Mój plan. */
export type PlanBucket = 'now' | 'soon' | 'later' | 'done';

export type PlanTaskKind =
  | 'required'
  | 'conditional'
  | 'optional'
  | 'recommended';

export interface PlanTask {
  id: string;
  title: string;
  summary: string;
  category: PlanTaskCategory;
  kind: PlanTaskKind;
  bucket: PlanBucket;
  status: ChecklistStatus;
  dueDate: string | null;
  windowLabel: string | null;
  institution: string | null;
  documents: string[];
  steps: string[];
  onlinePossible: boolean;
  officialUrl: string | null;
  ctaLabel: string;
  ctaHref: string;
  /** Gdy zadanie dotyczy wyboru placówki. */
  mapHref?: string | null;
  sourceLabel: string;
  verifiedAt: string;
  priority: ChecklistPriority;
}

export interface ParentTimeline {
  stage: ParentStage | null;
  stageLabel: string;
  /** np. „28. tydzień ciąży” albo „dziecko ma 12 dni”. */
  progressLabel: string | null;
  eventDate: string | null;
}

export interface ParentPlan {
  timeline: ParentTimeline;
  tasks: PlanTask[];
  doneCount: number;
  openCount: number;
  nextDeadline: { title: string; date: string } | null;
  isDemo: boolean;
}
