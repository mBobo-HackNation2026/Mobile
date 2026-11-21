/**
 * Smoke test: GET /api/v1/health + 5× POST /api/v1/eligibility/check
 * Uruchom: node --env-file=.env scripts/smoke-eligibility-api.mjs
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvFile() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2];
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // ignore
  }
}

loadEnvFile();

const BASE = (
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  'http://localhost:8000'
).replace(/\/$/, '');

const headers = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  ...( /ngrok/i.test(BASE) ? { 'ngrok-skip-browser-warning': 'true' } : {}),
};

const scenarios = [
  {
    id: 'api-one-child',
    title: '1. Jedno dziecko',
    expect: { status: 'likely_eligible', weeks: 20, planNull: false },
    body: { children_count: 1, insured_at_birth: true },
  },
  {
    id: 'api-twins',
    title: '2. Bliźniaki',
    expect: { status: 'likely_eligible', weeks: 31, planNull: false },
    body: { children_count: 2, insured_at_birth: true },
  },
  {
    id: 'api-ended-insurance',
    title: '3. Ustanie ubezpieczenia w ciąży',
    expect: {
      status: 'requires_verification',
      planNull: true,
      minSolutions: 1,
    },
    body: {
      children_count: 1,
      insured_at_birth: false,
      employment_ended_reason: 'upadlosc_likwidacja_smierc_pracodawcy',
    },
  },
  {
    id: 'api-self-employed',
    title: '4. Działalność gospodarcza',
    expect: { status: 'likely_eligible', planNull: false },
    body: {
      children_count: 1,
      insured_at_birth: true,
      insurance_title: 'dzialalnosc_gospodarcza',
      debt_amount_zl: 0,
    },
  },
  {
    id: 'api-missing-insurance',
    title: '5. Brak statusu ubezpieczenia',
    expect: {
      status: 'requires_verification',
      minMissing: 1,
      // plan może być warunkowy (nie null) albo null — nie wymuszamy
    },
    body: { children_count: 1 },
  },
];

function assertShape(result) {
  const required = [
    'benefit_code',
    'benefit_name',
    'status',
    'met_conditions',
    'unmet_conditions',
    'missing_data',
    'possible_solutions',
    'plan',
    'rules_version',
    'warnings',
  ];
  const missing = required.filter((k) => !(k in result));
  return missing;
}

function checkExpect(result, expect) {
  const fails = [];
  if (expect.status && result.status !== expect.status) {
    fails.push(`status: got ${result.status}, want ${expect.status}`);
  }
  if (expect.planNull === true && result.plan != null) {
    fails.push('plan: expected null');
  }
  if (expect.planNull === false && result.plan == null) {
    fails.push('plan: expected object, got null');
  }
  if (expect.weeks != null) {
    const weeks = result.plan?.weeks;
    if (weeks !== expect.weeks) {
      fails.push(`plan.weeks: got ${weeks}, want ${expect.weeks}`);
    }
  }
  if (expect.minSolutions != null) {
    const n = result.possible_solutions?.length ?? 0;
    if (n < expect.minSolutions) {
      fails.push(`possible_solutions: got ${n}, want ≥ ${expect.minSolutions}`);
    }
  }
  if (expect.minMissing != null) {
    const n = result.missing_data?.length ?? 0;
    if (n < expect.minMissing) {
      fails.push(`missing_data: got ${n}, want ≥ ${expect.minMissing}`);
    }
  }
  return fails;
}

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { _raw: text.slice(0, 500) };
  }
  return { ok: res.ok, status: res.status, json };
}

function summarize(result) {
  return {
    status: result.status,
    benefit: result.benefit_name ?? result.benefit_code,
    met: result.met_conditions?.length ?? 0,
    unmet: result.unmet_conditions?.length ?? 0,
    missing: result.missing_data,
    solutions: (result.possible_solutions ?? []).map((s) => s.type),
    plan: result.plan
      ? {
          weeks: result.plan.weeks,
          rate: result.plan.rate_percentage,
          institution: result.plan.institution,
          docs: (result.plan.required_documents ?? []).map((d) => d.code),
        }
      : null,
    warnings: result.warnings,
    rules_version: result.rules_version,
  };
}

console.log(`BASE ${BASE}\n`);

const health = await req('GET', '/api/v1/health');
console.log('=== HEALTH ===');
console.log(JSON.stringify({ http: health.status, body: health.json }, null, 2));
if (!health.ok || health.json?.status !== 'ok') {
  console.error('\nHealth FAILED — przerywam scenariusze.');
  process.exit(1);
}

let failed = 0;
for (const scenario of scenarios) {
  console.log(`\n=== ${scenario.title} (${scenario.id}) ===`);
  console.log('REQUEST', JSON.stringify(scenario.body));
  const res = await req('POST', '/api/v1/eligibility/check', scenario.body);
  if (!res.ok) {
    failed += 1;
    console.log('HTTP', res.status, JSON.stringify(res.json, null, 2));
    continue;
  }
  const shapeMiss = assertShape(res.json);
  const expectFails = checkExpect(res.json, scenario.expect);
  const ok = shapeMiss.length === 0 && expectFails.length === 0;
  if (!ok) failed += 1;
  console.log(ok ? 'PASS' : 'FAIL');
  if (shapeMiss.length) console.log('  missing fields:', shapeMiss.join(', '));
  if (expectFails.length) expectFails.forEach((f) => console.log('  ', f));
  console.log('SUMMARY', JSON.stringify(summarize(res.json), null, 2));
}

console.log(`\n=== DONE: ${scenarios.length - failed}/${scenarios.length} passed ===`);
process.exit(failed ? 1 : 0);
