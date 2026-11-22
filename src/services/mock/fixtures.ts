import { addDays, formatISO } from 'date-fns';

import type { MaternityLeaveEligibilityRequest } from '@/services/api/eligibilityCheckSchemas';
import type { ParentProfile } from '@/types/journey';

/** Daty demo względem „dziś” — unikamy absurdalnych tygodni ciąży na jury. */
function demoDate(daysFromToday: number): string {
  return formatISO(addDays(new Date(), daysFromToday), { representation: 'date' });
}

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
    eventDate: demoDate(90),
    employmentType: 'employment_contract',
    insuranceStatus: 'insured',
    hasSecondParent: true,
    childrenCount: 1,
    specialCircumstances: [],
    ...baseExtras,
    isPregnant: true,
    isFullTimeEmployment: true,
    fatherInsured: true,
    onboardingCompleted: true,
    isDemo: true,
    demoScenarioId: 'pregnant_employee',
  },
  both_parents_split: {
    stage: 'after_birth',
    role: 'mother',
    eventDate: demoDate(-40),
    employmentType: 'employment_contract',
    insuranceStatus: 'insured',
    hasSecondParent: true,
    childrenCount: 1,
    specialCircumstances: [],
    ...baseExtras,
    isPregnant: false,
    childAgeMonths: 1,
    isFullTimeEmployment: true,
    fatherInsured: true,
    fullDoseClaimedWithin21Days: true,
    onboardingCompleted: true,
    isDemo: true,
    demoScenarioId: 'both_parents_split',
  },
  no_insurance: {
    stage: 'pregnancy',
    role: 'mother',
    eventDate: demoDate(120),
    employmentType: 'unemployed',
    insuranceStatus: 'not_insured',
    hasSecondParent: false,
    childrenCount: 1,
    specialCircumstances: [],
    ...baseExtras,
    isPregnant: true,
    onboardingCompleted: true,
    isDemo: true,
    demoScenarioId: 'no_insurance',
  },
  self_employed: {
    stage: 'pregnancy',
    role: 'mother',
    eventDate: demoDate(75),
    employmentType: 'self_employed',
    insuranceStatus: 'insured',
    hasSecondParent: true,
    childrenCount: 1,
    specialCircumstances: [],
    ...baseExtras,
    debtAmountZl: 0,
    isPregnant: true,
    isFullTimeEmployment: true,
    fatherInsured: true,
    insuredDaysContinuous: 180,
    onboardingCompleted: true,
    isDemo: true,
    demoScenarioId: 'self_employed',
  },
  adoption: {
    stage: 'adoption',
    role: 'guardian',
    eventDate: demoDate(-20),
    employmentType: 'employment_contract',
    insuranceStatus: 'insured',
    hasSecondParent: true,
    childrenCount: 1,
    specialCircumstances: [],
    ...baseExtras,
    isAdoptionOrFosterCare: true,
    fosterCareType: 'wniosek_o_przysposobienie',
    onboardingCompleted: true,
    isDemo: true,
    demoScenarioId: 'adoption',
  },
  foster: {
    stage: 'foster',
    role: 'guardian',
    eventDate: demoDate(-30),
    employmentType: 'employment_contract',
    insuranceStatus: 'insured',
    hasSecondParent: true,
    childrenCount: 1,
    specialCircumstances: [],
    ...baseExtras,
    isAdoptionOrFosterCare: true,
    fosterCareType: 'rodzina_zastepcza',
    onboardingCompleted: true,
    isDemo: true,
    demoScenarioId: 'foster',
  },
  exceptional: {
    stage: 'after_birth',
    role: 'father',
    eventDate: demoDate(-60),
    employmentType: 'civil_contract',
    insuranceStatus: 'unknown',
    hasSecondParent: false,
    childrenCount: 2,
    specialCircumstances: ['serious_illness'],
    ...baseExtras,
    childAgeMonths: 2,
    onboardingCompleted: true,
    isDemo: true,
    demoScenarioId: 'exceptional',
  },
  preemie: {
    stage: 'after_birth',
    role: 'mother',
    eventDate: demoDate(-21),
    employmentType: 'employment_contract',
    insuranceStatus: 'insured',
    hasSecondParent: true,
    childrenCount: 1,
    specialCircumstances: [],
    ...baseExtras,
    isPregnant: false,
    childAgeMonths: 0,
    gestationalWeekAtBirth: 30,
    birthWeightGrams: 1400,
    childHospitalizationWeeks: 5,
    isFullTimeEmployment: true,
    fatherInsured: true,
    onboardingCompleted: true,
    isDemo: true,
    demoScenarioId: 'preemie',
  },
  stillbirth: {
    stage: 'after_birth',
    role: 'mother',
    eventDate: demoDate(-14),
    employmentType: 'employment_contract',
    insuranceStatus: 'insured',
    hasSecondParent: true,
    childrenCount: 0,
    specialCircumstances: [],
    ...baseExtras,
    isStillbirthOrInfantDeath: true,
    daysSinceDeath: 14,
    daysSinceBurial: 10,
    isFullTimeEmployment: true,
    onboardingCompleted: true,
    isDemo: true,
    demoScenarioId: 'stillbirth',
  },
};

export const DEMO_SCENARIO_META = [
  {
    id: 'pregnant_employee',
    title: 'S1 — Pracownica w ciąży (UoP)',
    description:
      'Umowa o pracę, ubezpieczenie chorobowe, termin porodu za ok. 3 miesiące (data względna). Ścieżka: ankieta → świadczenia → plan → dokumenty → kalkulator.',
  },
  {
    id: 'both_parents_split',
    title: 'S2 — Rodzice po narodzinach',
    description:
      'Po porodzie (~6 tyg.), oboje ubezpieczeni. Macierzyński → rodzicielski → porównanie z 9 tyg. drugiego rodzica (70%) → kalkulator.',
  },
  {
    id: 'no_insurance',
    title: 'Brak ubezpieczenia',
    description: 'Ciąża bez ubezpieczenia chorobowego — weryfikacja innych ścieżek.',
  },
  {
    id: 'self_employed',
    title: 'S3 — Działalność gospodarcza',
    description:
      'Przedsiębiorczyni z dobrowolnym ubezpieczeniem chorobowym. Ankieta → ubezpieczenie → świadczenia → dokumenty → weryfikacja.',
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
  {
    id: 'preemie',
    title: 'S6 — Wcześniak',
    description:
      'Poród w 30. tygodniu, hospitalizacja 5 tyg. — uzupełniający urlop macierzyński.',
  },
  {
    id: 'stillbirth',
    title: 'S7 — Martwe urodzenie',
    description:
      'Spokojna ścieżka: zasiłek pogrzebowy / formalności — bez marketingowego tonu.',
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
