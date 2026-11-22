import { deriveFormalitiesFromBenefits } from '@/services/api/deriveFormalitiesFromBenefits';
import {
  BENEFIT_CODES,
  BENEFIT_CODE_LABEL,
  checkBenefitEligibility,
  profileToEligibilityCheckRequest,
  type BenefitCode,
} from '@/services/api/eligibilityCheck';
import { ApiClientError } from '@/services/api/httpClient';
import { mapEligibilityCheckToBenefit } from '@/services/api/mapEligibilityCheckToBenefit';
import type { EligibilityService } from '@/services/api/types';
import { aggregateMissingFields } from '@/features/profile/missingFields';
import type { BenefitAssessment } from '@/types/benefits';
import type { EligibilityEvaluation, ParentProfile } from '@/types/journey';

/**
 * REST P0: ocenia wszystkie 9 świadczeń przez FastAPI.
 * Brak cichego fallbacku na mock — błąd sieci / API wraca do UI.
 */
export class CatalogEligibilityAdapter implements EligibilityService {
  async evaluate(profile: ParentProfile): Promise<EligibilityEvaluation> {
    const request = profileToEligibilityCheckRequest(profile);
    const settled = await Promise.allSettled(
      BENEFIT_CODES.map((code) => checkBenefitEligibility(code, request)),
    );

    const fulfilled = settled.filter(
      (item): item is PromiseFulfilledResult<Awaited<ReturnType<typeof checkBenefitEligibility>>> =>
        item.status === 'fulfilled',
    );
    const rejected = settled.filter(
      (item): item is PromiseRejectedResult => item.status === 'rejected',
    );

    if (fulfilled.length === 0) {
      const first = rejected[0]?.reason;
      if (first instanceof ApiClientError) throw first;
      throw new ApiClientError(
        'Nie udało się połączyć z silnikiem uprawnień. Sprawdź backend i spróbuj ponownie.',
        0,
        null,
        'network_error',
      );
    }

    const benefits: BenefitAssessment[] = [];
    const missingInputs: string[] = [];
    const missingFieldsRaw: Array<{ field: string; message: string }> = [];
    const warnings: string[] = [
      'Ocena pochodzi z FastAPI — to nie jest decyzja ZUS ani gwarancja wypłaty.',
      'Deklaracja z ankiety nie jest potwierdzeniem danych ZUS.',
    ];
    const assumptions: string[] = [];
    let rulesVersions = new Set<number>();

    BENEFIT_CODES.forEach((code, index) => {
      const item = settled[index];
      if (item.status === 'fulfilled') {
        const mapped = mapEligibilityCheckToBenefit(item.value, profile);
        benefits.push(mapped);
        missingInputs.push(...item.value.missing_data);
        if (item.value.missing_fields?.length) {
          missingFieldsRaw.push(...item.value.missing_fields);
        }
        warnings.push(...item.value.warnings);
        rulesVersions.add(item.value.rules_version);
        assumptions.push(
          `${code}: rules_version ${item.value.rules_version}, data_source=${item.value.data_source}`,
        );
      } else {
        benefits.push(uncheckedBenefit(code, item.reason));
        warnings.push(
          `${BENEFIT_CODE_LABEL[code]}: nie sprawdzono (${errorText(item.reason)}).`,
        );
      }
    });

    const preferred =
      benefits.find((b) => b.status === 'likely_eligible') ??
      benefits.find((b) => b.status === 'obstacle_with_options') ??
      benefits.find((b) => b.status === 'insufficient_data') ??
      benefits[0];

    const formalities = deriveFormalitiesFromBenefits(benefits);
    warnings.push(
      'Checklista/terminy w tej ocenie pochodzą z planów FastAPI (gdy silnik je zwróci). Mój plan (/home) to osobna lista lokalna DEMO — nie mylić z decyzją ZUS.',
    );

    return {
      isDemo: false,
      ruleSetVersion: `fastapi-catalog-v${[...rulesVersions].join('+') || 'unknown'}`,
      evaluatedAt: new Date().toISOString(),
      benefits,
      nextAction: {
        title: preferred.title,
        description: preferred.summary,
        ctaLabel: preferred.nextStepLabel,
        ctaHref: preferred.nextStepHref,
      },
      upcomingDeadline: formalities.upcomingDeadline,
      deadlines: formalities.deadlines,
      checklist: formalities.checklist,
      relatedBenefits: [],
      deadlineRadar: formalities.deadlineRadar,
      postpartumKit: null,
      documentAssistant: formalities.documentAssistant,
      warnings: unique(warnings),
      assumptions: unique(assumptions),
      sourceUrls: ['https://www.zus.pl'],
      missingInputs: unique(missingInputs),
      missingFields: aggregateMissingFields(missingFieldsRaw),
    };
  }
}

function uncheckedBenefit(code: BenefitCode, reason: unknown): BenefitAssessment {
  return {
    id: code,
    title: BENEFIT_CODE_LABEL[code],
    status: 'needs_review',
    engineStatus: null,
    headline: 'Nie sprawdzono — brak wyniku z silnika dla tego świadczenia.',
    summary:
      'To nie oznacza braku prawa. Spróbuj ponowić ocenę albo sprawdź świadczenie indywidualnie.',
    rationale: `Wywołanie /eligibility/check/${code} nie powiodło się: ${errorText(reason)}. Nie prezentujemy tego jako „nie przysługuje”.`,
    nextStepLabel: 'Spróbuj ponownie ocenę',
    nextStepHref: '/benefits',
    conditions: [],
    remedies: [],
    alternatives: [],
    procedure: null,
    institution: 'zus',
    amountNote: null,
    sourceUrls: [],
    legalBasisNote: null,
    requiresVerification: true,
    warnings: [errorText(reason)],
    planMissing: true,
  };
}

function errorText(reason: unknown): string {
  if (reason instanceof ApiClientError) return reason.message;
  if (reason instanceof Error) return reason.message;
  return 'nieznany błąd';
}

function unique(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))];
}
