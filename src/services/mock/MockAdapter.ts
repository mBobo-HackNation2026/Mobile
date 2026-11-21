import {
  addDays,
  differenceInCalendarDays,
  formatISO,
  parseISO,
  startOfDay,
} from 'date-fns';

import type {
  CalculatorResult,
  CalculatorScenarioInput,
  CalculatorService,
  DocumentAnalyzeInput,
  DocumentsService,
  EligibilityService,
  KnowledgeService,
} from '@/services/api/types';
import { OFFICIAL_SOURCES } from '@/services/mock/fixtures';
import type { BenefitAssessment } from '@/types/benefits';
import {
  BENEFIT_STATUS_HEADLINE,
} from '@/types/benefits';
import type { BenefitDeadline } from '@/types/calendar';
import type {
  DeadlineRadarItem,
  DocumentAssistantBundle,
  PostpartumKit,
  RelatedBenefitHint,
} from '@/types/extensions';
import type {
  ChecklistItem,
  EligibilityEvaluation,
  ParentProfile,
} from '@/types/journey';

const RULE_SET_VERSION = 'demo-rules-2026.10.24';

function delay(ms = 350): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function baseDate(profile: ParentProfile): Date {
  if (profile.eventDate) {
    try {
      return parseISO(profile.eventDate);
    } catch {
      return new Date();
    }
  }
  return addDays(new Date(), 90);
}

function buildMissingInputs(profile: ParentProfile): string[] {
  const missing: string[] = [];
  if (!profile.stage) missing.push('etap rodzicielstwa');
  if (!profile.role) missing.push('rola rodzica');
  if (!profile.eventDate) missing.push('data porodu lub przyjęcia dziecka');
  if (!profile.employmentType || profile.employmentType === 'unknown') {
    missing.push('forma zatrudnienia');
  }
  if (!profile.insuranceStatus || profile.insuranceStatus === 'unknown') {
    missing.push('status ubezpieczenia chorobowego');
  }
  return missing;
}

function zamProcedure(submitBy: string | null): BenefitAssessment['procedure'] {
  return {
    formCode: 'ZAM',
    documents: ['ZAM', 'Dokument tożsamości'],
    office: 'ZUS (PUE) lub pracodawca — zależnie od przypadku',
    submitBy,
    steps: [
      'Przygotuj wymagane informacje z ankiety / danych ZUS.',
      'Sprawdź dokumenty i aktualny formularz ZAM.',
      'Uzupełnij lub zweryfikuj dane we wniosku.',
      'Sprawdź termin i adresata.',
      'Złóż wniosek we właściwym trybie (symulacja w demo).',
      'Oznacz krok jako wykonany w planie spraw.',
    ],
    simulatedSubmission: true,
  };
}

/**
 * Fixture ocen świadczeń — jawnie demo.
 * Pionowy scenariusz: 1× likely_eligible + 1× przeszkoda z rozwiązaniami.
 */
