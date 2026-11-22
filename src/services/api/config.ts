import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type ApiMode = 'mock' | 'rest';

/** Same-origin proxy Metro (`metro.config.js`) — omija CORS w Expo Web. */
export const WEB_API_PROXY_PREFIX = '/zus-proxy';

function readExtra(key: string): string | undefined {
  const extra = Constants.expoConfig?.extra as Record<string, string> | undefined;
  return extra?.[key];
}

/**
 * EXPO_PUBLIC_API_MODE=mock|rest
 * EXPO_PUBLIC_API_URL (preferowane) lub EXPO_PUBLIC_API_BASE_URL
 */
export function getApiMode(): ApiMode {
  const mode =
    process.env.EXPO_PUBLIC_API_MODE ??
    readExtra('apiMode') ??
    'mock';
  return mode === 'rest' ? 'rest' : 'mock';
}

export function getApiBaseUrl(): string {
  /**
   * Web: wołamy `/zus-proxy/...` (same origin) → Metro → FastAPI.
   * Native: bezpośredni URL z .env.
   */
  if (Platform.OS === 'web') {
    return WEB_API_PROXY_PREFIX;
  }

  const base =
    process.env.EXPO_PUBLIC_API_URL ??
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    readExtra('apiUrl') ??
    readExtra('apiBaseUrl') ??
    'http://localhost:8000';
  return base.replace(/\/$/, '');
}

export function isNgrokUrl(url = getApiBaseUrl()): boolean {
  return /ngrok/i.test(url);
}

export const API_PATHS = {
  health: '/api/v1/health',
  authSession: '/api/v1/auth/session',
  authMobywatelLogin: '/api/v1/auth/mobywatel/login',
  authMe: '/api/v1/auth/me',
  authRefresh: '/api/v1/auth/refresh',
  authLogout: '/api/v1/auth/logout',
  /** Silnik uprawnień FastAPI — `POST /eligibility/check/{benefit_code}`. */
  eligibilityCheck: (benefitCode: string) =>
    `/api/v1/eligibility/check/${encodeURIComponent(benefitCode)}`,
  /** Wyjaśnienie wyniku — ten sam payload co eligibility/check. */
  legalAdvisorExplain: (benefitCode: string) =>
    `/api/v1/legal-advisor/explain/${encodeURIComponent(benefitCode)}`,
  /** Kalkulacja kwoty — `POST /benefits/calculate/{benefit_code}`. */
  benefitsCalculate: (benefitCode: string) =>
    `/api/v1/benefits/calculate/${encodeURIComponent(benefitCode)}`,
  /** Porównanie wariantów urlopu rodzicielskiego. */
  benefitsCompareParental: '/api/v1/benefits/compare/urlop-rodzicielski',
  /** Starszy / rozszerzony kontrakt hubu świadczeń (tylko mock). */
  eligibilityEvaluate: '/api/v1/eligibility/evaluate',
  /** Legacy — nie używać w REST P0 (zastąpione benefits/calculate). */
  calculationsParental: '/api/v1/calculations/parental',
  documentsAnalyze: '/api/v1/documents/analyze',
  knowledge: '/api/v1/knowledge',
} as const;
