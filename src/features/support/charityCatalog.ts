/**
 * Zweryfikowany katalog organizacji charytatywnych (Etap 16).
 * Tylko oficjalne strony — bez wymyślonych telefonów w UI (numery są na stronach org.).
 */

export type CharityAudience =
  | 'bereavement'
  | 'prematurity'
  | 'serious_illness'
  | 'miscarriage';

export interface CharityOrganization {
  id: string;
  name: string;
  url: string;
  audiences: CharityAudience[];
  helpScope: string;
  forWhom: string;
  lastVerified: string;
  /** Charakter: wyłącznie działalność pomocowa / OPP-like — wg publicznych informacji. */
  natureNote: string;
}

export const CHARITY_ORGANIZATIONS: CharityOrganization[] = [
  {
    id: 'razem-na-maksa',
    name: 'Fundacja Razem na MAKS-a, silni po stracie',
    url: 'https://razemnamaksa.pl/',
    audiences: ['bereavement', 'miscarriage'],
    helpScope:
      'Towarzyszenie w żałobie, kręgi wsparcia, pomoc terapeutyczna i prawna.',
    forWhom: 'Rodzice po śmierci dziecka, także strata okołoporodowa i poronienie.',
    lastVerified: '2026-11-22',
    natureNote: 'Fundacja charytatywna — wsparcie osieroconych rodziców.',
  },
  {
    id: 'donum-vitae',
    name: 'Fundacja Donum Vitae',
    url: 'https://utrata.donumvitae.pl/',
    audiences: ['bereavement', 'miscarriage'],
    helpScope:
      'Wsparcie psychologiczne, prawne i duchowe; informacje o prawach po stracie.',
    forWhom: 'Rodzice po utracie dziecka nienarodzonego lub krótko po urodzeniu.',
    lastVerified: '2026-11-22',
    natureNote: 'Fundacja — pomoc rodzinom po stracie dziecka.',
  },
  {
    id: 'teczowy-kocyk',
    name: 'Fundacja Tęczowy Kocyk',
    url: 'https://teczowykocyk.pl/',
    audiences: ['bereavement', 'miscarriage'],
    helpScope:
      'Wsparcie pożegnalne i pamiątkowe; współpraca z placówkami medycznymi.',
    forWhom: 'Rodzice po stracie dziecka, w tym we wczesnej ciąży.',
    lastVerified: '2026-11-22',
    natureNote: 'Fundacja charytatywna wspierająca godne pożegnanie.',
  },
  {
    id: 'wczesniak',
    name: 'Fundacja Wcześniak Rodzice-Rodzicom',
    url: 'https://wczesniak.pl/',
    audiences: ['prematurity'],
    helpScope:
      'Poradniki, wypożyczalnia sprzętu, subkonta, wsparcie rodziców wcześniaków.',
    forWhom: 'Rodzice wcześniaków i dzieci urodzonych przedwcześnie.',
    lastVerified: '2026-11-22',
    natureNote: 'Organizacja pożytku publicznego (OPP) — KRS 0000191989.',
  },
  {
    id: 'gajusz',
    name: 'Fundacja Gajusz',
    url: 'https://gajusz.org.pl/',
    audiences: ['serious_illness', 'bereavement'],
    helpScope:
      'Hospicja dziecięce (w tym perinatalne), wsparcie rodzin w chorobie i żałobie.',
    forWhom:
      'Rodziny dzieci ciężko i nieuleczalnie chorych; hospicjum perinatalne.',
    lastVerified: '2026-11-22',
    natureNote: 'Fundacja / OPP — opieka hospicyjna i terapeutyczna dla dzieci.',
  },
];

export const USC_ODPIS_LINK = {
  title: 'Uzyskaj odpis aktu stanu cywilnego',
  url: 'https://www.gov.pl/web/gov/uzyskaj-odpis-aktu-stanu-cywilnego-urodzenia-malzenstwa-zgonu',
  description:
    'Oficjalna usługa gov.pl — urodzenie, małżeństwo, zgon. eBobo nie składa wniosku za Ciebie.',
  lastVerified: '2026-11-22',
} as const;

export function charitiesForAudiences(
  audiences: CharityAudience[],
): CharityOrganization[] {
  if (!audiences.length) return CHARITY_ORGANIZATIONS;
  return CHARITY_ORGANIZATIONS.filter((org) =>
    org.audiences.some((a) => audiences.includes(a)),
  );
}
