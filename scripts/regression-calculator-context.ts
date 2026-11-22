/**
 * Regresja Etap 15: kontekst benefit_code w kalkulatorze + href powrotu.
 * npx --yes tsx scripts/regression-calculator-context.ts
 */
import {
  BENEFIT_CODES,
  BENEFIT_CODE_LABEL,
  isKnownBenefitCode,
} from '../src/services/api/eligibilityCheckSchemas';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function calculatorHref(benefitId: string, opts?: { compare?: boolean }): string {
  const q = new URLSearchParams({
    benefit: benefitId,
    from: 'benefit',
  });
  if (opts?.compare) q.set('compare', '1');
  return `/calculator?${q.toString()}`;
}

function resolveBenefitParam(raw: string | undefined): string | null {
  if (!raw) return null;
  return (BENEFIT_CODES as readonly string[]).includes(raw) ? raw : null;
}

let n = 0;
function ok(msg: string) {
  n += 1;
  console.log(`PASS: ${msg}`);
}

for (const code of BENEFIT_CODES) {
  assert(isKnownBenefitCode(code), `isKnownBenefitCode(${code})`);
  assert(BENEFIT_CODE_LABEL[code]?.length > 0, `label ${code}`);
  const href = calculatorHref(code);
  assert(href.includes(`benefit=${code}`), `href benefit ${code}`);
  assert(href.includes('from=benefit'), `href from ${code}`);
  assert(resolveBenefitParam(code) === code, `resolve ${code}`);
}
ok('9 kodów → calculator href z benefit + from');

const parental = calculatorHref('urlop_rodzicielski', { compare: true });
assert(parental.includes('compare=1'), 'compare=1 dla rodzicielskiego');
ok('porównanie rodziców w query');

assert(resolveBenefitParam('nieznany') === null, 'nieznany kod → null');
assert(resolveBenefitParam(undefined) === null, 'brak param → null');
ok('bezpieczne resolveBenefitParam');

/** Null z API nie staje się zerem w prezentacji — kontrakt helperów. */
function displayAmount(total: string | null, lump: string | null): string | null {
  if (total == null && lump == null) return null;
  return total ?? lump;
}
assert(displayAmount(null, null) === null, 'null+null ≠ 0');
assert(displayAmount('123.45', null) === '123.45', 'total zachowany');
assert(displayAmount(null, '1000') === '1000', 'lump zachowany');
ok('null kwoty nie mapujemy na 0');

console.log(`\nregression-calculator-context: ${n} checks OK`);
