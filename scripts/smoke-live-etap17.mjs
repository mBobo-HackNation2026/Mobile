/**
 * Live smoke Etap 17 — S1 macierzyński + S2 porównanie (prawdziwy FastAPI).
 * Nie używa fixture jako wyniku.
 *
 * node scripts/smoke-live-etap17.mjs
 */
const BASE =
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  '';

if (!BASE || BASE.includes('localhost')) {
  console.error('SKIP: ustaw EXPO_PUBLIC_API_URL na publiczny backend (nie localhost).');
  process.exit(2);
}

const headers = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
};

async function req(path, init = {}) {
  const res = await fetch(`${BASE.replace(/\/$/, '')}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers || {}) },
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { status: res.status, json };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const S1_BODY = {
  children_count: 1,
  insured_at_birth: true,
  insurance_title: 'umowa_o_prace',
  is_pregnant: true,
  is_full_time_employment: true,
  father_insured: true,
};

const S2_BODY = {
  children_count: 1,
  insured_at_birth: true,
  insurance_title: 'umowa_o_prace',
  is_pregnant: false,
  child_age_months: 1,
  is_full_time_employment: true,
  father_insured: true,
  full_dose_claimed_within_21_days: true,
};

const BENEFITS = [
  'zasilek_macierzynski_urlop_macierzynski',
  'zasilek_w_wysokosci_zasilku_macierzynskiego',
  'urlop_ojcowski',
  'urlop_rodzicielski',
  'zasilek_chorobowy_w_ciazy',
  'swiadczenie_rehabilitacyjne',
  'uzupelniajacy_urlop_macierzynski',
  'urlop_na_warunkach_urlopu_macierzynskiego',
  'zasilek_pogrzebowy_martwe_urodzenie',
];

async function main() {
  console.log('BASE', BASE);

  const health = await req('/api/v1/health');
  assert(health.status === 200 && health.json?.status === 'ok', 'health');
  console.log('PASS health');

  const formalities = await req(
    '/api/v1/formalities/zasilek_macierzynski_urlop_macierzynski',
  );
  assert(formalities.status === 200, `formalities HTTP ${formalities.status}`);
  assert(
    formalities.json?.benefit_code ===
      'zasilek_macierzynski_urlop_macierzynski',
    'formalities benefit_code',
  );
  assert(Array.isArray(formalities.json?.required_documents), 'documents');
  console.log('PASS formalities/macierzynski');

  const general = await req('/api/v1/formalities/general');
  assert(general.status === 200, `formalities/general ${general.status}`);
  console.log('PASS formalities/general');

  // --- S1 ---
  const code = 'zasilek_macierzynski_urlop_macierzynski';
  const elig = await req(`/api/v1/eligibility/check/${code}`, {
    method: 'POST',
    body: JSON.stringify(S1_BODY),
  });
  assert(elig.status === 200, `S1 eligibility HTTP ${elig.status}`);
  assert(elig.json?.status, 'S1 status');
  assert(Array.isArray(elig.json?.missing_fields), 'S1 missing_fields array');
  console.log('PASS S1 eligibility', elig.json.status, {
    missing: elig.json.missing_fields?.length ?? 0,
  });

  const calc = await req(`/api/v1/benefits/calculate/${code}`, {
    method: 'POST',
    body: JSON.stringify({
      ...S1_BODY,
      average_monthly_income_zl: 6000,
    }),
  });
  assert(calc.status === 200, `S1 calculate HTTP ${calc.status}`);
  assert(
    calc.json?.total_amount_zl != null ||
      calc.json?.lump_sum_amount_zl != null ||
      (Array.isArray(calc.json?.rate_breakdown) &&
        calc.json.rate_breakdown.length > 0),
    'S1 amount present',
  );
  console.log('PASS S1 calculate', {
    amount: calc.json?.total_amount_zl ?? calc.json?.lump_sum_amount_zl,
    days: calc.json?.total_days,
    warnings: calc.json?.warnings?.length ?? 0,
  });

  // 9 checks smoke (S1 profile)
  let okCount = 0;
  for (const b of BENEFITS) {
    const r = await req(`/api/v1/eligibility/check/${b}`, {
      method: 'POST',
      body: JSON.stringify(S1_BODY),
    });
    if (r.status === 200 && r.json?.status) okCount += 1;
    else console.warn('WARN', b, r.status, r.json?.detail ?? r.json);
  }
  assert(okCount === 9, `oczekiwano 9/9 eligibility, jest ${okCount}`);
  console.log('PASS catalog 9/9');

  // --- S2 compare ---
  const parental = await req('/api/v1/eligibility/check/urlop_rodzicielski', {
    method: 'POST',
    body: JSON.stringify(S2_BODY),
  });
  assert(parental.status === 200, `S2 parental HTTP ${parental.status}`);
  console.log('PASS S2 eligibility urlop_rodzicielski', parental.json.status);

  const compare = await req('/api/v1/benefits/compare/urlop-rodzicielski', {
    method: 'POST',
    body: JSON.stringify({
      children_count: 1,
      full_dose_claimed_within_21_days: true,
      parent_a: {
        label: 'Rodzic A',
        average_monthly_income_zl: 6000,
        insurance_title: 'umowa_o_prace',
        is_full_time_employment: true,
      },
      parent_b: {
        label: 'Rodzic B',
        average_monthly_income_zl: 5000,
        insurance_title: 'umowa_o_prace',
        is_full_time_employment: true,
      },
    }),
  });
  assert(compare.status === 200, `S2 compare HTTP ${compare.status}`);
  assert(Array.isArray(compare.json?.variants), 'variants');
  assert(compare.json.variants.length >= 2, '≥2 warianty');
  console.log('PASS S2 compare', {
    variants: compare.json.variants.length,
    rate: compare.json.rate_percentage,
    non_transferable: compare.json.non_transferable_weeks_per_parent,
  });

  const explain = await req(`/api/v1/legal-advisor/explain/${code}`, {
    method: 'POST',
    body: JSON.stringify(S1_BODY),
  });
  assert(
    explain.status === 200 || explain.status === 502 || explain.status === 503,
    `explain unexpected ${explain.status}`,
  );
  if (explain.status === 200) {
    assert(explain.json?.explanation || explain.json?.summary, 'explain text');
    console.log('PASS explain', explain.json?.source ?? 'ok');
  } else {
    console.log('PASS explain degraded', explain.status, '(fallback UI expected)');
  }

  console.log('SMOKE LIVE ETAP17 OK');
}

main().catch((e) => {
  console.error('FAIL', e.message || e);
  process.exit(1);
});
