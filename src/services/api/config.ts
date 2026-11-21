import Constants from 'expo-constants';

export type ApiMode = 'mock' | 'rest';

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
  /** Silnik uprawnień FastAPI v2 — zasiłek macierzyński (urlop macierzyński). */
  eligibilityCheck: '/api/v1/eligibility/check',
  /** Starszy / rozszerzony kontrakt hubu świadczeń (mock lub przyszły BE). */
  eligibilityEvaluate: '/api/v1/eligibility/evaluate',
  calculationsParental: '/api/v1/calculations/parental',
  documentsAnalyze: '/api/v1/documents/analyze',
  knowledge: '/api/v1/knowledge',
} as const;
