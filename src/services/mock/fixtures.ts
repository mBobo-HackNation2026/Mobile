import type { MaternityLeaveEligibilityRequest } from '@/services/api/eligibilityCheckSchemas';
import type { ParentProfile } from '@/types/journey';

const baseExtras = {
  debtAmountZl: null as number | null,
  employmentEndedReason: null as ParentProfile['employmentEndedReason'],
  otherEmploymentSecured: null as boolean | null,
  fatherInsured: null as boolean | null,
  childAgeMonths: null as number | null,
  isPregnant: null as boolean | null,
  insuredDaysContinuous: null as number | null,
  childHospitalizationWeeks: null as number | null,
  gestationalWeekAtBirth: null as number | null,
  birthWeightGrams: null as number | null,
  postpartumWeeksElapsed: null as number | null,
  isAdoptionOrFosterCare: null as boolean | null,
  fosterCareType: null as ParentProfile['fosterCareType'],
  childAgeYears: null as number | null,
  schoolObligationDeferred: null as boolean | null,
  zaZyciemCertificate: null as boolean | null,
  fullDoseClaimedWithin21Days: null as boolean | null,
  otherParentUsedParentalLeaveWeeks: null as number | null,
  partTimeFractionDuringParentalLeave: null as number | null,
  sicknessBenefitPeriodExhausted: null as boolean | null,
  medicalPrognosisRecoveryPossible: null as boolean | null,
  excludedFromRehabilitationBenefit: null as boolean | null,
  isStillbirthOrInfantDeath: null as boolean | null,
  daysSinceDeath: null as number | null,
  daysSinceBurial: null as number | null,
  isFullTimeEmployment: null as boolean | null,
  employmentDurationMonths: null as number | null,
};

export const emptyProfile: ParentProfile = {
  stage: null,
  role: null,
  eventDate: null,
  employmentType: null,
  insuranceStatus: null,
  hasSecondParent: null,
  childrenCount: null,
  specialCircumstances: [],
  ...baseExtras,
  onboardingCompleted: false,
  isDemo: false,
  demoScenarioId: null,
};

export const demoProfiles: Record<string, ParentProfile> = {
  pregnant_employee: {
    stage: 'pregnancy',
    role: 'mother',
    eventDate: '2026-06-15',
    employmentType: 'employment_contract',
    insuranceStatus: 'insured',
    hasSecondParent: true,
    childrenCount: 1,
    specialCircumstances: [],
    ...baseExtras,
    onboardingCompleted: true,
    isDemo: true,
    demoScenarioId: 'pregnant_employee',
  },
  both_parents_split: {
    stage: 'after_birth',
    role: 'mother',
    eventDate: '2026-01-10',
    employmentType: 'employment_contract',
    insuranceStatus: 'insured',
    hasSecondParent: true,
    childrenCount: 1,
    specialCircumstances: [],
    ...baseExtras,
    onboardingCompleted: true,
    isDemo: true,
    demoScenarioId: 'both_parents_split',
  },
  no_insurance: {
    stage: 'pregnancy',
    role: 'mother',
    eventDate: '2026-08-01',
    employmentType: 'unemployed',
    insuranceStatus: 'not_insured',
    hasSecondParent: false,
    childrenCount: 1,
    specialCircumstances: [],
    ...baseExtras,
    onboardingCompleted: true,
    isDemo: true,
    demoScenarioId: 'no_insurance',
  },
  self_employed: {
    stage: 'pregnancy',
    role: 'mother',
    eventDate: '2026-05-20',
    employmentType: 'self_employed',
    insuranceStatus: 'insured',
    hasSecondParent: true,
    childrenCount: 1,
    specialCircumstances: [],
    ...baseExtras,
    debtAmountZl: 0,
    onboardingCompleted: true,
    isDemo: true,
    demoScenarioId: 'self_employed',
  },
  adoption: {
    stage: 'adoption',
    role: 'guardian',
    eventDate: '2026-04-01',
    employmentType: 'employment_contract',
    insuranceStatus: 'insured',
    hasSecondParent: true,
    childrenCount: 1,
    specialCircumstances: [],
    ...baseExtras,
    onboardingCompleted: true,
    isDemo: true,
    demoScenarioId: 'adoption',
  },
  foster: {
    stage: 'foster',
    role: 'guardian',
    eventDate: '2026-03-15',
    employmentType: 'employment_contract',
    insuranceStatus: 'insured',
    hasSecondParent: true,
    childrenCount: 1,
    specialCircumstances: [],
    ...baseExtras,
    onboardingCompleted: true,
    isDemo: true,
    demoScenarioId: 'foster',
  },
  exceptional: {
    stage: 'after_birth',
    role: 'father',
    eventDate: '2026-02-14',
    employmentType: 'civil_contract',
    insuranceStatus: 'unknown',
    hasSecondParent: false,
    childrenCount: 2,
    specialCircumstances: ['serious_illness'],
    ...baseExtras,
    onboardingCompleted: true,
    isDemo: true,
    demoScenarioId: 'exceptional',
  },
};

