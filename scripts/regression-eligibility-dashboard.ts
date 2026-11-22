/**
 * Regresja: liczniki i focus dashboardu Etap 12.
 * npx --yes tsx scripts/regression-eligibility-dashboard.ts
 */
import {
  buildSituationSummary,
  countEligibilityBuckets,
  pickDashboardFocus,
} from '../src/features/plan/eligibilityDashboard';
import type { BenefitAssessment } from '../src/types/benefits';
import type { EligibilityEvaluation, ParentProfile } from '../src/types/journey';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const baseBenefit = (partial: Partial<BenefitAssessment>): BenefitAssessment => ({
  id: 'urlop_rodzicielski',
  title: 'Test',
  status: 'needs_review',
  engineStatus: 'requires_verification',
  headline: 'headline',
  summary: 'summary',
  rationale: 'rationale',
  nextStepLabel: 'Dalej',
  nextStepHref: '/benefits',
  conditions: [],
  remedies: [],
  alternatives: [],
  procedure: null,
  amountNote: null,
  sourceUrls: [],
  legalBasisNote: null,
  requiresVerification: true,
  ...partial,
});

const profile = {
  stage: 'pregnancy',
  role: 'mother',
  eventDate: null,
  employmentType: 'employment_contract',
  insuranceStatus: 'insured',
  hasSecondParent: true,
  childrenCount: 1,
  specialCircumstances: [],
  debtAmountZl: null,
  employmentEndedReason: null,
  otherEmploymentSecured: null,
  fatherInsured: true,
  childAgeMonths: null,
  isPregnant: true,
  insuredDaysContinuous: null,
  childHospitalizationWeeks: null,
  gestationalWeekAtBirth: null,
  birthWeightGrams: null,
  postpartumWeeksElapsed: null,
  isAdoptionOrFosterCare: null,
  fosterCareType: null,
  childAgeYears: null,
  schoolObligationDeferred: null,
  zaZyciemCertificate: null,
  fullDoseClaimedWithin21Days: null,
  otherParentUsedParentalLeaveWeeks: null,
  partTimeFractionDuringParentalLeave: null,
  sicknessBenefitPeriodExhausted: null,
  medicalPrognosisRecoveryPossible: null,
  excludedFromRehabilitationBenefit: null,
  isStillbirthOrInfantDeath: null,
  daysSinceDeath: null,
  daysSinceBurial: null,
  isFullTimeEmployment: true,
  employmentDurationMonths: null,
  onboardingCompleted: true,
  isDemo: false,
  demoScenarioId: null,
} as ParentProfile;

const situation = buildSituationSummary(profile);
assert(situation.title.includes('ciąży'), 'situation stage');
assert(situation.detail?.includes('Umowa o pracę'), 'situation work');

const benefits = [
  baseBenefit({
    id: 'a',
    status: 'likely_eligible',
    engineStatus: 'likely_eligible',
    requiresVerification: false,
  }),
  baseBenefit({
    id: 'b',
    status: 'insufficient_data',
    engineStatus: 'requires_verification',
  }),
  baseBenefit({
    id: 'c',
    status: 'not_eligible',
    engineStatus: 'not_eligible',
    requiresVerification: false,
  }),
  baseBenefit({
    id: 'd',
    status: 'needs_review',
    engineStatus: null,
    headline: 'Nie sprawdzono',
  }),
];

const counts = countEligibilityBuckets(benefits);
assert(counts.likely === 1, 'likely count');
assert(counts.needs_info === 1, 'needs_info count');
assert(counts.not_eligible === 1, 'not_eligible count');
assert(counts.unchecked === 1, 'unchecked count');

const evaluation: EligibilityEvaluation = {
  isDemo: false,
  ruleSetVersion: 'test',
  evaluatedAt: new Date().toISOString(),
  nextAction: {
    title: 'Następne',
    description: 'opis',
    ctaLabel: 'Idź',
    ctaHref: '/benefits',
  },
  upcomingDeadline: null,
  deadlines: [],
  benefits,
  checklist: [],
  relatedBenefits: [],
  deadlineRadar: [],
  postpartumKit: null,
  documentAssistant: {
    applications: [],
    retiredNote: null,
    isDemo: false,
  },
  warnings: [],
  assumptions: [],
  sourceUrls: [],
  missingInputs: ['Potwierdź status ubezpieczenia chorobowego'],
};

const focusMissing = pickDashboardFocus(evaluation);
assert(focusMissing?.source === 'missing_data', 'focus missing_data');
assert(focusMissing?.ctaHref === '/complete-data', 'cta complete-data');

const focusRetry = pickDashboardFocus(null, { hasError: true });
assert(focusRetry?.source === 'retry', 'focus retry on error');

console.log('PASS regression-eligibility-dashboard.ts');