function buildBenefits(profile: ParentProfile): BenefitAssessment[] {
  const event = baseDate(profile);
  const zamDue = formatISO(addDays(event, -30), { representation: 'date' });
  const insured = profile.insuranceStatus === 'insured';
  const notInsured = profile.insuranceStatus === 'not_insured';
  const insuranceUnknown =
    !profile.insuranceStatus || profile.insuranceStatus === 'unknown';
  const maternityTitle =
    profile.role === 'father' ? 'Urlop ojcowski / rodzicielski' : 'Zasiłek macierzyński';

  // Stan D — brak danych
  if (insuranceUnknown) {
    return [
      {
        id: 'maternity',
        title: maternityTitle,
        status: 'insufficient_data',
        headline: BENEFIT_STATUS_HEADLINE.insufficient_data,
        summary: 'Brakuje informacji o ubezpieczeniu chorobowym.',
        rationale:
          'Bez statusu ubezpieczenia nie oceniamy uprawnienia negatywnie ani pozytywnie. To nie jest decyzja ZUS.',
        nextStepLabel: 'Uzupełnij informacje',
        nextStepHref: '/onboarding',
        conditions: [
          {
            id: 'c-insurance',
            label: 'Ubezpieczenie chorobowe',
            state: 'unknown',
            explanation: 'Nie podano, czy masz tytuł do ubezpieczenia chorobowego.',
          },
        ],
        remedies: [
          {
            id: 'r-fill-insurance',
            title: 'Uzupełnij status ubezpieczenia w ankiecie',
            description: 'Wróć do ankiety lub użyj symulowanych danych ZUS.',
            kind: 'correct_data',
            affects: 'current',
            limitations: ['Bez tej informacji ocena pozostanie niepełna.'],
            ctaLabel: 'Uzupełnij ankietę',
            ctaHref: '/onboarding',
          },
          {
            id: 'r-zus-mock',
            title: 'Użyj symulowanych danych ZUS',
            description: 'W demo możesz wczytać przykładowy profil ubezpieczeniowy.',
            kind: 'correct_data',
            affects: 'current',
            limitations: ['To atrapa — nie łączy się z prawdziwym kontem ZUS.'],
            ctaLabel: 'Dane ZUS (demo)',
            ctaHref: '/zus',
          },
        ],
        alternatives: [],
        procedure: null,
        amountNote: null,
        sourceUrls: [...OFFICIAL_SOURCES],
        legalBasisNote: `Fixture demo · ${RULE_SET_VERSION}`,
        requiresVerification: false,
      },
    ];
  }

  // Stan B — brak ubezpieczenia, ale możliwe rozwiązania / alternatywy
  if (notInsured) {
    return [
      {
        id: 'maternity',
        title: maternityTitle,
        status: 'obstacle_with_options',
        headline: BENEFIT_STATUS_HEADLINE.obstacle_with_options,
        summary: 'Nie potwierdzono ubezpieczenia chorobowego — to kluczowa przeszkoda.',
        rationale:
          'W fixture demo brak ubezpieczenia chorobowego blokuje typową ścieżkę zasiłku macierzyńskiego. Nie gwarantujemy, że zmiana sytuacji wstecznie da prawo.',
        nextStepLabel: 'Sprawdź możliwe rozwiązania',
        nextStepHref: '/benefits/maternity/solutions',
        conditions: [
          {
            id: 'c-insurance',
            label: 'Ubezpieczenie chorobowe',
            state: 'unmet',
            explanation: 'W ankiecie wskazano brak ubezpieczenia chorobowego.',
          },
          {
            id: 'c-employment',
            label: 'Forma zatrudnienia',
            state: profile.employmentType ? 'met' : 'unknown',
            explanation: profile.employmentType
              ? 'Forma zatrudnienia została podana.'
              : 'Brak danych o zatrudnieniu.',
          },
        ],
        remedies: [
          {
            id: 'r-verify-insurance',
            title: 'Zweryfikuj tytuł ubezpieczenia w ZUS / PUE',
            description:
              'Możliwe, że dane w ankiecie są niekompletne. Potwierdź okresy składek w instytucji.',
            kind: 'institution_contact',
            affects: 'current',
            limitations: [
              'To nie tworzy wstecznie prawa, jeśli tytułu faktycznie nie było.',
              'Wymaga potwierdzenia poza aplikacją.',
            ],
            ctaLabel: 'Jak sprawdzić w ZUS',
            ctaHref: '/zus',
          },
          {
            id: 'r-future-insurance',
            title: 'Rozważ legalne ubezpieczenie na przyszłość',
            description:
              'Niektóre formy objęcie ubezpieczeniem chorobowym mogą wpływać tylko na przyszłe uprawnienia — nie zakładaj skutku wstecznego.',
            kind: 'future_change',
            affects: 'future',
            limitations: [
              'Nie jest gwarancją świadczenia.',
              'Skutki zależą od dat i tytułu — wymaga weryfikacji.',
            ],
            ctaLabel: 'Zobacz ograniczenia',
            ctaHref: '/benefits/maternity/solutions',
          },
          {
            id: 'r-alt-second-parent',
            title: 'Sprawdź uprawnienia drugiego rodzica',
            description:
              'Tam gdzie przepisy na to pozwalają, drugi rodzic może mieć niezależny tytuł — to osobna ocena, nie „obejście”.',
            kind: 'alternative_benefit',
            affects: 'current',
            limitations: ['Wymaga danych o drugim rodzicu i jego ubezpieczeniu.'],
            ctaLabel: 'Ocena alternatywy',
            ctaHref: '/benefits/paternity',
          },
        ],
        alternatives: [
          {
            id: 'paternity',
            title: 'Uprawnienia drugiego rodzica / ojcowskie',
            reason: 'Niezależny tytuł drugiego rodzica może otwierać inną ścieżkę — sprawdź osobno.',
          },
        ],
        procedure: null,
        amountNote: null,
        sourceUrls: [...OFFICIAL_SOURCES],
        legalBasisNote: `Fixture demo · ${RULE_SET_VERSION} · nie jest poradą prawną`,
        requiresVerification: true,
      },
      {
        id: 'paternity',
        title: 'Uprawnienia drugiego rodzica (demo)',
        status: profile.hasSecondParent ? 'insufficient_data' : 'needs_review',
        headline: profile.hasSecondParent
          ? BENEFIT_STATUS_HEADLINE.insufficient_data
          : BENEFIT_STATUS_HEADLINE.needs_review,
        summary: profile.hasSecondParent
          ? 'Potrzebujemy danych o ubezpieczeniu drugiego rodzica.'
          : 'W ankiecie nie wskazano drugiego rodzica — uzupełnij, jeśli dotyczy.',
        rationale:
          'Alternatywa nie oznacza automatycznego prawa. Potrzebna jest osobna ocena tytułu drugiego rodzica.',
        nextStepLabel: 'Uzupełnij informacje',
        nextStepHref: '/onboarding',
        conditions: [
          {
            id: 'c-second',
            label: 'Dane drugiego rodzica',
            state: profile.hasSecondParent ? 'unknown' : 'unmet',
            explanation: profile.hasSecondParent
              ? 'Drugi rodzic jest w planie, ale brak statusu jego ubezpieczenia.'
              : 'Brak drugiego rodzica w ankiecie.',
          },
        ],
        remedies: [
          {
            id: 'r-add-second',
            title: 'Uzupełnij dane o drugim rodzicu',
            description: 'Podaj, czy drugi rodzic jest w planie i jaki ma tytuł ubezpieczenia.',
            kind: 'correct_data',
            affects: 'current',
            limitations: ['Bez danych nie ocenimy niezależnego uprawnienia.'],
            ctaLabel: 'Edytuj ankietę',
            ctaHref: '/onboarding',
          },
        ],
        alternatives: [],
        procedure: null,
        amountNote: null,
        sourceUrls: [...OFFICIAL_SOURCES],
        legalBasisNote: `Fixture demo · ${RULE_SET_VERSION}`,
        requiresVerification: true,
      },
    ];
  }

  // Stan A + B/E — ubezpieczony: macierzyński OK, rodzicielski zależny
  if (insured) {
    const maternity: BenefitAssessment = {
      id: 'maternity',
      title: maternityTitle,
      status: 'likely_eligible',
      headline: BENEFIT_STATUS_HEADLINE.likely_eligible,
      summary:
        'Przy podanym ubezpieczeniu chorobowym spełniasz sprawdzone warunki wstępnej oceny (demo).',
      rationale:
        'Wynik MockAdapter. To nie jest decyzja ZUS — potwierdź w oficjalnym źródle przed złożeniem wniosku.',
      nextStepLabel: 'Zobacz, jak złożyć wniosek',
      nextStepHref: '/benefits/maternity',
      conditions: [
        {
          id: 'c-insurance',
          label: 'Ubezpieczenie chorobowe',
          state: 'met',
          explanation: 'W ankiecie wskazano posiadanie ubezpieczenia chorobowego.',
        },
        {
          id: 'c-stage',
          label: 'Etap rodzicielstwa',
          state: profile.stage ? 'met' : 'unknown',
          explanation: profile.stage
            ? 'Etap rodzicielstwa został podany.'
            : 'Brak etapu — uzupełnij w profilu.',
        },
      ],
      remedies: [],
      alternatives: [],
      procedure: zamProcedure(zamDue),
      amountNote:
        'Kwota i okres: przejdź do kalkulatora (backend). Tu tylko struktura wyniku demo.',
      sourceUrls: [...OFFICIAL_SOURCES],
      legalBasisNote: `Fixture demo · ${RULE_SET_VERSION}`,
      requiresVerification: false,
    };

    const parental: BenefitAssessment = {
      id: 'parental',
      title: 'Urlop / zasiłek rodzicielski',
      status: profile.hasSecondParent ? 'likely_eligible' : 'obstacle_with_options',
      headline: profile.hasSecondParent
        ? BENEFIT_STATUS_HEADLINE.likely_eligible
        : BENEFIT_STATUS_HEADLINE.obstacle_with_options,
      summary: profile.hasSecondParent
        ? 'Możliwy podział urlopu — porównaj warianty w kalkulatorze (backend).'
        : 'Brak danych o drugim rodzicu utrudnia ocenę podziału urlopu.',
      rationale:
        'Ocena demonstracyjna. Podział między rodzicami wymaga potwierdzonych danych obu stron.',
      nextStepLabel: profile.hasSecondParent
        ? 'Zobacz, jak złożyć wniosek'
        : 'Sprawdź możliwe rozwiązania',
      nextStepHref: profile.hasSecondParent
        ? '/benefits/parental'
        : '/benefits/parental/solutions',
      conditions: [
        {
          id: 'c-insurance-p',
          label: 'Ubezpieczenie (wnioskodawca)',
          state: 'met',
          explanation: 'Ubezpieczenie chorobowe wskazane w ankiecie.',
        },
        {
          id: 'c-second-p',
          label: 'Sytuacja drugiego rodzica',
          state: profile.hasSecondParent ? 'met' : 'unmet',
          explanation: profile.hasSecondParent
            ? 'Drugi rodzic jest uwzględniony w planie.'
            : 'Nie wskazano drugiego rodzica — utrudnia to ocenę podziału.',
        },
      ],
      remedies: profile.hasSecondParent
        ? []
        : [
            {
              id: 'r-add-co-parent',
              title: 'Uzupełnij dane drugiego rodzica',
              description: 'Jeśli drugi rodzic jest w sprawie, dodaj go w ankiecie.',
              kind: 'correct_data',
              affects: 'current',
              limitations: ['Bez danych nie ocenimy podziału urlopu.'],
              ctaLabel: 'Edytuj ankietę',
              ctaHref: '/onboarding',
            },
            {
              id: 'r-solo-path',
              title: 'Kontynuuj ścieżkę jednego rodzica',
              description:
                'Możesz iść dalej samotnie — sprawdź, które dokumenty i terminy dotyczą tylko Ciebie.',
              kind: 'alternative_benefit',
              affects: 'current',
              limitations: ['Niektóre warianty podziału mogą być niedostępne.'],
              ctaLabel: 'Zobacz wniosek ZAM',
              ctaHref: '/benefits/maternity',
            },
          ],
      alternatives: [],
      procedure: zamProcedure(zamDue),
      amountNote: 'Porównanie wariantów: kalkulator (API).',
      sourceUrls: [...OFFICIAL_SOURCES],
      legalBasisNote: `Fixture demo · ${RULE_SET_VERSION}`,
      requiresVerification: !profile.hasSecondParent,
    };

    return [maternity, parental];
  }

  return [
    {
      id: 'maternity',
      title: maternityTitle,
      status: 'needs_review',
      headline: BENEFIT_STATUS_HEADLINE.needs_review,
      summary: 'Dane są niepełne lub nietypowe — potrzebna weryfikacja.',
      rationale: 'Mock nie rozstrzyga tej konfiguracji bezpiecznie.',
      nextStepLabel: 'Uzupełnij informacje',
      nextStepHref: '/onboarding',
      conditions: [],
      remedies: [],
      alternatives: [],
      procedure: null,
      amountNote: null,
      sourceUrls: [...OFFICIAL_SOURCES],
      legalBasisNote: `Fixture demo · ${RULE_SET_VERSION}`,
      requiresVerification: true,
    },
  ];
}

