import type { LegalAdvisorExplainResponse } from '@/services/api/legalAdvisorExplainSchemas';
import { isExplainStatusAligned } from '@/services/api/legalAdvisorExplainSchemas';

/** Czy odpowiedź explain wolno pokazać jako aktualną dla tego ekranu. */
export function shouldAcceptExplainResponse(opts: {
  requestGen: number;
  currentGen: number;
  requestedBenefitCode: string;
  response: LegalAdvisorExplainResponse;
}): { accept: boolean; statusMismatch: boolean; benefitMismatch: boolean } {
  if (opts.requestGen !== opts.currentGen) {
    return { accept: false, statusMismatch: false, benefitMismatch: false };
  }
  const benefitMismatch =
    opts.response.benefit_code !== opts.requestedBenefitCode;
  return {
    accept: !benefitMismatch,
    statusMismatch: false,
    benefitMismatch,
  };
}

export function evaluateExplainAlignment(
  engineStatus: string | null | undefined,
  explainStatus: string,
): boolean {
  return isExplainStatusAligned(engineStatus, explainStatus);
}

/** Abort użytkownika / unmount / zmiana profilu — nie pokazuj jako błąd AI. */
export function isUserAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { name?: string; message?: string; code?: string };
  if (e.code === 'aborted') return true;
  if (e.name === 'AbortError') return true;
  if (/anulowane|aborted|AbortError/i.test(e.message ?? '')) return true;
  return false;
}

/** Timeout sieciowy — pokazuj błąd z retry; nie mylić z abort. */
export function isTimeoutError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  return (error as { code?: string }).code === 'timeout';
}
