import type { BenefitCode } from '@/services/api/eligibilityCheckSchemas';
import type { InstitutionId } from '@/types/institutions';
import type { ParentProfile } from '@/types/journey';

/** Typ oficjalnego linku — nie trzy nazwy dla tego samego URL. */
export type OfficialLinkKind =
  | 'case_status'
  | 'procedure'
  | 'form'
  | 'legal_information';

export type OfficialLinkVerification = 'verified' | 'needs_recheck' | 'fallback';

export interface OfficialLink {
  id: string;
  benefitCode: BenefitCode | 'general';
  title: string;
  url: string;
  institution: InstitutionId;
  kind: OfficialLinkKind;
  /** Krótki opis dla rodzica. */
  description: string;
  requiresLogin: boolean;
  /** Warunki widoczności — gdy puste, zawsze. */
  showWhen?: {
    /** Pokazuj gdy kanał płatnika obejmuje ZUS. */
    payerIncludesZus?: boolean;
    /** Pokazuj gdy kanał obejmuje pracodawcę. */
    payerIncludesEmployer?: boolean;
  };
  lastVerified: string;
  verification: OfficialLinkVerification;
  /** Etykieta CTA, np. „Otwórz w ZUS”. */
  ctaLabel: string;
}

export type PaymentChannel =
  | 'zus'
  | 'employer'
  | 'zus_or_employer'
  | 'unknown';

export interface PaymentChannelGuidance {
  channel: PaymentChannel;
  title: string;
  explanation: string;
}

/** Dozwolone hosty dla rejestru oficjalnych linków. */
export const OFFICIAL_LINK_ALLOWED_HOSTS = [
  'www.zus.pl',
  'zus.pl',
  'psz.zus.pl',
  'www.gov.pl',
  'gov.pl',
  'www.pip.gov.pl',
  'pip.gov.pl',
] as const;

export const EZUS_ENTRY: OfficialLink = {
  id: 'ezus-portal',
  benefitCode: 'general',
  title: 'Portal eZUS',
  url: 'https://www.zus.pl/o-zus/kontakt/portal-ezus',
  institution: 'zus',
  kind: 'case_status',
  description:
    'Przejdź do eZUS, aby sprawdzić dostępne informacje o swoich sprawach i korespondencję z ZUS. Dostęp do szczegółów zwykle wymaga zalogowania — eBobo nie otwiera konkretnej sprawy automatycznie.',
  requiresLogin: true,
  lastVerified: '2026-11-22',
  verification: 'verified',
  ctaLabel: 'Otwórz eZUS',
};

export const EZUS_CORRESPONDENCE: OfficialLink = {
  id: 'ezus-correspondence',
  benefitCode: 'general',
  title: 'Jak wysyłać i odbierać pisma w eZUS',
  url: 'https://www.zus.pl/baza-wiedzy/o-portalu-pue-/w-jaki-sposob-wysylac-do-zus-i-odbierac-pisma-',
  institution: 'zus',
  kind: 'legal_information',
  description:
    'Oficjalna instrukcja korespondencji z ZUS przez portal. Nie pobiera statusu sprawy do eBobo.',
  requiresLogin: false,
  lastVerified: '2026-11-22',
  verification: 'verified',
  ctaLabel: 'Instrukcja korespondencji',
};

const MACIERZYNSKI_DOCS =
  'https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/niezbedne-dokumenty';
const MACIERZYNSKI_FORMS =
  'https://www.zus.pl/pl/wzory-formularzy/zasilki/zasilek-macierzynski';

/**
 * Rejestr oficjalnych linków per benefit_code.
 * Nie promujemy historycznych formularzy (ZUR/ZAO/Z-3b) bez weryfikacji —
 * wskazujemy strony katalogowe ZUS z aktualnymi wzorami.
 */