function buildChecklist(profile: ParentProfile): ChecklistItem[] {
  const event = baseDate(profile);
  const zamDue = formatISO(addDays(event, -30), { representation: 'date' });
  const afterDue = formatISO(addDays(event, 14), { representation: 'date' });

  const insuranceUnknown =
    !profile.insuranceStatus || profile.insuranceStatus === 'unknown';

  const items: ChecklistItem[] = [
    {
      id: 'check-insurance',
      title: 'Sprawdź tytuł do ubezpieczenia chorobowego',
      description:
        'Bez potwierdzenia składek nie da się wiarygodnie ocenić zasiłku — to warunek wejściowy.',
      status: profile.insuranceStatus === 'insured' ? 'done' : 'now',
      dueDate: null,
      documents: [],
      office: 'ZUS / PUE ZUS',
      officialUrl: 'https://www.zus.pl',
      ctaLabel: 'Zobacz uprawnienia',
      ctaHref: '/benefits',
      priority: insuranceUnknown ? 'needs_verification' : 'required',
    },
    {
      id: 'prepare-zam',
      title: 'Przygotuj wniosek ZAM',
      description:
        'Aktualny formularz po 24.10.2026 (ZUR/ZAO → ZAM). Bez wniosku nie uruchomisz wypłaty.',
      status: 'now',
      dueDate: zamDue,
      documents: ['ZAM'],
      office: 'ZUS lub pracodawca',
      officialUrl: 'https://www.zus.pl',
      ctaLabel: 'Przejdź do dokumentów',
      ctaHref: '/documents',
      priority: 'required',
    },
    {
      id: 'plan-leave-split',
      title: 'Zaplanuj podział urlopów',
      description:
        'Pomaga ustalić, kto kiedy korzysta z urlopu — kwoty policzy backend, gdy będzie dostępny.',
      status: profile.hasSecondParent ? 'now' : 'later',
      dueDate: formatISO(addDays(event, -14), { representation: 'date' }),
      documents: [],
      office: null,
      officialUrl: null,
      ctaLabel: 'Otwórz kalendarz',
      ctaHref: '/calendar',
      priority: profile.hasSecondParent ? 'optional' : 'needs_verification',
    },
    {
      id: 'notify-employer',
      title: 'Poinformuj pracodawcę o terminach',
      description: 'Pracodawca musi wiedzieć o wnioskach i terminach urlopu w firmie.',
      status: 'later',
      dueDate: formatISO(addDays(event, -21), { representation: 'date' }),
      documents: ['ZAM'],
      office: 'Pracodawca',
      officialUrl: null,
      ctaLabel: 'Otwórz checklistę',
      ctaHref: '/plan',
      priority:
        profile.employmentType === 'employment_contract' ||
        profile.employmentType === 'self_employed'
          ? 'required'
          : 'needs_verification',
    },
    {
      id: 'after-event-followup',
      title:
        profile.stage === 'adoption' || profile.stage === 'foster'
          ? 'Po przyjęciu dziecka — domknij dokumenty'
          : 'Po porodzie — sprawdź kolejne kroki',
      description: 'Domknięcie wniosków po wydarzeniu zmniejsza ryzyko spóźnionych terminów.',
      status: 'later',
      dueDate: afterDue,
      documents: ['ZAM'],
      office: 'ZUS',
      officialUrl: 'https://www.zus.pl',
      ctaLabel: 'Zobacz checklistę',
      ctaHref: '/plan',
      priority: 'required',
    },
  ];

  if (profile.stage === 'planning') {
    return [
      {
        id: 'learn-benefits',
        title: 'Poznaj dostępne świadczenia',
        description: 'Na etapie planowania zbierz wymagania i oficjalne źródła — bez pośpiechu.',
        status: 'now',
        dueDate: null,
        documents: [],
        office: null,
        officialUrl: 'https://www.zus.pl',
        ctaLabel: 'Przeglądaj świadczenia',
        ctaHref: '/benefits',
        priority: 'optional',
      },
      ...items.slice(0, 2).map((item) => ({ ...item, status: 'later' as const })),
    ];
  }

  return items;
}

