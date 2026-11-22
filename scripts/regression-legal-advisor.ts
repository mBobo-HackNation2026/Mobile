/**
 * Regresja: legal-advisor explain — schemat, alignment statusów, puste sekcje.
 * npx --yes tsx scripts/regression-legal-advisor.ts
 */
import {
  isExplainStatusAligned,
  legalAdvisorExplainResponseSchema,
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
  assert(parsed.missing_data_explained.length === 1, 'missing list');
}

/** 3: likely_eligible */
{
  const parsed = legalAdvisorExplainResponseSchema.parse({
    ...base,
    status: 'likely_eligible',
    missing_data_explained: [],
    other_benefits_to_check: [],
  });
  assert(parsed.missing_data_explained.length === 0, 'empty missing ok');
  assert(parsed.other_benefits_to_check.length === 0, 'empty other ok');
}

/** 4: fallback */
{
  const parsed = legalAdvisorExplainResponseSchema.parse({
    ...base,
    source: 'fallback',
    ai_available: false,
  });
  assert(parsed.source === 'fallback', 'fallback source');
}

/** 5: requires_additional_verification */
{
  const parsed = legalAdvisorExplainResponseSchema.parse({
    ...base,
    requires_additional_verification: true,
  });
  assert(parsed.requires_additional_verification, 'extra verification flag');
}

/** 6: empty optional arrays default */
{
  const parsed = legalAdvisorExplainResponseSchema.parse({
    benefit_code: 'urlop_ojcowski',
    status: 'not_eligible',
    explanation: 'Krótki opis.',
  });
  assert(Array.isArray(parsed.suggested_next_steps), 'steps default');
  assert(parsed.verified_legal_basis.length === 0, 'legal default empty');
}

/** 12: alignment — nie nadpisujemy wyniku silnika */
assert(
  isExplainStatusAligned('requires_verification', 'requires_verification'),
  'aligned same',
);
assert(
  !isExplainStatusAligned('likely_eligible', 'not_eligible'),
  'mismatch detected',
);
assert(isExplainStatusAligned(null, 'not_eligible'), 'null engine = skip');
assert(isExplainStatusAligned(undefined, 'ai'), 'undefined engine = skip');

console.log('PASS regression-legal-advisor.ts');