export const OFFICIAL_LINKS_BY_BENEFIT: Record<BenefitCode, OfficialLink[]> = {
  zasilek_macierzynski_urlop_macierzynski: [
    {
      id: 'zm-case',
      benefitCode: 'zasilek_macierzynski_urlop_macierzynski',
      title: 'Sprawdź status sprawy w eZUS',
      url: EZUS_ENTRY.url,
      institution: 'zus',
      kind: 'case_status',
      description: EZUS_ENTRY.description,
      requiresLogin: true,
      showWhen: { payerIncludesZus: true },
      lastVerified: '2026-11-22',
      verification: 'verified',
      ctaLabel: 'Otwórz eZUS',
    },
    {
      id: 'zm-docs',
      benefitCode: 'zasilek_macierzynski_urlop_macierzynski',
      title: 'Niezbędne dokumenty',
      url: MACIERZYNSKI_DOCS,
      institution: 'zus',
      kind: 'procedure',
      description: 'Oficjalny opis dokumentów przy zasiłku macierzyńskim.',
      requiresLogin: false,
      lastVerified: '2026-11-22',
      verification: 'verified',
      ctaLabel: 'Dokumenty w ZUS',
    },
    {
      id: 'zm-forms',
      benefitCode: 'zasilek_macierzynski_urlop_macierzynski',
      title: 'Wzory formularzy zasiłku macierzyńskiego',
      url: MACIERZYNSKI_FORMS,
      institution: 'zus',
      kind: 'form',
      description:
        'Aktualne wzory (m.in. ZAM). Od 24.10.2026 ZUR/ZAO połączono z ZAM, a Z-3b zlikwidowano — nie kierujemy do wycofanych druków.',
      requiresLogin: false,
      lastVerified: '2026-11-22',
      verification: 'verified',
      ctaLabel: 'Formularze ZUS',
    },
  ],
  zasilek_w_wysokosci_zasilku_macierzynskiego: [
    {
      id: 'zwzm-case',
      benefitCode: 'zasilek_w_wysokosci_zasilku_macierzynskiego',
      title: 'Sprawdź status sprawy w eZUS',
      url: EZUS_ENTRY.url,
      institution: 'zus',
      kind: 'case_status',
      description: EZUS_ENTRY.description,
      requiresLogin: true,
      showWhen: { payerIncludesZus: true },
      lastVerified: '2026-11-22',
      verification: 'verified',
      ctaLabel: 'Otwórz eZUS',
    },
    {
      id: 'zwzm-forms',
      benefitCode: 'zasilek_w_wysokosci_zasilku_macierzynskiego',
      title: 'Formularze (m.in. ZAS-55)',
      url: MACIERZYNSKI_FORMS,
      institution: 'zus',
      kind: 'form',
      description:
        'Katalog formularzy zasiłku macierzyńskiego — wybierz aktualny wzór właściwy dla Twojej sytuacji.',
      requiresLogin: false,
      lastVerified: '2026-11-22',
      verification: 'needs_recheck',
      ctaLabel: 'Formularze ZUS',
    },
    {
      id: 'zwzm-info',
      benefitCode: 'zasilek_w_wysokosci_zasilku_macierzynskiego',
      title: 'Niezbędne dokumenty',
      url: MACIERZYNSKI_DOCS,
      institution: 'zus',
      kind: 'legal_information',
      description: 'Opis dokumentów powiązanych z zasiłkiem macierzyńskim.',
      requiresLogin: false,
      lastVerified: '2026-11-22',
      verification: 'verified',
      ctaLabel: 'Dowiedz się więcej',
    },
  ],
  urlop_ojcowski: [
    {
      id: 'uo-case',
      benefitCode: 'urlop_ojcowski',
      title: 'Sprawdź status sprawy w eZUS',
      url: EZUS_ENTRY.url,
      institution: 'zus',
      kind: 'case_status',
      description: EZUS_ENTRY.description,
      requiresLogin: true,
      showWhen: { payerIncludesZus: true },
      lastVerified: '2026-11-22',
      verification: 'verified',
      ctaLabel: 'Otwórz eZUS',
    },
    {
      id: 'uo-docs',
      benefitCode: 'urlop_ojcowski',
      title: 'Dokumenty przy zasiłku macierzyńskim / ojcowskim',
      url: MACIERZYNSKI_DOCS,
      institution: 'zus',
      kind: 'procedure',
      description: 'Dokumenty związane z wnioskowaniem o świadczenie.',
      requiresLogin: false,
      lastVerified: '2026-11-22',
      verification: 'verified',
      ctaLabel: 'Dokumenty w ZUS',
    },
    {
      id: 'uo-pip',
      benefitCode: 'urlop_ojcowski',
      title: 'Uprawnienia rodzicielskie (PIP)',
      url: 'https://www.pip.gov.pl/dla-pracodawcow/porady-prawne/rodzicielstwo',
      institution: 'gov',
      kind: 'legal_information',
      description: 'Informacja o uprawnieniach pracowniczych związanych z rodzicielstwem.',
      requiresLogin: false,
      lastVerified: '2026-11-22',
      verification: 'verified',
      ctaLabel: 'Otwórz PIP',
    },
  ],
  urlop_rodzicielski: [
    {
      id: 'ur-case',
      benefitCode: 'urlop_rodzicielski',
      title: 'Sprawdź status sprawy w eZUS',
      url: EZUS_ENTRY.url,
      institution: 'zus',
      kind: 'case_status',
      description: EZUS_ENTRY.description,
      requiresLogin: true,
      showWhen: { payerIncludesZus: true },
      lastVerified: '2026-11-22',
      verification: 'verified',
      ctaLabel: 'Otwórz eZUS',
    },
    {
      id: 'ur-docs',
      benefitCode: 'urlop_rodzicielski',
      title: 'Niezbędne dokumenty',
      url: MACIERZYNSKI_DOCS,
      institution: 'zus',
      kind: 'procedure',
      description: 'Dokumenty przy świadczeniach związanych z urlopem rodzicielskim.',
      requiresLogin: false,
      lastVerified: '2026-11-22',
      verification: 'verified',
      ctaLabel: 'Dokumenty w ZUS',
    },
    {
      id: 'ur-gov',
      benefitCode: 'urlop_rodzicielski',
      title: 'Urlop rodzicielski — informacja ministerstwa',
      url: 'https://www.gov.pl/web/rodzina/urlop-rodzicielski',
      institution: 'gov',
      kind: 'legal_information',
      description: 'Opis uprawnień do urlopu rodzicielskiego na gov.pl.',
      requiresLogin: false,
      lastVerified: '2026-11-22',
      verification: 'verified',
      ctaLabel: 'Dowiedz się więcej',
    },
  ],
  zasilek_chorobowy_w_ciazy: [
    {
      id: 'zch-case',
      benefitCode: 'zasilek_chorobowy_w_ciazy',
      title: 'Sprawdź status sprawy w eZUS',
      url: EZUS_ENTRY.url,
      institution: 'zus',
      kind: 'case_status',
      description: EZUS_ENTRY.description,
      requiresLogin: true,
      showWhen: { payerIncludesZus: true },
      lastVerified: '2026-11-22',
      verification: 'verified',
      ctaLabel: 'Otwórz eZUS',
    },
    {
      id: 'zch-docs',
      benefitCode: 'zasilek_chorobowy_w_ciazy',
      title: 'Niezbędne dokumenty — zasiłek chorobowy',
      url: 'https://psz.zus.pl/pl/web/guest/swiadczenia/zasilki/zasilek-chorobowy/z-ubezpieczenia-chorobowego/niezbedne-dokumenty',
      institution: 'zus',
      kind: 'procedure',
      description: 'Oficjalna lista dokumentów przy zasiłku chorobowym.',
      requiresLogin: false,
      lastVerified: '2026-11-22',
      verification: 'verified',
      ctaLabel: 'Dokumenty w ZUS',
    },
    {
      id: 'zch-info',
      benefitCode: 'zasilek_chorobowy_w_ciazy',
      title: 'Portal eZUS — korespondencja',
      url: EZUS_CORRESPONDENCE.url,
      institution: 'zus',
      kind: 'legal_information',
      description: EZUS_CORRESPONDENCE.description,
      requiresLogin: false,
      lastVerified: '2026-11-22',
      verification: 'verified',
      ctaLabel: 'Instrukcja eZUS',
    },
  ],
  swiadczenie_rehabilitacyjne: [
    {
      id: 'sr-case',
      benefitCode: 'swiadczenie_rehabilitacyjne',
      title: 'Sprawdź status sprawy w eZUS',
      url: EZUS_ENTRY.url,
      institution: 'zus',
      kind: 'case_status',
      description: EZUS_ENTRY.description,
      requiresLogin: true,
      showWhen: { payerIncludesZus: true },
      lastVerified: '2026-11-22',
      verification: 'verified',
      ctaLabel: 'Otwórz eZUS',
    },
    {
      id: 'sr-forms',
      benefitCode: 'swiadczenie_rehabilitacyjne',
      title: 'Formularze świadczenia rehabilitacyjnego (m.in. ZNp-7)',
      url: 'https://www.zus.pl/wzory-formularzy/zasilki/swiadczenie-rehabilitacyjne',
      institution: 'zus',
      kind: 'form',
      description: 'Aktualne wzory formularzy świadczenia rehabilitacyjnego.',
      requiresLogin: false,
      lastVerified: '2026-11-22',
      verification: 'verified',
      ctaLabel: 'Formularze ZUS',
    },
    {
      id: 'sr-info',
      benefitCode: 'swiadczenie_rehabilitacyjne',
      title: 'Instrukcja korespondencji z ZUS',
      url: EZUS_CORRESPONDENCE.url,
      institution: 'zus',
      kind: 'legal_information',
      description: EZUS_CORRESPONDENCE.description,
      requiresLogin: false,
      lastVerified: '2026-11-22',
      verification: 'verified',
      ctaLabel: 'Dowiedz się więcej',
    },
  ],
  uzupelniajacy_urlop_macierzynski: [
    {
      id: 'uum-case',
      benefitCode: 'uzupelniajacy_urlop_macierzynski',
      title: 'Sprawdź status sprawy w eZUS',
      url: EZUS_ENTRY.url,
      institution: 'zus',
      kind: 'case_status',
      description: EZUS_ENTRY.description,
      requiresLogin: true,
      showWhen: { payerIncludesZus: true },
      lastVerified: '2026-11-22',
      verification: 'verified',
      ctaLabel: 'Otwórz eZUS',
    },
    {
      id: 'uum-docs',
      benefitCode: 'uzupelniajacy_urlop_macierzynski',
      title: 'Niezbędne dokumenty',
      url: MACIERZYNSKI_DOCS,
      institution: 'zus',
      kind: 'procedure',
      description: 'Dokumenty przy świadczeniach macierzyńskich / uzupełniających.',
      requiresLogin: false,
      lastVerified: '2026-11-22',
      verification: 'verified',
      ctaLabel: 'Dokumenty w ZUS',
    },
    {
      id: 'uum-forms',
      benefitCode: 'uzupelniajacy_urlop_macierzynski',
      title: 'Wzory formularzy',
      url: MACIERZYNSKI_FORMS,
      institution: 'zus',
      kind: 'form',
      description: 'Aktualne formularze — bez kierowania do wycofanych ZUR/ZAO/Z-3b.',
      requiresLogin: false,
      lastVerified: '2026-11-22',
      verification: 'verified',
      ctaLabel: 'Formularze ZUS',
    },
  ],
  urlop_na_warunkach_urlopu_macierzynskiego: [
    {
      id: 'unw-case',
      benefitCode: 'urlop_na_warunkach_urlopu_macierzynskiego',
      title: 'Sprawdź status sprawy w eZUS',
      url: EZUS_ENTRY.url,
      institution: 'zus',
      kind: 'case_status',
      description: EZUS_ENTRY.description,
      requiresLogin: true,
      showWhen: { payerIncludesZus: true },
      lastVerified: '2026-11-22',
      verification: 'verified',
      ctaLabel: 'Otwórz eZUS',
    },
    {
      id: 'unw-docs',
      benefitCode: 'urlop_na_warunkach_urlopu_macierzynskiego',
      title: 'Niezbędne dokumenty',
      url: MACIERZYNSKI_DOCS,
      institution: 'zus',
      kind: 'procedure',
      description:
        'Dokumenty przy urlopie na warunkach urlopu macierzyńskiego (adopcja / piecza).',
      requiresLogin: false,
      lastVerified: '2026-11-22',
      verification: 'verified',
      ctaLabel: 'Dokumenty w ZUS',
    },
    {
      id: 'unw-info',
      benefitCode: 'urlop_na_warunkach_urlopu_macierzynskiego',
      title: 'Uprawnienia rodzicielskie (PIP)',
      url: 'https://www.pip.gov.pl/dla-pracodawcow/porady-prawne/rodzicielstwo',
      institution: 'gov',
      kind: 'legal_information',
      description: 'Informacja o uprawnieniach pracowniczych.',
      requiresLogin: false,
      lastVerified: '2026-11-22',
      verification: 'verified',
      ctaLabel: 'Dowiedz się więcej',
    },
  ],
  zasilek_pogrzebowy_martwe_urodzenie: [
    {
      id: 'zp-info',
      benefitCode: 'zasilek_pogrzebowy_martwe_urodzenie',
      title: 'Zasiłek pogrzebowy — informacje i procedura',
      url: 'https://www.zus.pl/swiadczenia/zasilki/zasilek-pogrzebowy',
      institution: 'zus',
      kind: 'procedure',
      description:
        'Oficjalne informacje o zasiłku pogrzebowym. Zadbaj o spokojne tempo — to trudna sytuacja.',
      requiresLogin: false,
      lastVerified: '2026-11-22',
      verification: 'verified',
      ctaLabel: 'Informacje ZUS',
    },
    {
      id: 'zp-case',
      benefitCode: 'zasilek_pogrzebowy_martwe_urodzenie',
      title: 'Sprawy i korespondencja w eZUS',
      url: EZUS_ENTRY.url,
      institution: 'zus',
      kind: 'case_status',
      description: EZUS_ENTRY.description,
      requiresLogin: true,
      showWhen: { payerIncludesZus: true },
      lastVerified: '2026-11-22',
      verification: 'verified',
      ctaLabel: 'Otwórz eZUS',
    },
    {
      id: 'zp-legal',
      benefitCode: 'zasilek_pogrzebowy_martwe_urodzenie',
      title: 'Jak wysyłać i odbierać pisma',
      url: EZUS_CORRESPONDENCE.url,
      institution: 'zus',
      kind: 'legal_information',
      description: EZUS_CORRESPONDENCE.description,
      requiresLogin: false,
      lastVerified: '2026-11-22',
      verification: 'verified',
      ctaLabel: 'Instrukcja',
    },
  ],
};