function buildDeadlines(profile: ParentProfile): BenefitDeadline[] {
  const event = baseDate(profile);
  const zamDue = formatISO(addDays(event, -30), { representation: 'date' });
  const employerDue = formatISO(addDays(event, -21), { representation: 'date' });
  const leavePlanDue = formatISO(addDays(event, -14), { representation: 'date' });
  const afterDue = formatISO(addDays(event, 14), { representation: 'date' });
  const parentalDue = formatISO(addDays(event, 21), { representation: 'date' });

  const deadlines: BenefitDeadline[] = [
    {
      id: 'dl-zam',
      title: 'Złożenie wniosku ZAM',
      submitBy: zamDue,
      windowStart: formatISO(addDays(event, -60), { representation: 'date' }),
      kind: 'benefit_submission',
      benefitId: 'maternity',
      description:
        'Termin demonstracyjny na przygotowanie i złożenie ZAM (aktualny formularz). Zweryfikuj datę w oficjalnym źródle.',
      office: 'ZUS lub pracodawca',
      officialUrl: 'https://www.zus.pl',
      relatedChecklistId: 'prepare-zam',
      isDemo: true,
    },
    {
      id: 'dl-employer',
      title: 'Informacja do pracodawcy',
      submitBy: employerDue,
      windowStart: null,
      kind: 'employer',
      benefitId: null,
      description: 'Ustal w firmie, kiedy i jak przekazać wniosek oraz dokumenty.',
      office: 'Pracodawca',
      officialUrl: null,
      relatedChecklistId: 'notify-employer',
      isDemo: true,
    },
    {
      id: 'dl-leave-plan',
      title: 'Decyzja o podziale urlopów',
      submitBy: leavePlanDue,
      windowStart: null,
      kind: 'follow_up',
      benefitId: 'parental',
      description:
        'Do tej daty warto mieć wstępny plan podziału — kwoty policzy backend kalkulatora.',
      office: null,
      officialUrl: null,
      relatedChecklistId: 'plan-leave-split',
      isDemo: true,
    },
    {
      id: 'dl-after-event',
      title:
        profile.stage === 'adoption' || profile.stage === 'foster'
          ? 'Domknięcie wniosków po przyjęciu dziecka'
          : 'Wnioski po porodzie',
      submitBy: afterDue,
      windowStart: formatISO(event, { representation: 'date' }),
      kind: 'document',
      benefitId: 'maternity',
      description: 'Okno demonstracyjne na domknięcie dokumentów po wydarzeniu.',
      office: 'ZUS',
      officialUrl: 'https://www.zus.pl',
      relatedChecklistId: 'after-event-followup',
      isDemo: true,
    },
    {
      id: 'dl-parental-window',
      title: 'Okno na wniosek o rodzicielski',
      submitBy: parentalDue,
      windowStart: formatISO(addDays(event, 1), { representation: 'date' }),
      kind: 'benefit_submission',
      benefitId: 'parental',
      description:
        'Demonstracyjny termin końca okna na złożenie / kontynuację rodzicielskiego. Nie jest decyzją ZUS.',
      office: 'ZUS / PUE ZUS',
      officialUrl: 'https://www.zus.pl',
      relatedChecklistId: null,
      isDemo: true,
    },
  ];

  if (profile.stage === 'planning') {
    return deadlines.slice(0, 2).map((item) => ({
      ...item,
      description: `${item.description} (etap planowania — daty orientacyjne).`,
    }));
  }

  if (profile.insuranceStatus === 'not_insured') {
    return [
      {
        id: 'dl-verify-insurance',
        title: 'Weryfikacja tytułu ubezpieczenia',
        submitBy: formatISO(addDays(new Date(), 14), { representation: 'date' }),
        windowStart: null,
        kind: 'follow_up',
        benefitId: 'maternity',
        description:
          'Bez ubezpieczenia chorobowego najpierw sprawdź inne ścieżki — termin przypomina o weryfikacji, nie o złożeniu zasiłku.',
        office: 'ZUS',
        officialUrl: 'https://www.zus.pl',
        relatedChecklistId: 'check-insurance',
        isDemo: true,
      },
      ...deadlines.filter((d) => d.id === 'dl-employer'),
    ];
  }

  return deadlines;
}

