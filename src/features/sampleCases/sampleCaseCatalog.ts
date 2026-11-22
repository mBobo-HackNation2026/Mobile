import type { BenefitCode } from '@/services/api/eligibilityCheckSchemas';

/**
 * Przykładowe sprawy do testów jury — zmapowane profile syntetyczne.
 *
 * NIE zawierają oryginalnych PDF-ów spraw ZUS (zakaz rozpowszechniania).
 * To deterministyczne scenariusze wejściowe do eligibility + calculate.
 */

export type SampleCaseKind =
  | 'positive'
  | 'not_eligible'
  | 'insufficient_data'
  | 'other_insurance'
  | 'special';

export type SampleCaseId =
  | 's1_uop_pregnant'
  | 's2_both_parents'
  | 's3_self_employed'
  | 'no_insurance'
  | 'adoption'
  | 'foster'
  | 'preemie'
  | 'stillbirth'
  | 'missing_data_api';

export interface SampleCase {
  id: SampleCaseId;
  /** Id profilu w `demoProfiles` albo null gdy tylko scenariusz API. */
  profileId: string | null;
  title: string;
  kind: SampleCaseKind;
  summary: string;
  /** Co jury ma sprawdzić. */
  checks: string[];
  focusBenefit: BenefitCode;
  /** Orientacyjny wynik — nie gwarancja; do porównania z live API. */
  expectedOrientation: {
    insurance: string;
    eligibility: string;
    amount: string;
    reference: string;
  };
  /** Czy po wczytaniu iść od razu do katalogu 9. */
  runCatalog: boolean;
  /** Opcjonalnie: bezpośredni scenariusz FastAPI z `/eligibility`. */
  apiScenarioId?: string;
}

