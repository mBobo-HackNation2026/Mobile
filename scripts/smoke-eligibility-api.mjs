/**
 * Smoke: health + auth + eligibility v2 (oba benefit_code) + related.
 * node scripts/smoke-eligibility-api.mjs
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvFile() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let val = m[2];
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[m[1]]) process.env[m[1]] = val;
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

async function req(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { _raw: text.slice(0, 400) };
  }
  return { ok: res.ok, status: res.status, json };
}

let failed = 0;
function pass(name, ok, detail) {
  if (!ok) failed += 1;
  console.log(ok ? `PASS ${name}` : `FAIL ${name}`, detail ?? '');
}

console.log(`BASE ${BASE}\n`);

const health = await req('GET', '/api/v1/health');
pass('health', health.ok && health.json?.status === 'ok', JSON.stringify(health.json));

if (!health.ok) {
  process.exit(1);
}

const session = await req('POST', '/api/v1/auth/session');
pass(
  'auth/session',
  session.ok && session.json?.status === 'anonymous' && session.json?.access_token,
);
const token = session.json?.access_token;
const userId = session.json?.user_id;

const me1 = await req('GET', '/api/v1/auth/me', null, token);
pass('auth/me anonymous', me1.ok && me1.json?.status === 'anonymous');

const mat = await req(
  'POST',
  '/api/v1/eligibility/check/zasilek_macierzynski_urlop_macierzynski',
  { children_count: 1, insured_at_birth: true },
);
pass(
  'eligibility maternity',
  mat.ok && mat.json?.status === 'likely_eligible' && mat.json?.plan?.weeks === 20,
  `weeks=${mat.json?.plan?.weeks}`,
);

const ended = await req(
  'POST',
  '/api/v1/eligibility/check/zasilek_macierzynski_urlop_macierzynski',
  {
    children_count: 1,
    insured_at_birth: false,
    employment_ended_reason: 'upadlosc_likwidacja_smierc_pracodawcy',
  },
);
const related = ended.json?.possible_solutions?.find((s) => s.related_benefit_code)
  ?.related_benefit_code;
pass(
  'related_benefit_code',
  ended.ok && related === 'zasilek_w_wysokosci_zasilku_macierzynskiego',
  related,
);

const art30 = await req(
  'POST',
  '/api/v1/eligibility/check/zasilek_w_wysokosci_zasilku_macierzynskiego',
  {
    children_count: 1,
    insured_at_birth: false,
    employment_ended_reason: 'upadlosc_likwidacja_smierc_pracodawcy',
  },
);
pass(
  'art30 duration_description',
  art30.ok &&
    art30.json?.plan?.weeks == null &&
    Boolean(art30.json?.plan?.duration_description) &&
    (art30.json?.warnings?.length ?? 0) > 0,
  `dur=${art30.json?.plan?.duration_description}`,
);

const notFound = await req(
  'POST',
  '/api/v1/eligibility/check/nieistniejace_swiadczenie_xyz',
  { children_count: 1, insured_at_birth: true },
);
pass('404 unknown benefit', notFound.status === 404, `http=${notFound.status}`);

const invalid = await req(
  'POST',
  '/api/v1/eligibility/check/zasilek_macierzynski_urlop_macierzynski',
  { children_count: 0, insured_at_birth: true },
);
pass('422 children_count', invalid.status === 422, `http=${invalid.status}`);

const login = await req('POST', '/api/v1/auth/mobywatel/login', {}, token);
pass(
  'mobywatel login',
  login.ok &&
    login.json?.status === 'authenticated' &&
    login.json?.user_id === userId,
  `sameUser=${login.json?.user_id === userId}`,
);

const me2 = await req('GET', '/api/v1/auth/me', null, login.json?.access_token);
pass(
  'auth/me authenticated',
  me2.ok && me2.json?.status === 'authenticated' && me2.json?.first_name,
  me2.json?.first_name,
);

const oldPath = await req('POST', '/api/v1/eligibility/check', {
  children_count: 1,
  insured_at_birth: true,
});
pass('old /eligibility/check gone', oldPath.status === 404 || oldPath.status === 405, `http=${oldPath.status}`);

console.log(`\n=== DONE: failures=${failed} ===`);
process.exit(failed ? 1 : 0);