/** Informacyjne karty — bez oceny uprawnienia (to robi silnik reguł backendu). */
function buildRelatedBenefits(profile: ParentProfile): RelatedBenefitHint[] {
  const stageHint =
    profile.stage === 'planning'
      ? 'Etap planowania — warto znać oficjalne źródła z wyprzedzeniem.'
      : profile.stage === 'after_birth' || profile.stage === 'adoption' || profile.stage === 'foster'
        ? 'Po wydarzeniu rodzicielskim często sprawdzane są też inne formy wsparcia.'
        : 'Przy ciąży / urlopie warto znać powiązane świadczenia poza zasiłkiem ZUS.';

  return [
    {
      id: 'hint-800plus',
      title: 'Świadczenie wychowawcze (800+)',
      summary:
        'Świadczenie wypłacane przez ZUS na dziecko — warunki i wnioski opisuje oficjalny serwis.',
      whyShown: stageHint,
      officialUrl: 'https://www.gov.pl/web/rodzina/swiadczenie-wychowawcze-800-plus',
      sourceLabel: 'gov.pl / rodzina',
      institution: 'zus',
      isDemo: true,
    },
    {
      id: 'hint-becikowe',
      title: 'Jednorazowa zapomoga z tytułu urodzenia dziecka',
      summary:
        'Potocznie „becikowe” — zasady i właściwą instytucję sprawdź w oficjalnym źródle.',
      whyShown: 'Tematycznie powiązane z narodzinami / przyjęciem dziecka — bez oceny Twojego prawa.',
      officialUrl: 'https://www.gov.pl/web/rodzina',
      sourceLabel: 'gov.pl / rodzina',
      institution: 'municipality',
      isDemo: true,
    },
    {
      id: 'hint-zus-rodzic',
      title: 'Poradnik ZUS dla rodziców',
      summary:
        'Zbiorcze informacje ZUS o zasiłkach i urlopach związanych z rodzicielstwem.',
      whyShown: 'Oficjalne kompendium — zawsze weryfikuj aktualność formularzy (ZAM).',
      officialUrl: 'https://www.zus.pl',
      sourceLabel: 'zus.pl',
      institution: 'zus',
      isDemo: true,
    },
  ];
}

