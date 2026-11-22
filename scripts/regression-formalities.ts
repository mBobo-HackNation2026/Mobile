/**
 * Regresja: deriveFormalities + merge checklist (prawdziwe moduły TS).
 * npx --yes tsx scripts/regression-formalities.ts
 */
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

console.log('PASS regression-formalities.ts');
