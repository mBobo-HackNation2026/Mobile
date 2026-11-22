import { Linking, Platform } from 'react-native';

import {
  isAllowedOfficialUrl,
  OFFICIAL_LINK_ALLOWED_HOSTS,
} from '@/features/benefits/officialLinks';

export type OpenExternalResult =
  | { ok: true }
  | { ok: false; reason: 'invalid' | 'not_allowed' | 'open_failed' };

/**
 * Otwiera oficjalny URL bez przekazywania danych osobowych.
 * Web: nowa karta + rel noopener. Mobile: systemowy handler.
 */
export async function openExternalUrl(
  url: string,
  opts?: { requireAllowlist?: boolean },
): Promise<OpenExternalResult> {
  const requireAllowlist = opts?.requireAllowlist !== false;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, reason: 'invalid' };
  }

  if (parsed.protocol !== 'https:') {
    return { ok: false, reason: 'invalid' };
  }

  if (requireAllowlist && !isAllowedOfficialUrl(url)) {
    return { ok: false, reason: 'not_allowed' };
  }

  // Usuń zbędne query trackery, jeśli ktoś je dodał do rejestru.
  parsed.searchParams.delete('utm_source');
  parsed.searchParams.delete('utm_medium');
  parsed.searchParams.delete('utm_campaign');
  const clean = parsed.toString();

  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(clean, '_blank', 'noopener,noreferrer');
      return { ok: true };
    }
    const can = await Linking.canOpenURL(clean);
    if (!can) return { ok: false, reason: 'open_failed' };
    await Linking.openURL(clean);
    return { ok: true };
  } catch {
    return { ok: false, reason: 'open_failed' };
  }
}

export function describeOpenFailure(
  reason: 'invalid' | 'not_allowed' | 'open_failed',
): string {
  switch (reason) {
    case 'not_allowed':
      return `Ten adres nie jest na liście dozwolonych domen (${OFFICIAL_LINK_ALLOWED_HOSTS.join(', ')}).`;
    case 'invalid':
      return 'Nieprawidłowy adres — używamy wyłącznie HTTPS.';
    default:
      return 'Nie udało się otworzyć strony. Spróbuj ponownie później.';
  }
}