/** Urgency liczymy tu tylko jako mock backendu — nie w UI. */
function buildDeadlineRadar(deadlines: BenefitDeadline[]): DeadlineRadarItem[] {
  const today = startOfDay(new Date());

  return [...deadlines]
    .map((deadline) => {
      const days = differenceInCalendarDays(parseISO(deadline.submitBy), today);
      let urgency: DeadlineRadarItem['urgency'] = 'planned';
      let warning: string | null = null;

      if (days < 0) {
        urgency = 'overdue';
        warning = 'Termin z fixture demo już minął — sprawdź aktualny termin w oficjalnym źródle.';
      } else if (days <= 7) {
        urgency = 'urgent';
        warning = `Zostało ${days} dni (demo). Przygotuj dokumenty i potwierdź adresata.`;
      } else if (days <= 21) {
        urgency = 'soon';
        warning = 'Termin zbliża się — warto zebrać załączniki wcześniej.';
      }

      return {
        id: deadline.id,
        title: deadline.title,
        submitBy: deadline.submitBy,
        urgency,
        warning,
        actionLabel:
          deadline.relatedChecklistId != null
            ? 'Otwórz sprawę'
            : deadline.benefitId
              ? 'Szczegóły świadczenia'
              : 'Kalendarz',
        actionHref: deadline.benefitId
          ? `/benefits/${deadline.benefitId}`
          : deadline.relatedChecklistId
            ? '/sprawy'
            : '/calendar',
        benefitId: deadline.benefitId,
        office: deadline.office,
        isDemo: true as const,
      };
    })
    .sort((a, b) => {
      const order = { overdue: 0, urgent: 1, soon: 2, planned: 3 };
      const byUrgency = order[a.urgency] - order[b.urgency];
      if (byUrgency !== 0) return byUrgency;
      return a.submitBy.localeCompare(b.submitBy);
    });
}

function buildPostpartumKit(profile: ParentProfile): PostpartumKit {
  const applicable =
    profile.stage === 'after_birth' ||
    profile.stage === 'adoption' ||
    profile.stage === 'foster';

  if (!applicable) {
    return {
      isApplicable: false,
      headline: 'Niezbędnik pojawi się po zmianie etapu na okres po porodzie / przyjęciu dziecka.',
      stageContext: profile.stage,
      items: [],
      sourceUrls: [...OFFICIAL_SOURCES],
      isDemo: true,
    };
  }

  const event = baseDate(profile);
  const isAdoptionLike = profile.stage === 'adoption' || profile.stage === 'foster';

  return {
    isApplicable: true,
    headline: isAdoptionLike
      ? 'Niezbędnik po przyjęciu dziecka — sprawy i dokumenty (demo)'
      : 'Niezbędnik po porodzie — sprawy i dokumenty (demo)',
    stageContext: profile.stage,
    items: [
      {
        id: 'pp-birth-cert',
        title: isAdoptionLike
          ? 'Dokumenty potwierdzające przyjęcie dziecka'
          : 'Akt urodzenia / odpis',
        description:
          'Potrzebny przy wielu wnioskach. To przypomnienie checklisty — nie ocena uprawnienia.',
        documents: isAdoptionLike
          ? ['Orzeczenie / decyzja', 'Dokument tożsamości']
          : ['Akt urodzenia', 'Dokument tożsamości'],
        status: 'now',
        dueDate: formatISO(addDays(event, 7), { representation: 'date' }),
        ctaLabel: 'Asystent dokumentów',
        ctaHref: '/documents',
        priority: 'required',
      },
      {
        id: 'pp-zam-followup',
        title: 'Domknij wniosek ZAM (jeśli dotyczy)',
        description:
          'Sprawdź, czy wniosek i załączniki są kompletne. Formularze: aktualny ZAM.',
        documents: ['ZAM'],
        status: 'now',
        dueDate: formatISO(addDays(event, 14), { representation: 'date' }),
        ctaLabel: 'Szczegóły świadczenia',
        ctaHref: '/benefits/maternity',
        priority: 'required',
      },
      {
        id: 'pp-employer',
        title: 'Poinformuj pracodawcę o kontynuacji urlopu',
        description:
          'Ustal w firmie kolejne kroki urlopu rodzicielskiego / powrotu. Nie jest to wniosek do ZUS.',
        documents: ['Informacja do pracodawcy'],
        status: 'later',
        dueDate: formatISO(addDays(event, 21), { representation: 'date' }),
        ctaLabel: 'Otwórz sprawy',
        ctaHref: '/sprawy',
        priority:
          profile.employmentType === 'employment_contract' ? 'required' : 'needs_verification',
      },
      {
        id: 'pp-800plus-info',
        title: 'Sprawdź oficjalnie 800+ (informacja)',
        description:
          'Tylko wskazanie oficjalnego źródła — eBobo nie ocenia tu Twojego prawa do świadczenia.',
        documents: [],
        status: 'later',
        dueDate: null,
        ctaLabel: 'Sprawdź również',
        ctaHref: '/benefits',
        priority: 'optional',
      },
    ],
    sourceUrls: [...OFFICIAL_SOURCES],
    isDemo: true,
  };
}

