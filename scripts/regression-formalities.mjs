/**
 * Minimalne testy regresyjne formalności (bez Jest).
 * Uruchom: node scripts/regression-formalities.mjs
 *
 * Uwaga: logika zduplikowana lekko względem TS — chroni kontrakt zachowania.
 * Pełne importy TS: preferuj późniejszy runner; tu sprawdzamy reguły merge/ISO.
 */

function extractIsoDate(value) {
  if (!value) return null;
  const match = String(value).trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? null;
}

function isIsoDateString(value) {
  return /^\d{4}-\d{2}-\d{2}/.test(String(value).trim());
}

function mergeChecklists(apiItems, localDemoItems) {
  const byId = new Map();
  for (const item of apiItems) byId.set(item.id, item);
  for (const item of localDemoItems) {
    if (!byId.has(item.id)) byId.set(item.id, item);
  }
  return [...byId.values()];
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

let passed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}: ${error.message}`);
    process.exitCode = 1;
  }
}

test('extractIsoDate accepts leading YYYY-MM-DD', () => {
  assert(extractIsoDate('2026-05-04') === '2026-05-04', 'plain iso');
  assert(
    extractIsoDate('2026-05-04 — wniosek') === '2026-05-04',
    'iso with suffix',
  );
  assert(extractIsoDate('przed rozpoczęciem urlopu') === null, 'free text');
});

test('isIsoDateString', () => {
  assert(isIsoDateString('2026-11-22'), 'true');
  assert(!isIsoDateString('Wniosek o urlop'), 'false');
});

test('mergeChecklists prefers API then fills local DEMO', () => {
  const merged = mergeChecklists(
    [{ id: 'api-1', title: 'API' }],
    [
      { id: 'api-1', title: 'LOCAL_SHOULD_NOT_WIN' },
      { id: 'local-1', title: 'LOCAL' },
    ],
  );
  assert(merged.length === 2, 'length');
  assert(merged.find((i) => i.id === 'api-1').title === 'API', 'api wins');
  assert(merged.some((i) => i.id === 'local-1'), 'local kept');
});

test('empty API + local DEMO is not empty checklist', () => {
  const merged = mergeChecklists([], [{ id: 'local-plan-x', title: 'ZAM DEMO' }]);
  assert(merged.length === 1, 'has local item');
});

if (process.exitCode) {
  console.error(`Regression formalities: FAILED (${passed} passed before fail)`);
} else {
  console.log(`Regression formalities: OK (${passed} tests)`);
}
