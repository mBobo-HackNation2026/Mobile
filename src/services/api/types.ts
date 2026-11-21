import type { BenefitDeadline } from '@/types/calendar';
import type { EligibilityEvaluation, ParentProfile } from '@/types/journey';

export interface EligibilityService {
  evaluate(profile: ParentProfile): Promise<EligibilityEvaluation>;
}

export interface CalculatorScenarioInput {
  profile: ParentProfile;
  leaveSplitMotherWeeks?: number;
  leaveSplitFatherWeeks?: number;
  workDuringParental?: boolean;
}

export interface CalculatorPeriod {
  id: string;
  label: string;
  startDate: string | null;
  endDate: string | null;
  weeks: number | null;
  recipient: 'mother' | 'father' | 'shared' | 'unknown';
}

export interface CalculatorScenarioResult {
  id: string;
  name: string;
  periods: CalculatorPeriod[];
  grossAmount: number | null;
  currency: 'PLN';
  assumptions: string[];
  warnings: string[];
  missingInputs: string[];
}

export interface CalculatorResult {
  isDemo: boolean;
  ruleSetVersion: string;
  calculatedAt: string;
  scenarios: CalculatorScenarioResult[];
  sourceUrls: string[];
  assumptions: string[];
  warnings: string[];
  missingInputs: string[];
}

export interface CalculatorService {
  calculate(input: CalculatorScenarioInput): Promise<CalculatorResult>;
}

export interface DocumentAnalyzeInput {
  uri: string;
  fileName: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
}

export interface DocumentField {
  key: string;
  label: string;
  value: string | null;
  confidence: number | null;
  editable: boolean;
}

export interface DocumentAnalyzeResult {
  isDemo: boolean;
  ruleSetVersion: string;
  analyzedAt: string;
  status: 'ok' | 'unsupported' | 'partial' | 'error';
  documentType: string | null;
  fields: DocumentField[];
  message?: string;
  sourceUrls: string[];
  assumptions: string[];
  warnings: string[];
  missingInputs: string[];
}

export interface DocumentsService {
  analyze(input: DocumentAnalyzeInput): Promise<DocumentAnalyzeResult>;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  summary: string;
  officialUrl: string | null;
  updatedAt: string | null;
  tags: string[];
}

export interface KnowledgeResponse {
  items: KnowledgeItem[];
  updatedAt: string | null;
  isDemo: boolean;
}

export interface KnowledgeService {
  getKnowledge(): Promise<KnowledgeResponse>;
}

export interface ApiServices {
  eligibility: EligibilityService;
  calculator: CalculatorService;
  documents: DocumentsService;
  knowledge: KnowledgeService;
}

/** Re-export for adapters that build deadline lists. */
export type { BenefitDeadline };
