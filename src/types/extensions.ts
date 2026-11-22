import type { InstitutionId } from '@/types/institutions';
import type { ChecklistPriority, ChecklistStatus, ParentStage } from '@/types/journey';

/**
 * Rozszerzenia UX eBobo — dane wyłącznie z API / mocka.
 * Frontend nie ocenia prawa do świadczeń w tych blokach.
 */

/** „Sprawdź również” — karta informacyjna ze źródłem, bez oceny uprawnienia. */
export interface RelatedBenefitHint {
  id: string;
  title: string;
  summary: string;
  /** Dlaczego pokazujemy kartę (temat / etap), nie wynik oceny. */
  whyShown: string;
  officialUrl: string;
  sourceLabel: string;
  /** Instytucja / źródło informacji — monogram w rogu karty. */
  institution?: InstitutionId | null;
  isDemo: boolean;
}

export type DeadlineUrgency = 'overdue' | 'urgent' | 'soon' | 'planned';

/** Radar terminów — urgency i warning liczy backend. */
export interface DeadlineRadarItem {
  id: string;
  title: string;
  submitBy: string;
  urgency: DeadlineUrgency;
  warning: string | null;
  actionLabel: string;
  actionHref: string;
  benefitId: string | null;
  office: string | null;
  isDemo: boolean;
}

/** Pozycja niezbędnika po porodzie / przyjęciu dziecka. */
export interface PostpartumKitItem {
  id: string;
  title: string;
  description: string;
  documents: string[];
  status: ChecklistStatus;
  dueDate: string | null;
  ctaLabel: string;
  ctaHref: string;
  priority: ChecklistPriority;
}

export interface PostpartumKit {
  /** Backend decyduje, czy pokazać blok (np. after_birth / adoption / foster). */
  isApplicable: boolean;
  headline: string;
  stageContext: ParentStage | null;
  items: PostpartumKitItem[];
  sourceUrls: string[];
  isDemo: boolean;
}

export type ApplicationDocumentStatus =
  | 'missing'
  | 'ready'
  | 'optional'
  | 'retired';

/** Dokument powiązany z konkretnym wnioskiem. */
export interface ApplicationDocument {
  id: string;
  title: string;
  formCode: string | null;
  required: boolean;
  status: ApplicationDocumentStatus;
  purpose: string;
  linkedApplicationId: string;
  linkedApplicationTitle: string;
  officialUrl: string | null;
  isDemo: boolean;
}

export interface DocumentApplicationGroup {
  id: string;
  title: string;
  formCode: string | null;
  benefitId: string | null;
  documents: ApplicationDocument[];
}

export interface DocumentAssistantBundle {
  applications: DocumentApplicationGroup[];
  retiredNote: string | null;
  isDemo: boolean;
}

export const DEADLINE_URGENCY_LABEL: Record<DeadlineUrgency, string> = {
  overdue: 'Po terminie',
  urgent: 'Pilne (≤ 7 dni)',
  soon: 'Wkrótce (≤ 21 dni)',
  planned: 'Zaplanowane',
};

export const APPLICATION_DOC_STATUS_LABEL: Record<ApplicationDocumentStatus, string> = {
  missing: 'Do przygotowania',
  ready: 'Gotowy',
  optional: 'Opcjonalny',
  retired: 'Nieaktualny',
};
