import { API_PATHS } from '@/services/api/config';
import { apiRequest } from '@/services/api/httpClient';
import { toProfileRequest } from '@/services/api/mappers';
import { parseApiResponse } from '@/services/api/parse';
import {
  calculatorResultSchema,
  documentAnalyzeResultSchema,
  eligibilityEvaluationSchema,
  knowledgeResponseSchema,
} from '@/services/api/schemas';
import type {
  CalculatorScenarioInput,
  CalculatorService,
  DocumentAnalyzeInput,
  DocumentsService,
  EligibilityService,
  KnowledgeService,
} from '@/services/api/types';
import type { EligibilityEvaluation, ParentProfile } from '@/types/journey';

/**
 * REST ↔ FastAPI.
 * Kontrakt eligibility musi zwracać `benefits: BenefitAssessment[]`
 * (conditions, remedies, alternatives, procedure, status A–E).
 */
export class RestEligibilityAdapter implements EligibilityService {
  async evaluate(profile: ParentProfile): Promise<EligibilityEvaluation> {
    const raw = await apiRequest<unknown>(API_PATHS.eligibilityEvaluate, {
      method: 'POST',
      body: { profile: toProfileRequest(profile) },
    });
    return parseApiResponse(
      eligibilityEvaluationSchema,
      raw,
      'eligibility',
    ) as EligibilityEvaluation;
  }
}

export class RestCalculatorAdapter implements CalculatorService {
  async calculate(input: CalculatorScenarioInput) {
    const raw = await apiRequest<unknown>(API_PATHS.calculationsParental, {
      method: 'POST',
      body: {
        profile: toProfileRequest(input.profile),
        leaveSplitMotherWeeks: input.leaveSplitMotherWeeks,
        leaveSplitFatherWeeks: input.leaveSplitFatherWeeks,
        workDuringParental: input.workDuringParental,
      },
    });
    return parseApiResponse(calculatorResultSchema, raw, 'calculator');
  }
}

export class RestDocumentsAdapter implements DocumentsService {
  async analyze(input: DocumentAnalyzeInput) {
    const formData = new FormData();
    formData.append('fileName', input.fileName);
    if (input.mimeType) formData.append('mimeType', input.mimeType);
    if (input.sizeBytes != null) formData.append('sizeBytes', String(input.sizeBytes));

    formData.append('file', {
      uri: input.uri,
      name: input.fileName,
      type: input.mimeType ?? 'application/pdf',
    } as unknown as Blob);

    const raw = await apiRequest<unknown>(API_PATHS.documentsAnalyze, {
      method: 'POST',
      formData,
    });
    return parseApiResponse(documentAnalyzeResultSchema, raw, 'documents');
  }
}

export class RestKnowledgeAdapter implements KnowledgeService {
  async getKnowledge() {
    const raw = await apiRequest<unknown>(API_PATHS.knowledge, { method: 'GET' });
    return parseApiResponse(knowledgeResponseSchema, raw, 'knowledge');
  }
}
