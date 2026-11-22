import type { InstitutionId } from '@/types/institutions';

/**
 * Stany prezentacji świadczeń (brief eBobo A–E).
 * Mapowane z statusów backendu — bez lokalnej logiki prawnej.
 */
export type BenefitPresentationStatus =
  | 'likely_eligible' // A
  | 'obstacle_with_options' // B
  | 'not_eligible' // C
  | 'insufficient_data' // D
  | 'needs_review'; // E

export type BenefitConditionState = 'met' | 'unmet' | 'unknown';

export type RemedyKind =
  | 'missing_document'
  | 'correct_data'
  | 'future_change'
  | 'alternative_benefit'
  | 'institution_contact';

export interface BenefitCondition {
  id: string;
  label: string;
  state: BenefitConditionState;
  explanation: string;
}

export interface BenefitRemedy {
  id: string;
  title: string;
  description: string;
  kind: RemedyKind;
  /** Czy działanie dotyczy obecnego, czy dopiero przyszłego uprawnienia. */
  affects: 'current' | 'future' | 'unknown';
  limitations: string[];
  ctaLabel: string;
  ctaHref: string;
}

export interface BenefitAlternative {
  id: string;
  title: string;
  reason: string;
}

export interface BenefitProcedure {
  formCode: string | null;
  documents: string[];
  office: string | null;
  submitBy: string | null;
  steps: string[];
  /** true = tylko demo, nigdy „wysłano do ZUS”. */
  simulatedSubmission: boolean;
}

export interface BenefitAssessment {
  id: string;
  title: string;
  status: BenefitPresentationStatus;
  /** Krótki komunikat zgodny ze stanem A–E. */
  headline: string;
  summary: string;
  rationale: string;
  nextStepLabel: string;
  nextStepHref: string;
  conditions: BenefitCondition[];
  remedies: BenefitRemedy[];
  alternatives: BenefitAlternative[];
  procedure: BenefitProcedure | null;
  /**
   * Instytucja obsługująca świadczenie / wniosek.
   * Jeśli brak — UI wywnioskuje z `procedure.office` lub id świadczenia.
   */
  institution?: InstitutionId | null;
  amountNote: string | null;
  sourceUrls: string[];
  legalBasisNote: string | null;
  requiresVerification: boolean;
  /** Ostrzeżenia z API — pokazywane także przy wyniku pozytywnym. */
  warnings?: string[];
  /** Czy silnik zwrócił plan: null (jawnie). */
  planMissing?: boolean;
}

export const BENEFIT_STATUS_LABEL: Record<BenefitPresentationStatus, string> = {
  likely_eligible: 'Prawdopodobnie spełniasz warunki',
  obstacle_with_options: 'Przeszkoda — sprawdź możliwości',
  not_eligible: 'Nie ustalono drogi do świadczenia',
  insufficient_data: 'Brakuje danych do oceny',
  needs_review: 'Wymagana indywidualna weryfikacja',
};

export const BENEFIT_STATUS_HEADLINE: Record<BenefitPresentationStatus, string> = {
  likely_eligible:
    'Na podstawie podanych informacji spełniasz sprawdzone warunki tego świadczenia.',
  obstacle_with_options:
    'Obecnie nie spełniasz jednego z warunków. Sprawdź, jakie masz możliwości.',
  not_eligible:
    'Na podstawie dostępnych informacji nie znaleźliśmy drogi do uzyskania tego świadczenia w tej sytuacji.',
  insufficient_data:
    'Potrzebujemy jeszcze informacji, żeby sprawdzić Twoje uprawnienie.',
  needs_review:
    'Część warunków ustaliliśmy, ale wynik wymaga potwierdzenia w ZUS lub innej instytucji.',
};

export const BENEFIT_GROUP_ORDER: BenefitPresentationStatus[] = [
  'likely_eligible',
  'obstacle_with_options',
  'insufficient_data',
  'needs_review',
  'not_eligible',
];

export const BENEFIT_GROUP_TITLE: Record<BenefitPresentationStatus, string> = {
  likely_eligible: 'Prawdopodobnie spełniasz warunki',
  obstacle_with_options: 'Przeszkody z możliwymi rozwiązaniami',
  insufficient_data: 'Wymagają uzupełnienia danych',
  needs_review: 'Wymagają indywidualnej weryfikacji',
  not_eligible: 'Nie ustalono uprawnienia',
};

export const REMEDY_KIND_LABEL: Record<RemedyKind, string> = {
  missing_document: 'Brakujący dokument',
  correct_data: 'Korekta danych',
  future_change: 'Zmiana na przyszłość',
  alternative_benefit: 'Inne świadczenie',
  institution_contact: 'Kontakt z instytucją',
};
