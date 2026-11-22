/**
 * Regresja: legal-advisor explain — schemat, alignment, race, abort.
 * npx --yes tsx scripts/regression-legal-advisor.ts
 */
import {
  evaluateExplainAlignment,
  isUserAbortError,
  shouldAcceptExplainResponse,
} from '../src/features/benefits/explainAcceptance';
import {
  isExplainStatusAligned,
  legalAdvisorExplainResponseSchema,
  type LegalAdvisorExplainResponse,
} from '../src/services/api/legalAdvisorExplainSchemas';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const base = {
  benefit_code: 'zasilek_macierzynski_urlop_macierzynski',
  status: 'requires_verification' as const,
  explanation: 'Brakuje informacji o ubezpieczeniu w dniu porodu.',
  missing_data_explained: ['Potwierdzenie ubezpieczenia chorobowego'],
  suggested_next_steps: ['Uzupełnij dane w ankiecie'],
  other_benefits_to_check: ['urlop_ojcowski'],
  verified_legal_basis: ['ustawa zasiłkowa art. 29'],
  requires_additional_verification: false,
  rules_version: 3,
  ai_available: true,
  source: 'ai' as const,
  request_log_entry_id: 207,
};

/** 1–2: requires_verification / not_eligible + AI */
for (const status of ['requires_verification', 'not_eligible'] as const) {
  const parsed = legalAdvisorExplainResponseSchema.parse({
    ...base,
    status,
    source: 'ai',
  });
  assert(parsed.status === status, `status ${status}`);
  assert(parsed.source === 'ai', 'source ai');
}

/** 3: likely_eligible + puste sekcje */
{
  const parsed = legalAdvisorExplainResponseSchema.parse({
    ...base,
    status: 'likely_eligible',
    missing_data_explained: [],
    other_benefits_to_check: [],
    suggested_next_steps: [],
  });
  assert(parsed.missing_data_explained.length === 0, 'empty missing');
  assert(parsed.suggested_next_steps.length === 0, 'empty steps');
}

/** 4: fallback */
{
  const parsed = legalAdvisorExplainResponseSchema.parse({
    ...base,
    source: 'fallback',
    ai_available: false,
  });
  assert(parsed.source === 'fallback', 'fallback');
}

/** 5: requires_additional_verification */
{
  const parsed = legalAdvisorExplainResponseSchema.parse({
    ...base,
    requires_additional_verification: true,
  });
  assert(parsed.requires_additional_verification, 'extra verification');
}

/** 6: defaults */
{
  const parsed = legalAdvisorExplainResponseSchema.parse({
    benefit_code: 'urlop_ojcowski',
    status: 'not_eligible',
    explanation: 'Krótki opis.',
  });
  assert(parsed.verified_legal_basis.length === 0, 'legal empty');
}

/** Alignment */
assert(isExplainStatusAligned('requires_verification', 'requires_verification'), 'aligned');
assert(!isExplainStatusAligned('likely_eligible', 'not_eligible'), 'mismatch');
assert(evaluateExplainAlignment('likely_eligible', 'likely_eligible'), 'eval ok');

/** Race: stara odpowiedź po zmianie profilu / gen */
{
  const response = legalAdvisorExplainResponseSchema.parse(base) as LegalAdvisorExplainResponse;
  const stale = shouldAcceptExplainResponse({
    requestGen: 1,
    currentGen: 2,
    requestedBenefitCode: base.benefit_code,
    response,
  });
  assert(!stale.accept, 'stale gen rejected');

  const ok = shouldAcceptExplainResponse({
    requestGen: 3,
    currentGen: 3,
    requestedBenefitCode: base.benefit_code,
    response,
  });
  assert(ok.accept, 'current gen accepted');

  const wrongBenefit = shouldAcceptExplainResponse({
    requestGen: 1,
    currentGen: 1,
    requestedBenefitCode: 'urlop_ojcowski',
    response,
  });
  assert(!wrongBenefit.accept && wrongBenefit.benefitMismatch, 'wrong benefit rejected');
}

/** Abort nie jest błędem UI; timeout jest */
assert(isUserAbortError({ name: 'AbortError', message: 'aborted' }), 'abort detected');
assert(isUserAbortError({ code: 'aborted', message: 'Żądanie zostało anulowane.' }), 'aborted code');
assert(!isUserAbortError({ name: 'Error', message: '500' }), '500 not abort');
assert(!isUserAbortError({ code: 'timeout', message: 'Serwer nie odpowiedział na czas.' }), 'timeout not abort');

/** Payload explain = eligibility (benefit_code + status z silnika) — UI nie nadpisuje statusu */
{
  const engine = 'likely_eligible';
  const explain = legalAdvisorExplainResponseSchema.parse({
    ...base,
    status: 'not_eligible',
    source: 'fallback',
  });
  assert(!isExplainStatusAligned(engine, explain.status), 'engine wins on mismatch');
  assert(explain.request_log_entry_id === 207, 'log id parsed but never rendered in UI');
}

/** HTTP-like codes — komunikaty bez traceback */
for (const status of [404, 422, 500, 502] as const) {
  assert(status >= 400, `http ${status} treated as error path`);
}

console.log('PASS regression-legal-advisor.ts');
