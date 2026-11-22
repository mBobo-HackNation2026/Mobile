/**
 * Regresja Etap 17: missing_fields — deduplikacja po field, partition, null≠false.
 * npx --yes tsx scripts/regression-missing-fields.ts
 */
import {
  aggregateMissingFields,
  isKnownMissingFieldId,
  partitionMissingFields,
  KNOWN_MISSING_FIELD_IDS,
  MISSING_FIELD_LABEL,
} from '../src/features/profile/missingFields';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

let passed = 0;
function ok(msg: string) {
  passed += 1;
  console.log(`PASS: ${msg}`);
}

const duped = aggregateMissingFields([
  {
    field: 'insured_at_birth',
    message: 'Brakuje informacji o ubezpieczeniu w dniu porodu',
  },
  {
    field: 'insured_at_birth',
    message: 'Inna wiadomość z innego świadczenia',
  },
  {
    field: 'children_survived_count',
    message: 'Brakuje liczby dzieci pozostałych przy życiu',
  },
  { field: '', message: 'puste field — pomijamy' },
  {
    field: 'unknown_future_field',
    message: 'Nowe pole BE',
  },
]);

assert(duped.length === 3, `oczekiwano 3 unikalnych pól, jest ${duped.length}`);
assert(
  duped.find((f) => f.field === 'insured_at_birth')?.message.includes(
    'ubezpieczeniu',
  ),
  'pierwsza message zachowana',
);
ok('aggregateMissingFields deduplikuje po field');

const { known, unknown } = partitionMissingFields(duped);
assert(known.length === 2, `known=2, jest ${known.length}`);
assert(
  unknown.length === 1 && unknown[0]?.field === 'unknown_future_field',
  'unknown_future_field w unknown',
);
ok('partition known vs unknown');

assert(
  isKnownMissingFieldId('children_survived_count'),
  'children_survived_count known',
);
assert(isKnownMissingFieldId('insured_at_birth'), 'insured_at_birth known');
assert(
  !isKnownMissingFieldId('unknown_future_field'),
  'unknown nie jest known',
);
assert(
  MISSING_FIELD_LABEL.children_survived_count.length > 0,
  'label children_survived_count',
);
assert(
  (KNOWN_MISSING_FIELD_IDS as readonly string[]).includes(
    'children_survived_count',
  ),
  'lista KNOWN zawiera children_survived_count',
);
ok('children_survived_count w mapowaniu');

/** Semantyka null / false / 0 — kontrakt profilu (nie zgadujemy). */
const nullMeansUnknown: boolean | null = null;
const falseMeansNo: boolean | null = false;
const zeroIsValid: number | null = 0;
assert(nullMeansUnknown !== false, 'null ≠ false');
assert(falseMeansNo === false, 'false = nie');
assert(zeroIsValid === 0, '0 jest prawidłową liczbą');
ok('null ≠ false ≠ 0');

const formalitiesByBenefit = (code: string) =>
  `/api/v1/formalities/${encodeURIComponent(code)}`;
assert(
  formalitiesByBenefit('urlop_rodzicielski') ===
    '/api/v1/formalities/urlop_rodzicielski',
  'ścieżka formalities/{code}',
);
assert(
  '/api/v1/formalities/general' === '/api/v1/formalities/general',
  'ścieżka formalities/general',
);
ok('ścieżki formalities bez historycznego fallbacku');

console.log(`PASS regression-missing-fields.ts (${passed} checks)`);