export function isAllowedOfficialUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    return (OFFICIAL_LINK_ALLOWED_HOSTS as readonly string[]).includes(
      parsed.hostname,
    );
  } catch {
    return false;
  }
}

/**
 * Ustal kanał płatnika na podstawie profilu i tekstu procedury — bez lokalnej logiki prawnej.
 * Gdy niepewne → pokaż oba kanały.
 */
export function resolvePaymentChannel(
  profile: Pick<ParentProfile, 'employmentType'>,
  officeText?: string | null,
): PaymentChannelGuidance {
  const office = (officeText ?? '').toLowerCase();
  const hasZus = office.includes('zus');
  const hasEmployer = office.includes('pracodawc');

  if (hasZus && hasEmployer) {
    return {
      channel: 'zus_or_employer',
      title: 'ZUS lub pracodawca',
      explanation:
        'Z odpowiedzi wynika, że sprawę może prowadzić pracodawca albo ZUS. Sprawdź, kto wypłaca zasiłek w Twojej sytuacji.',
    };
  }
  if (hasZus) {
    return {
      channel: 'zus',
      title: 'Zazwyczaj ZUS',
      explanation:
        'Na podstawie dostępnych informacji sprawę wskazuje się po stronie ZUS. Potwierdź to u płatnika zasiłku.',
    };
  }
  if (hasEmployer) {
    return {
      channel: 'employer',
      title: 'Zazwyczaj pracodawca',
      explanation:
        'Na podstawie dostępnych informacji pierwszym adresatem może być pracodawca (płatnik).',
    };
  }

  if (profile.employmentType === 'employment_contract') {
    return {
      channel: 'zus_or_employer',
      title: 'Pracodawca lub ZUS',
      explanation:
        'Przy umowie o pracę zasiłek często wypłaca pracodawca, a w niektórych sytuacjach ZUS. Nie da się tego rozstrzygnąć jednoznacznie bez potwierdzenia — pokażemy oba kanały.',
    };
  }

  if (
    profile.employmentType === 'self_employed' ||
    profile.employmentType === 'civil_contract'
  ) {
    return {
      channel: 'zus',
      title: 'Zazwyczaj ZUS',
      explanation:
        'Przy tej formie zatrudnienia sprawę zasiłkową często prowadzi ZUS. Potwierdź to w swojej sytuacji.',
    };
  }

  return {
    channel: 'unknown',
    title: 'Do ustalenia',
    explanation:
      'Nie możemy jednoznacznie wskazać, czy sprawę prowadzi pracodawca, czy ZUS. Poniżej znajdziesz oba możliwe kanały.',
  };
}