export const DEMO_SCENARIO_META = [
  {
    id: 'pregnant_employee',
    title: 'Pracownica w ciąży',
    description: 'Umowa o pracę, ubezpieczenie chorobowe, termin w czerwcu 2026.',
  },
  {
    id: 'both_parents_split',
    title: 'Oboje rodzice — podział urlopu',
    description: 'Po porodzie, oboje ubezpieczeni, wspólne planowanie urlopów.',
  },
  {
    id: 'no_insurance',
    title: 'Brak ubezpieczenia',
    description: 'Ciąża bez ubezpieczenia chorobowego — weryfikacja innych ścieżek.',
  },
  {
    id: 'self_employed',
    title: 'Działalność gospodarcza',
    description: 'Przedsiębiorczyni z dobrowolnym ubezpieczeniem chorobowym.',
  },
  {
    id: 'adoption',
    title: 'Adopcja',
    description: 'Przyjęcie dziecka — dokumenty i urlopy dla opiekunów.',
  },
  {
    id: 'foster',
    title: 'Rodzina zastępcza',
    description: 'Niezawodowa rodzina zastępcza — ścieżka świadczeń i formalności.',
  },
  {
    id: 'exceptional',
    title: 'Sytuacja wyjątkowa',
    description: 'Ojciec, umowa cywilna, niepewny status ubezpieczenia.',
  },
] as const;

/** Pięć scenariuszy FastAPI — zawsze idą jako prawdziwy request. */
export const API_ELIGIBILITY_DEMO_SCENARIOS: Array<{
  id: string;
  title: string;
  description: string;
  request: MaternityLeaveEligibilityRequest;
  benefitCode?: string;
}> = [
  {
    id: 'api-one-child',
    title: '1. Jedno dziecko',
    description: 'Ubezpieczona w dniu porodu — likely_eligible, 20 tygodni.',
    benefitCode: 'zasilek_macierzynski_urlop_macierzynski',
    request: { children_count: 1, insured_at_birth: true },
  },
  {
    id: 'api-twins',
    title: '2. Bliźniaki',
    description: 'Dwoje dzieci — 31 tygodni.',
    benefitCode: 'zasilek_macierzynski_urlop_macierzynski',
    request: { children_count: 2, insured_at_birth: true },
  },
  {
    id: 'api-ended-insurance',
    title: '3. Ustanie ubezpieczenia w ciąży',
    description:
      'requires_verification + related_benefit_code art. 30 — potem osobna ocena.',
    benefitCode: 'zasilek_macierzynski_urlop_macierzynski',
    request: {
      children_count: 1,
      insured_at_birth: false,
      employment_ended_reason: 'upadlosc_likwidacja_smierc_pracodawcy',
    },
  },
  {
    id: 'api-self-employed',
    title: '4. Działalność gospodarcza',
    description: 'Warnings z API (m.in. formularze).',
    benefitCode: 'zasilek_macierzynski_urlop_macierzynski',
    request: {
      children_count: 1,
      insured_at_birth: true,
      insurance_title: 'dzialalnosc_gospodarcza',
      debt_amount_zl: 0,
    },
  },
  {
    id: 'api-missing-insurance',
    title: '5. Brak statusu ubezpieczenia',
    description: 'Tylko children_count — missing_data + plan warunkowy.',
    benefitCode: 'zasilek_macierzynski_urlop_macierzynski',
    request: { children_count: 1 },
  },
  {
    id: 'api-art30',
    title: '6. Art. 30 (bezpośrednio)',
    description: 'weeks: null + duration_description + warnings (ostrożna prezentacja).',
    benefitCode: 'zasilek_w_wysokosci_zasilku_macierzynskiego',
    request: {
      children_count: 1,
      insured_at_birth: false,
      employment_ended_reason: 'upadlosc_likwidacja_smierc_pracodawcy',
    },
  },
];

export const OFFICIAL_SOURCES = [
  'https://www.zus.pl',
  'https://www.gov.pl/web/rodzina',
] as const;