export const SAMPLE_CASES: SampleCase[] = [
  {
    id: 's1_uop_pregnant',
    profileId: 'pregnant_employee',
    title: 'S1 — Matka, umowa o pracę',
    kind: 'positive',
    summary:
      'Ubezpieczona pracownica w ciąży. Sprawdź katalog 9, macierzyński i kalkulator.',
    checks: [
      'Ubezpieczenie chorobowe w profilu',
      'Ocena macierzyńskiego',
      'Calculate z indywidualną podstawą',
      'Dokumenty / eZUS lub pracodawca',
    ],
    focusBenefit: 'zasilek_macierzynski_urlop_macierzynski',
    expectedOrientation: {
      insurance: 'UoP + ubezpieczenie zadeklarowane',
      eligibility: 'Często likely_eligible przy ubezpieczeniu w dniu porodu',
      amount: 'Orientacyjnie 20 tyg. / 140 dni @ 100% przy typowych założeniach',
      reference:
        'Porównaj z referencją organizatora ręcznie — PDF spraw nie są dystrybuowane w aplikacji.',
    },
    runCatalog: true,
  },
  {
    id: 's2_both_parents',
    profileId: 'both_parents_split',
    title: 'S2 — Oboje rodzice, podział urlopu',
    kind: 'positive',
    summary:
      'Po narodzinach — rodzicielski + porównanie wariantów dla obojga rodziców.',
    checks: [
      'Urlop rodzicielski w katalogu',
      'Compare 3 wariantów',
      'Nieprzenoszalne 9 tyg. (stawka wg BE)',
    ],
    focusBenefit: 'urlop_rodzicielski',
    expectedOrientation: {
      insurance: 'Oboje rodzice ubezpieczeni w profilu',
      eligibility: 'Rodzicielski do sprawdzenia; ojciec niezależnie ojcowski',
      amount: 'Porównanie sum gospodarstwa + stawki wariantów',
      reference: 'Sprawdź ostrzeżenia BE przy 81,5% vs 70% na 9 tyg.',
    },
    runCatalog: true,
  },
  {
    id: 's3_self_employed',
    profileId: 'self_employed',
    title: 'S3 — Działalność gospodarcza',
    kind: 'other_insurance',
    summary: 'Dobrowolne chorobowe, zadłużenie 0 — ocena i dokumenty ZUS.',
    checks: ['Tytuł DG', 'Zadłużenie', 'Formularze ZAM (nie Z-3b)', 'eZUS'],
    focusBenefit: 'zasilek_macierzynski_urlop_macierzynski',
    expectedOrientation: {
      insurance: 'DG + chorobowe zadeklarowane',
      eligibility: 'Zależne od BE; częste warnings formularzy',
      amount: 'Calculate przy podanej podstawie',
      reference: 'Porównaj z przykładem DG organizatora, jeśli dostępny lokalnie.',
    },
    runCatalog: true,
  },
  {
    id: 'no_insurance',
    profileId: 'no_insurance',
    title: 'Brak ubezpieczenia chorobowego',
    kind: 'not_eligible',
    summary: 'Ciąża bez ubezpieczenia — weryfikacja odmowy / art. 30 / braków.',
    checks: [
      'Status not_insured',
      'Brak fikcyjnego „przyznano”',
      'Ewentualne alternatywy (art. 30)',
    ],
    focusBenefit: 'zasilek_macierzynski_urlop_macierzynski',
    expectedOrientation: {
      insurance: 'Brak ubezpieczenia w dniu porodu',
      eligibility: 'not_eligible lub requires_verification / related benefit',
      amount: 'Symulacja kwoty nie zmienia oceny uprawnienia',
      reference: 'Przypadek negatywny / warunkowy — bez PDF w repo.',
    },
    runCatalog: true,
  },
  {
    id: 'missing_data_api',
    profileId: null,
    title: 'Niewystarczające dane (API)',
    kind: 'insufficient_data',
    summary:
      'Scenariusz FastAPI z samym children_count — missing_data, bez wymyślania wyniku.',
    checks: ['missing_data', 'CTA uzupełnij dane', 'Brak fałszywej decyzji'],
    focusBenefit: 'zasilek_macierzynski_urlop_macierzynski',
    expectedOrientation: {
      insurance: 'Nieustalone w requestcie',
      eligibility: 'requires_verification / missing_data',
      amount: 'Calculate może wymagać podstawy',
      reference: 'Scenariusz API #5 z `/eligibility`.',
    },
    runCatalog: false,
    apiScenarioId: 'api-missing-insurance',
  },
  {
    id: 'adoption',
    profileId: 'adoption',
    title: 'Adopcja',
    kind: 'special',
    summary: 'Urlop na warunkach macierzyńskiego — ocena i dokumenty.',
    checks: ['Flaga adopcji', 'Kod urlopu na warunkach', 'Formalności'],
    focusBenefit: 'urlop_na_warunkach_urlopu_macierzynskiego',
    expectedOrientation: {
      insurance: 'Ubezpieczenie opiekuna',
      eligibility: 'Zależne od BE i wieku dziecka',
      amount: 'Okres/kwota z calculate gdy API odpowie',
      reference: 'Bez publikacji dokumentów adopcyjnych.',
    },
    runCatalog: true,
  },
  {
    id: 'foster',
    profileId: 'foster',
    title: 'Rodzina zastępcza',
    kind: 'special',
    summary: 'Piecza zastępcza — osobny wariant urlopu.',
    checks: ['fosterCareType', 'Ocena katalogu', 'Linki oficjalne'],
    focusBenefit: 'urlop_na_warunkach_urlopu_macierzynskiego',
    expectedOrientation: {
      insurance: 'Ubezpieczenie opiekuna',
      eligibility: 'Wymaga potwierdzenia BE',
      amount: 'Jak wyżej',
      reference: 'Profil syntetyczny.',
    },
    runCatalog: true,
  },
  {
    id: 'preemie',
    profileId: 'preemie',
    title: 'S6 — Wcześniak / hospitalizacja',
    kind: 'special',
    summary: 'Uzupełniający urlop macierzyński — tygodnie hospitalizacji.',
    checks: [
      'gestationalWeekAtBirth / hospitalization',
      'uzupelniajacy_urlop_macierzynski',
      'Terminy',
    ],
    focusBenefit: 'uzupelniajacy_urlop_macierzynski',
    expectedOrientation: {
      insurance: 'Ubezpieczona matka po porodzie',
      eligibility: 'Zależne od progów tygodni w BE',
      amount: 'Dodatkowe tygodnie w planie, jeśli silnik je zwróci',
      reference: 'Profil syntetyczny — nie PDF szpitalny.',
    },
    runCatalog: true,
  },
  {
    id: 'stillbirth',
    profileId: 'stillbirth',
    title: 'S7 — Martwe urodzenie',
    kind: 'special',
    summary:
      'Spokojna ścieżka: pogrzebowy / macierzyński wg BE + pomoc charytatywna.',
    checks: [
      'Spokojny ton UI',
      'zasilek_pogrzebowy_martwe_urodzenie',
      'Link ZUS + „Gdzie szukać pomocy”',
    ],
    focusBenefit: 'zasilek_pogrzebowy_martwe_urodzenie',
    expectedOrientation: {
      insurance: 'Zależne od tytułu',
      eligibility: 'Pogrzebowy / ewentualnie macierzyński wg reguł BE',
      amount: 'Ryczałt pogrzebowy gdy calculate zwróci',
      reference: 'Bez dokumentów aktów zgonu w aplikacji.',
    },
    runCatalog: true,
  },
];

export const SAMPLE_CASE_LEGAL_NOTE =
  'Przykładowe sprawy w eBobo to syntetyczne profile i requesty API do testów. Nie publikujemy oryginalnych PDF-ów spraw ZUS objętych zakazem kopiowania i rozpowszechniania. Jeśli masz lokalny dostęp do materiałów organizatora, porównaj wynik silnika z referencją poza aplikacją.';
