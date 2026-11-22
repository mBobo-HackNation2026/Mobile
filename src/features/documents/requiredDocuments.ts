export interface RequiredDocument {
  id: string;
  title: string;
  purpose: string;
  institution: string;
  officialUrl: string;
  formCode?: string;
  current: boolean;
}

/**
 * Lista bieżących formularzy do demo jury.
 * Backend / knowledge API może to później zastąpić.
 */
export const REQUIRED_DOCUMENTS: RequiredDocument[] = [
  {
    id: 'zam',
    title: 'ZAM — wniosek o zasiłek / urlop',
    purpose:
      'Główny wniosek o świadczenia związane z macierzyństwem / rodzicielstwem. Od 24.10.2026 zastępuje m.in. ZUR i ZAO.',
    institution: 'ZUS (PUE) lub pracodawca — zależnie od przypadku',
    officialUrl: 'https://www.zus.pl',
    formCode: 'ZAM',
    current: true,
  },
  {
    id: 'employer-notice',
    title: 'Informacja / wniosek do pracodawcy',
    purpose: 'Ustalenie terminów urlopu i przekazanie dokumentów w firmie.',
    institution: 'Pracodawca',
    officialUrl: 'https://www.gov.pl/web/rodzina',
    current: true,
  },
  {
    id: 'identity',
    title: 'Dokument tożsamości (do wglądu)',
    purpose: 'Potwierdzenie danych osoby składającej wniosek w placówce lub online.',
    institution: 'ZUS / pracodawca',
    officialUrl: 'https://www.zus.pl',
    current: true,
  },
];

/** Nie pokazujemy jako bieżących. */
export const RETIRED_FORMS_NOTE =
  'Formularze ZUR, ZAO i Z-3b nie są już bieżące (aktualizacja od 24.10.2026).';