function buildDocumentAssistant(profile: ParentProfile): DocumentAssistantBundle {
  const zamTitle = 'Wniosek ZAM — macierzyński / rodzicielski';
  const employerTitle = 'Informacja / wniosek do pracodawcy';

  return {
    applications: [
      {
        id: 'app-zam',
        title: zamTitle,
        formCode: 'ZAM',
        benefitId: 'maternity',
        documents: [
          {
            id: 'doc-zam-form',
            title: 'Formularz ZAM',
            formCode: 'ZAM',
            required: true,
            status: 'missing',
            purpose: 'Główny wniosek o świadczenia związane z macierzyństwem / rodzicielstwem.',
            linkedApplicationId: 'app-zam',
            linkedApplicationTitle: zamTitle,
            officialUrl: 'https://www.zus.pl',
            isDemo: true,
          },
          {
            id: 'doc-zam-id',
            title: 'Dokument tożsamości',
            formCode: null,
            required: true,
            status: 'missing',
            purpose: 'Do wglądu przy składaniu wniosku w placówce lub online.',
            linkedApplicationId: 'app-zam',
            linkedApplicationTitle: zamTitle,
            officialUrl: 'https://www.zus.pl',
            isDemo: true,
          },
          {
            id: 'doc-zam-birth',
            title: profile.stage === 'adoption' || profile.stage === 'foster'
              ? 'Dokument przyjęcia dziecka'
              : 'Akt urodzenia / przewidywana data porodu',
            formCode: null,
            required: profile.stage === 'after_birth' || profile.stage === 'adoption',
            status:
              profile.stage === 'after_birth' || profile.stage === 'adoption'
                ? 'missing'
                : 'optional',
            purpose: 'Potwierdzenie wydarzenia rodzicielskiego — wg wymagań adresata wniosku.',
            linkedApplicationId: 'app-zam',
            linkedApplicationTitle: zamTitle,
            officialUrl: 'https://www.gov.pl/web/rodzina',
            isDemo: true,
          },
        ],
      },
      {
        id: 'app-employer',
        title: employerTitle,
        formCode: null,
        benefitId: null,
        documents: [
          {
            id: 'doc-employer-notice',
            title: 'Pismo / wniosek do pracodawcy',
            formCode: null,
            required: profile.employmentType === 'employment_contract',
            status:
              profile.employmentType === 'employment_contract' ? 'missing' : 'optional',
            purpose: 'Ustalenie terminów urlopu i przekazanie dokumentów w firmie.',
            linkedApplicationId: 'app-employer',
            linkedApplicationTitle: employerTitle,
            officialUrl: 'https://www.gov.pl/web/rodzina',
            isDemo: true,
          },
        ],
      },
    ],
    retiredNote:
      'Formularze ZUR, ZAO i Z-3b nie są już bieżące (aktualizacja od 24.10.2026). Używaj ZAM.',
    isDemo: true,
  };
}

export class MockEligibilityAdapter implements EligibilityService {
  async evaluate(profile: ParentProfile): Promise<EligibilityEvaluation> {
    await delay();
    const missingInputs = buildMissingInputs(profile);
    const checklist = buildChecklist(profile);
    const deadlines = buildDeadlines(profile);
    const benefits = buildBenefits(profile);
    const nowItems = checklist.filter((item) => item.status === 'now');
    const next = nowItems[0];
    const topBenefit = benefits[0];
    const nearestDeadline = [...deadlines].sort((a, b) =>
      a.submitBy.localeCompare(b.submitBy),
    )[0];

    return {
      isDemo: true,
      ruleSetVersion: RULE_SET_VERSION,
      evaluatedAt: new Date().toISOString(),
      nextAction: topBenefit
        ? {
            title: topBenefit.title,
            description: topBenefit.summary,
            ctaLabel: topBenefit.nextStepLabel,
            ctaHref: topBenefit.nextStepHref,
          }
        : next
          ? {
              title: next.title,
              description: next.description,
              ctaLabel: next.ctaLabel,
              ctaHref: next.ctaHref,
            }
          : {
              title: 'Uzupełnij ankietę',
              description: 'Bez podstawowych danych nie ocenimy świadczeń.',
              ctaLabel: 'Wróć do onboardingu',
              ctaHref: '/onboarding',
            },
      upcomingDeadline: nearestDeadline
        ? {
            id: nearestDeadline.id,
            title: nearestDeadline.title,
            date: nearestDeadline.submitBy,
            relatedChecklistId: nearestDeadline.relatedChecklistId,
          }
        : null,
      deadlines,
      benefits,
      checklist,
      relatedBenefits: buildRelatedBenefits(profile),
      deadlineRadar: buildDeadlineRadar(deadlines),
      postpartumKit: buildPostpartumKit(profile),
      documentAssistant: buildDocumentAssistant(profile),
      warnings: [
        'To symulacja demonstracyjna. Nie jest oficjalną decyzją ZUS.',
        ...(profile.isDemo ? ['Aktywny scenariusz demo — dane przykładowe.'] : []),
      ],
      assumptions: [
        `Wersja reguł demo: ${RULE_SET_VERSION}`,
        'Formularze: aktualny ZAM (bez ZUR/ZAO/Z-3b jako bieżących).',
        'Bloki „Sprawdź również”, radar, niezbędnik i asystent dokumentów pochodzą z API/mocka.',
      ],
      sourceUrls: [...OFFICIAL_SOURCES],
      missingInputs,
    };
  }
}

