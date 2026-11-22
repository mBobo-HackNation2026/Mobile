import type { BenefitDeadline } from '@/types/calendar';
import type { BenefitAssessment } from '@/types/benefits';
import type {
  DeadlineRadarItem,
  DocumentAssistantBundle,
  PostpartumKit,
  RelatedBenefitHint,
} from '@/types/extensions';

export type ParentStage =
  | 'planning'
  | 'pregnancy'
  | 'after_birth'
  | 'adoption'
  | 'foster';

export type ParentRole = 'mother' | 'father' | 'partner' | 'guardian';

export type EmploymentType =
  | 'employment_contract'
  | 'civil_contract'
  | 'self_employed'
  | 'unemployed'
  | 'other'
  | 'unknown';

export type InsuranceStatus = 'insured' | 'not_insured' | 'unknown';

export type EmploymentEndedReason =
  | 'upadlosc_likwidacja_smierc_pracodawcy'
  | 'naruszenie_prawa_wyrokiem_sadu';

export type FosterCareType =
  | 'rodzina_zastepcza'
  | 'rodzina_zastepcza_zawodowa'
  | 'wniosek_o_przysposobienie';

/** Do zrobienia | oczekujące (np. na decyzję) | wykonane. */
export type ChecklistStatus = 'todo' | 'pending' | 'done';

/** Mapuje też legacy API/store: now → todo, later → pending. */
export function normalizeChecklistStatus(value: string): ChecklistStatus {
  if (value === 'done') return 'done';
  if (value === 'pending' || value === 'later') return 'pending';
  return 'todo';
}

export interface ParentProfile {
  stage: ParentStage | null;
  role: ParentRole | null;
  eventDate: string | null;
  employmentType: EmploymentType | null;
  insuranceStatus: InsuranceStatus | null;
  hasSecondParent: boolean | null;
  childrenCount: number | null;
  /**
   * Liczba dzieci z tego samego porodu pozostałych przy życiu.
   * Istotne przy martwym urodzeniu / śmierci i children_count > 1 (`children_survived_count`).
   */
  childrenSurvivedCount: number | null;
  specialCircumstances: string[];
  /** Zadłużenie składkowe (PLN) — tylko gdy dotyczy działalności. */
  debtAmountZl: number | null;
  /** Powód ustania zatrudnienia/ubezpieczenia — gdy brak ubezpieczenia w dniu porodu. */
  employmentEndedReason: EmploymentEndedReason | null;
  /** Pola warunkowe silnika (null = nie wiem / nie dotyczy). */
  otherEmploymentSecured: boolean | null;
  fatherInsured: boolean | null;
  childAgeMonths: number | null;
  isPregnant: boolean | null;
  insuredDaysContinuous: number | null;
  childHospitalizationWeeks: number | null;
  gestationalWeekAtBirth: number | null;
  birthWeightGrams: number | null;
  postpartumWeeksElapsed: number | null;
  isAdoptionOrFosterCare: boolean | null;
  fosterCareType: FosterCareType | null;
  childAgeYears: number | null;
  schoolObligationDeferred: boolean | null;
  zaZyciemCertificate: boolean | null;
  fullDoseClaimedWithin21Days: boolean | null;
  otherParentUsedParentalLeaveWeeks: number | null;
  partTimeFractionDuringParentalLeave: number | null;
  sicknessBenefitPeriodExhausted: boolean | null;
  medicalPrognosisRecoveryPossible: boolean | null;
  excludedFromRehabilitationBenefit: boolean | null;
  isStillbirthOrInfantDeath: boolean | null;
  daysSinceDeath: number | null;
  daysSinceBurial: number | null;
  isFullTimeEmployment: boolean | null;
  employmentDurationMonths: number | null;
  onboardingCompleted: boolean;
  isDemo: boolean;
  demoScenarioId: string | null;
}

export type ChecklistPriority = 'required' | 'optional' | 'needs_verification';

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  status: ChecklistStatus;
  dueDate: string | null;
  documents: string[];
  office: string | null;
  officialUrl: string | null;
  ctaLabel: string;
  ctaHref: string;
  priority?: ChecklistPriority;
}

export interface DeadlineItem {
  id: string;
  title: string;
  date: string;
  relatedChecklistId: string | null;
}

export interface EligibilityEvaluation {
  isDemo: boolean;
  ruleSetVersion: string;
  evaluatedAt: string;
  nextAction: {
    title: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
  };
  upcomingDeadline: DeadlineItem | null;
  deadlines: BenefitDeadline[];
  /** Indywidualne oceny świadczeń — źródło prawdy z backendu / mocka. */
  benefits: BenefitAssessment[];
  checklist: ChecklistItem[];
  /** Informacyjne „Sprawdź również” — bez oceny uprawnienia. */
  relatedBenefits: RelatedBenefitHint[];
  /** Radar terminów z urgency / warning z API. */
  deadlineRadar: DeadlineRadarItem[];
  /** Niezbędnik po porodzie / przyjęciu — null gdy backend nie stosuje. */
  postpartumKit: PostpartumKit | null;
  /** Asystent dokumentów powiązanych z wnioskami. */
  documentAssistant: DocumentAssistantBundle;
  warnings: string[];
  assumptions: string[];
  sourceUrls: string[];
  /** Legacy: teksty missing_data (dedup). */
  missingInputs: string[];
  /** Ustrukturyzowane braki z API — dedup po `field`. */
  missingFields: Array<{ field: string; message: string }>;
}

export const STAGE_LABELS: Record<ParentStage, string> = {
  planning: 'Planuję dziecko',
  pregnancy: 'Jestem w ciąży',
  after_birth: 'Dziecko już się urodziło',
  adoption: 'Przyjmuję dziecko na wychowanie',
  foster: 'Rodzina zastępcza',
};

export const ROLE_LABELS: Record<ParentRole, string> = {
  mother: 'Matka',
  father: 'Ojciec',
  partner: 'Partner / partnerka',
  guardian: 'Opiekun',
};

export const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  employment_contract: 'Umowa o pracę',
  civil_contract: 'Umowa zlecenie / o dzieło',
  self_employed: 'Działalność gospodarcza',
  unemployed: 'Bez zatrudnienia',
  other: 'Inna forma',
  unknown: 'Nie wiem / pomiń',
};

export const INSURANCE_LABELS: Record<InsuranceStatus, string> = {
  insured: 'Tak — ubezpieczenie chorobowe w dniu porodu',
  not_insured: 'Nie — potwierdzony brak ubezpieczenia w dniu porodu',
  unknown: 'Nie wiem / pomiń',
};

export const EMPLOYMENT_ENDED_REASON_LABELS: Record<EmploymentEndedReason, string> = {
  upadlosc_likwidacja_smierc_pracodawcy:
    'Upadłość, likwidacja lub śmierć pracodawcy',
  naruszenie_prawa_wyrokiem_sadu:
    'Naruszenie prawa stwierdzone wyrokiem sądu',
};
