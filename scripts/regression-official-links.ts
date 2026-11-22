/**
 * Regresja Etap 15: rejestr oficjalnych linków + kanał płatnika + URL allowlist.
 * npx --yes tsx scripts/regression-official-links.ts
 */
import {
  BENEFIT_CODES,
  type BenefitCode,
} from '../src/services/api/eligibilityCheckSchemas';
import {
  groupLinksByKind,
  isAllowedOfficialUrl,
  linksForBenefit,
  mentionsRetiredForm,
  OFFICIAL_LINKS_BY_BENEFIT,
  resolvePaymentChannel,
  RETIRED_FORM_CODES,
} from '../src/features/benefits/officialLinks';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

let passed = 0;
function ok(msg: string) {
  passed += 1;
  console.log(`PASS: ${msg}`);
}

assert(
  BENEFIT_CODES.length === 9,
  `Oczekiwano 9 kodów, jest ${BENEFIT_CODES.length}`,
);
ok('katalog 9 benefit_code');

for (const code of BENEFIT_CODES) {
  const links = OFFICIAL_LINKS_BY_BENEFIT[code as BenefitCode];
  assert(links?.length >= 2, `${code}: brak min. 2 linków`);
  const kinds = new Set(links.map((l) => l.kind));
  assert(kinds.size >= 2, `${code}: linki powinny mieć ≥2 typy`);
  for (const link of links) {
    assert(link.url.startsWith('https://'), `${link.id}: brak https`);
    assert(isAllowedOfficialUrl(link.url), `${link.id}: host poza allowlist`);
    assert(!link.url.includes('utm_'), `${link.id}: zbędny tracking`);
  }
  ok(`${code}: ${links.length} linków, typy OK`);
}

assert(!isAllowedOfficialUrl('http://www.zus.pl/x'), 'http odrzucony');
assert(!isAllowedOfficialUrl('https://evil.example/x'), 'obcy host odrzucony');
ok('allowlist HTTPS + domeny');

const uop = resolvePaymentChannel({ employmentType: 'employment_contract' });
assert(uop.channel === 'zus_or_employer', 'UoP → zus_or_employer');
const dg = resolvePaymentChannel({ employmentType: 'self_employed' });
assert(dg.channel === 'zus', 'DG → zus');
const fromOffice = resolvePaymentChannel(
  { employmentType: null },
  'Złóż u pracodawcy',
);
assert(fromOffice.channel === 'employer', 'office pracodawca');
ok('resolvePaymentChannel');

const filtered = linksForBenefit('urlop_rodzicielski', 'employer');
assert(
  !filtered.some((l) => l.kind === 'case_status' && l.showWhen?.payerIncludesZus),
  'case_status ZUS ukryty przy samym pracodawcy',
);
ok('filtrowanie linków wg kanału');

const groups = groupLinksByKind(
  OFFICIAL_LINKS_BY_BENEFIT.urlop_rodzicielski,
);
assert(groups.length >= 2, 'groupLinksByKind');
ok('grupowanie rodzajów linków');

assert(mentionsRetiredForm('Forma Z-3b nieaktualna'), 'Z-3b wykryty');
assert(mentionsRetiredForm('ZUR został połączony'), 'ZUR wykryty');
assert(!mentionsRetiredForm('ZAM aktualny'), 'ZAM nie jest retired');
assert(
  !(RETIRED_FORM_CODES as readonly string[]).includes('ZAM'),
  'ZAM poza retired',
);
ok('wycofane formularze');

console.log(`\nregression-official-links: ${passed} checks OK`);