export class MockCalculatorAdapter implements CalculatorService {
  async calculate(input: CalculatorScenarioInput): Promise<CalculatorResult> {
    await delay();
    const missing = buildMissingInputs(input.profile);

    if (missing.length > 0) {
      return {
        isDemo: true,
        ruleSetVersion: RULE_SET_VERSION,
        calculatedAt: new Date().toISOString(),
        scenarios: [],
        sourceUrls: [...OFFICIAL_SOURCES],
        assumptions: [],
        warnings: ['Brakuje danych wejściowych do wiarygodnej symulacji.'],
        missingInputs: missing,
      };
    }

    const motherWeeks = input.leaveSplitMotherWeeks ?? 20;
    const fatherWeeks = input.leaveSplitFatherWeeks ?? 9;

    return {
      isDemo: true,
      ruleSetVersion: RULE_SET_VERSION,
      calculatedAt: new Date().toISOString(),
      scenarios: [
        {
          id: 'base',
          name: 'Wariant bazowy (demo)',
          periods: [
            {
              id: 'maternity',
              label: 'Okres macierzyński / podstawowy',
              startDate: input.profile.eventDate,
              endDate: null,
              weeks: motherWeeks,
              recipient: input.profile.role === 'father' ? 'father' : 'mother',
            },
            {
              id: 'paternity-or-second',
              label: 'Okres drugiego rodzica',
              startDate: null,
              endDate: null,
              weeks: fatherWeeks,
              recipient: 'father',
            },
          ],
          grossAmount: null,
          currency: 'PLN',
          assumptions: [
            'Kwoty nie są wyliczane w MVP bez zweryfikowanego silnika stawek.',
            'Okresy są przykładowe i służą porównaniu wariantów UI.',
          ],
          warnings: [
            'Symulacja demo — nie traktuj jako wyliczenia zasiłku.',
            ...(input.workDuringParental
              ? ['Praca w trakcie rodzicielskiego może zmieniać wypłatę — wymaga weryfikacji.']
              : []),
          ],
          missingInputs: [],
        },
        {
          id: 'more-to-partner',
          name: 'Większy udział drugiego rodzica (demo)',
          periods: [
            {
              id: 'maternity-short',
              label: 'Okres podstawowy',
              startDate: input.profile.eventDate,
              endDate: null,
              weeks: Math.max(motherWeeks - 4, 8),
              recipient: 'mother',
            },
            {
              id: 'partner-more',
              label: 'Okres drugiego rodzica',
              startDate: null,
              endDate: null,
              weeks: fatherWeeks + 4,
              recipient: 'father',
            },
          ],
          grossAmount: null,
          currency: 'PLN',
          assumptions: ['Porównanie demonstracyjne bez kwot.'],
          warnings: ['Wynik nie jest decyzją ZUS.'],
          missingInputs: [],
        },
      ],
      sourceUrls: [...OFFICIAL_SOURCES],
      assumptions: [`Wersja reguł: ${RULE_SET_VERSION}`],
      warnings: ['Kalkulator pokazuje strukturę wyniku, nie oficjalne kwoty.'],
      missingInputs: [],
    };
  }
}

export class MockDocumentsAdapter implements DocumentsService {
  async analyze(input: DocumentAnalyzeInput) {
    await delay(600);
    const isPdf =
      (input.mimeType ?? '').includes('pdf') ||
      input.fileName.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      return {
        isDemo: true,
        ruleSetVersion: RULE_SET_VERSION,
        analyzedAt: new Date().toISOString(),
        status: 'unsupported' as const,
        documentType: null,
        fields: [],
        message: 'Obsługujemy tylko PDF w tym demo.',
        sourceUrls: [...OFFICIAL_SOURCES],
        assumptions: [],
        warnings: [],
        missingInputs: [],
      };
    }

    return {
      isDemo: true,
      ruleSetVersion: RULE_SET_VERSION,
      analyzedAt: new Date().toISOString(),
      status: 'partial' as const,
      documentType: 'ZAM',
      fields: [
        {
          key: 'applicant_name',
          label: 'Imię i nazwisko (odczyt demo)',
          value: null,
          confidence: null,
          editable: true,
        },
        {
          key: 'benefit_type',
          label: 'Rodzaj świadczenia',
          value: 'macierzyński / rodzicielski',
          confidence: 0.4,
          editable: true,
        },
        {
          key: 'event_date',
          label: 'Data porodu / przyjęcia',
          value: null,
          confidence: null,
          editable: true,
        },
      ],
      message:
        'Przetwarzanie demonstracyjne — pola przykładowe. Podłącz RestAdapter, gdy FastAPI zwróci OCR/parse.',
      sourceUrls: [...OFFICIAL_SOURCES],
      assumptions: ['Brak rzeczywistego parsera PDF na froncie.'],
      warnings: ['Skoryguj pola przed użyciem w kalkulacjach.'],
      missingInputs: ['applicant_name', 'event_date'],
    };
  }
}

export class MockKnowledgeAdapter implements KnowledgeService {
  async getKnowledge() {
    await delay(200);
    return {
      isDemo: true,
      updatedAt: '2026-10-24',
      items: [
        {
          id: 'zam',
          title: 'Formularz ZAM',
          summary:
            'Aktualny wniosek po połączeniu ZUR/ZAO z ZAM (od 24.10.2026). Z-3b zlikwidowano.',
          officialUrl: 'https://www.zus.pl',
          updatedAt: '2026-10-24',
          tags: ['dokumenty', 'ZAM'],
        },
        {
          id: 'maternity',
          title: 'Zasiłek macierzyński — źródła',
          summary: 'Oficjalne informacje o warunkach i terminach — weryfikuj na zus.pl.',
          officialUrl: 'https://www.zus.pl',
          updatedAt: '2026-10-24',
          tags: ['świadczenia'],
        },
      ],
    };
  }
}
