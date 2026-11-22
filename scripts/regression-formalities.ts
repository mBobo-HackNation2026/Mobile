/**
 * Regresja: deriveFormalities + merge checklist (prawdziwe moduły TS).
 * npx --yes tsx scripts/regression-formalities.ts
 */
import {
  compareHasCalculationDefect,
  hasCalculationDefectWarning,
} from '../src/features/calculator/calculatorPresentation';
import { deriveFormalitiesFromBenefits } from '../src/services/api/deriveFormalitiesFromBenefits';
import {
  mergeChecklists,
  planTasksToChecklist,
} from '../src/features/plan/planTasksToChecklist';
import type { BenefitAssessment } from '../src/types/benefits';
import type { PlanTask } from '../src/types/plan';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const sampleBenefit = {
  id: 'zasilek_macierzynski_urlop_macierzynski',
  title: 'Zasiłek macierzyński',
  status: 'likely_eligible',
  headline: 'ok',
  summary: 'ok',
  rationale: 'ok',
  nextStepLabel: 'Zobacz',
  nextStepHref: '/benefits/zasilek_macierzynski_urlop_macierzynski',
  conditions: [],
  remedies: [],
  alternatives: [],
  procedure: {
    formCode: 'ZAM',
    documents: ['Wniosek ZAM', 'Z-3'],
    office: 'ZUS lub pracodawca',
    submitBy: 'Wniosek przed rozpoczęciem urlopu',
    steps: ['Krok 1'],
    simulatedSubmission: true,
  },
  institution: 'zus_or_employer',
  amountNote: null,
  sourceUrls: [],
  legalBasisNote: null,
  requiresVerification: false,
  warnings: [],
  planMissing: false,
} satisfies BenefitAssessment;

const localTask = {
  id: 'prepare-zam',
  title: 'Przygotuj wniosek ZAM',
  summary: 'Lokalnie',
  category: 'zus',
  kind: 'required',
  bucket: 'now',
  status: 'todo',
  dueDate: '2026-12-01',
  windowLabel: null,
  institution: 'ZUS',
  documents: ['ZAM'],
  steps: [],
  onlinePossible: true,
  officialUrl: null,
  ctaLabel: 'Dokumenty',
  ctaHref: '/documents',
  sourceLabel: 'DEMO',
  verifiedAt: '2026-11-22',
  priority: 'required',
} satisfies PlanTask;

const formalities = deriveFormalitiesFromBenefits([sampleBenefit]);
assert(formalities.checklist.length >= 1, 'API checklist not empty');
assert(
  formalities.checklist[0]?.description.includes('[FastAPI]'),
  'API source marker',
);
assert(formalities.deadlines.length === 0, 'no ISO → no calendar deadline');
assert(formalities.deadlineRadar.length >= 1, 'radar has descriptive term');
assert(
  formalities.documentAssistant.applications.length >= 1,
  'document assistant filled',
);

const local = planTasksToChecklist([localTask]);
assert(local[0]?.description.includes('[Plan lokalny DEMO]'), 'local marker');
assert(local[0]?.id.startsWith('local-plan-'), 'local id prefix');

const merged = mergeChecklists(formalities.checklist, local);
assert(merged.length >= 2, 'merged has api+local');

const emptyApi = mergeChecklists([], local);
assert(emptyApi.length === 1, 'offline/local-only not empty');

/** FE-01 Etap 8: informacyjne ostrzeżenia ≠ defekt wyliczenia. */
assert(
  !hasCalculationDefectWarning([
    'Za nieprzenoszalne 9 tygodni drugiego rodzica przysługuje stawka 70%.',
    'Wariant uśredniony 81,5% dotyczy wniosku o pełny wymiar w 21 dni.',
  ]),
  'informational compare warnings must not flag calc defect',
);
assert(
  hasCalculationDefectWarning([
    'Silnik zastosował 81,5% także do nieprzenoszalnych 9 tygodni (uproszczenie).',
  ]),
  'real rate defect warning must flag',
);
assert(
  !compareHasCalculationDefect({
    total_pool_weeks: 41,
    non_transferable_weeks_per_parent: 9,
    rate_percentage: '81.50',
    variants: [
      {
        label: 'A 32 / B 9',
        weeks_parent_a: 32,
        weeks_parent_b: 9,
        rate_percentage_parent_a: '81.50',
        rate_percentage_parent_b: '70.00',
        amount_parent_a_zl: '100',
        amount_parent_b_zl: '50',
        total_household_amount_zl: '150',
      },
    ],
    warnings: [
      'Za nieprzenoszalne 9 tygodni drugiego rodzica przysługuje stawka 70%.',
    ],
  }),
  'correct 70% on reserved weeks must not be wstępna',
);
assert(
  compareHasCalculationDefect({
    total_pool_weeks: 41,
    non_transferable_weeks_per_parent: 9,
    rate_percentage: '81.50',
    variants: [
      {
        label: 'A 32 / B 9',
        weeks_parent_a: 32,
        weeks_parent_b: 9,
        rate_percentage_parent_a: '81.50',
        rate_percentage_parent_b: '81.50',
        amount_parent_a_zl: '100',
        amount_parent_b_zl: '50',
        total_household_amount_zl: '150',
      },
    ],
    warnings: [],
  }),
  '81.5% on reserved parent B weeks is calc defect',
);

console.log('PASS regression-formalities.ts');