export function linksForBenefit(
  code: BenefitCode,
  channel: PaymentChannel,
): OfficialLink[] {
  const links = OFFICIAL_LINKS_BY_BENEFIT[code] ?? [];
  return links.filter((link) => {
    const when = link.showWhen;
    if (!when) return true;
    if (when.payerIncludesZus) {
      return (
        channel === 'zus' ||
        channel === 'zus_or_employer' ||
        channel === 'unknown'
      );
    }
    if (when.payerIncludesEmployer) {
      return (
        channel === 'employer' ||
        channel === 'zus_or_employer' ||
        channel === 'unknown'
      );
    }
    return true;
  });
}

export function groupLinksByKind(links: OfficialLink[]) {
  const order: OfficialLinkKind[] = [
    'case_status',
    'procedure',
    'form',
    'legal_information',
  ];
  const groups: { kind: OfficialLinkKind; title: string; items: OfficialLink[] }[] =
    [
      { kind: 'case_status', title: 'Sprawdź status sprawy', items: [] },
      { kind: 'procedure', title: 'Dokumenty i sposób złożenia', items: [] },
      { kind: 'form', title: 'Formularze', items: [] },
      {
        kind: 'legal_information',
        title: 'Dowiedz się więcej',
        items: [],
      },
    ];
  for (const link of links) {
    const g = groups.find((x) => x.kind === link.kind);
    if (g) g.items.push(link);
  }
  return groups.filter((g) => g.items.length > 0).sort(
    (a, b) => order.indexOf(a.kind) - order.indexOf(b.kind),
  );
}

/** Formularze historyczne — nie promujemy bezpośredniego CTA. */
export const RETIRED_FORM_CODES = ['ZUR', 'ZAO', 'Z-3b', 'Z3b'] as const;

export function mentionsRetiredForm(text: string): boolean {
  return RETIRED_FORM_CODES.some((code) =>
    new RegExp(`\\b${code.replace('-', '[-]?')}\\b`, 'i').test(text),
  );
}
