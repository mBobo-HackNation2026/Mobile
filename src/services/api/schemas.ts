import { z } from 'zod';

import { INSTITUTION_IDS } from '@/types/institutions';

const institutionIdSchema = z.enum(
  INSTITUTION_IDS as [typeof INSTITUTION_IDS[number], ...typeof INSTITUTION_IDS[number][]],
);

/** Wspólne pola odpowiedzi symulacji / reguł (FastAPI). */
export const ruleMetaSchema = z.object({
  isDemo: z.boolean(),
  ruleSetVersion: z.string(),
  sourceUrls: z.array(z.string()).default([]),
  assumptions: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  missingInputs: z.array(z.string()).default([]),
});

export const parentProfileRequestSchema = z.object({
  stage: z
    .enum(['planning', 'pregnancy', 'after_birth', 'adoption', 'foster'])
    .nullable(),
  role: z.enum(['mother', 'father', 'partner', 'guardian']).nullable(),
  eventDate: z.string().nullable(),
  employmentType: z
    .enum([
      'employment_contract',
      'civil_contract',
      'self_employed',
      'unemployed',
      'other',
      'unknown',
    ])
    .nullable(),
  insuranceStatus: z.enum(['insured', 'not_insured', 'unknown']).nullable(),
  hasSecondParent: z.boolean().nullable(),
  childrenCount: z.number().int().nullable(),
  specialCircumstances: z.array(z.string()).default([]),
});

export const benefitDeadlineSchema = z.object({
  id: z.string(),
  title: z.string(),
  submitBy: z.string(),
  windowStart: z.string().nullable(),
  kind: z.enum([
    'benefit_submission',
    'document',
    'employer',
    'follow_up',
    'custom',
  ]),
  benefitId: z.string().nullable(),
  description: z.string(),
  office: z.string().nullable(),
  officialUrl: z.string().nullable(),
  relatedChecklistId: z.string().nullable(),
  isDemo: z.literal(true).or(z.boolean()),
});

const checklistStatusSchema = z
  .enum(['todo', 'pending', 'done', 'now', 'later'])
  .transform((value) => {
    if (value === 'now') return 'todo' as const;
    if (value === 'later') return 'pending' as const;
    return value;
  });

export const checklistItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: checklistStatusSchema,
  dueDate: z.string().nullable(),
  documents: z.array(z.string()),
  office: z.string().nullable(),
  officialUrl: z.string().nullable(),
  ctaLabel: z.string(),
  ctaHref: z.string(),
  priority: z.enum(['required', 'optional', 'needs_verification']).optional(),
});

export const benefitConditionSchema = z.object({
  id: z.string(),
  label: z.string(),
  state: z.enum(['met', 'unmet', 'unknown']),
  explanation: z.string(),
});

export const benefitRemedySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  kind: z.enum([
    'missing_document',
    'correct_data',
    'future_change',
    'alternative_benefit',
    'institution_contact',
  ]),
  affects: z.enum(['current', 'future', 'unknown']),
  limitations: z.array(z.string()),
  ctaLabel: z.string(),
  ctaHref: z.string(),
});

export const benefitAssessmentSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum([
    'likely_eligible',
    'obstacle_with_options',
    'not_eligible',
    'insufficient_data',
    'needs_review',
  ]),
  headline: z.string(),
  summary: z.string(),
  rationale: z.string(),
  nextStepLabel: z.string(),
  nextStepHref: z.string(),
  conditions: z.array(benefitConditionSchema).default([]),
  remedies: z.array(benefitRemedySchema).default([]),
  alternatives: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        reason: z.string(),
      }),
    )
    .default([]),
  procedure: z
    .object({
      formCode: z.string().nullable(),
      documents: z.array(z.string()),
      office: z.string().nullable(),
      submitBy: z.string().nullable(),
      steps: z.array(z.string()),
      simulatedSubmission: z.boolean(),
    })
    .nullable(),
  institution: institutionIdSchema.nullable().optional().default(null),
  amountNote: z.string().nullable(),
  sourceUrls: z.array(z.string()),
  legalBasisNote: z.string().nullable(),
  requiresVerification: z.boolean(),
});

/** @deprecated alias — używaj benefitAssessmentSchema */
export const benefitSummarySchema = benefitAssessmentSchema;

export const relatedBenefitHintSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  whyShown: z.string(),
  officialUrl: z.string(),
  sourceLabel: z.string(),
  institution: institutionIdSchema.nullable().optional().default(null),
  isDemo: z.boolean(),
});

export const deadlineRadarItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  submitBy: z.string(),
  urgency: z.enum(['overdue', 'urgent', 'soon', 'planned']),
  warning: z.string().nullable(),
  actionLabel: z.string(),
  actionHref: z.string(),
  benefitId: z.string().nullable(),
  office: z.string().nullable(),
  isDemo: z.boolean(),
});

export const postpartumKitItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  documents: z.array(z.string()),
  status: checklistStatusSchema,
  dueDate: z.string().nullable(),
  ctaLabel: z.string(),
  ctaHref: z.string(),
  priority: z.enum(['required', 'optional', 'needs_verification']),
});

export const postpartumKitSchema = z.object({
  isApplicable: z.boolean(),
  headline: z.string(),
  stageContext: z
    .enum(['planning', 'pregnancy', 'after_birth', 'adoption', 'foster'])
    .nullable(),
  items: z.array(postpartumKitItemSchema),
  sourceUrls: z.array(z.string()),
  isDemo: z.boolean(),
});

export const applicationDocumentSchema = z.object({
  id: z.string(),
  title: z.string(),
  formCode: z.string().nullable(),
  required: z.boolean(),
  status: z.enum(['missing', 'ready', 'optional', 'retired']),
  purpose: z.string(),
  linkedApplicationId: z.string(),
  linkedApplicationTitle: z.string(),
  officialUrl: z.string().nullable(),
  isDemo: z.boolean(),
});

export const documentApplicationGroupSchema = z.object({
  id: z.string(),
  title: z.string(),
  formCode: z.string().nullable(),
  benefitId: z.string().nullable(),
  documents: z.array(applicationDocumentSchema),
});

export const documentAssistantBundleSchema = z.object({
  applications: z.array(documentApplicationGroupSchema),
  retiredNote: z.string().nullable(),
  isDemo: z.boolean(),
});

export const eligibilityEvaluationSchema = ruleMetaSchema.extend({
  evaluatedAt: z.string(),
  nextAction: z.object({
    title: z.string(),
    description: z.string(),
    ctaLabel: z.string(),
    ctaHref: z.string(),
  }),
  upcomingDeadline: z
    .object({
      id: z.string(),
      title: z.string(),
      date: z.string(),
      relatedChecklistId: z.string().nullable(),
    })
    .nullable(),
  deadlines: z.array(benefitDeadlineSchema).default([]),
  benefits: z.array(benefitAssessmentSchema),
  checklist: z.array(checklistItemSchema),
  relatedBenefits: z.array(relatedBenefitHintSchema).default([]),
  deadlineRadar: z.array(deadlineRadarItemSchema).default([]),
  postpartumKit: postpartumKitSchema.nullable().default(null),
  documentAssistant: documentAssistantBundleSchema.default({
    applications: [],
    retiredNote: null,
    isDemo: true,
  }),
});

export const calculatorRequestSchema = z.object({
  profile: parentProfileRequestSchema,
  leaveSplitMotherWeeks: z.number().int().positive().optional(),
  leaveSplitFatherWeeks: z.number().int().positive().optional(),
  workDuringParental: z.boolean().optional(),
});

export const calculatorPeriodSchema = z.object({
  id: z.string(),
  label: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  weeks: z.number().nullable(),
  recipient: z.enum(['mother', 'father', 'shared', 'unknown']),
});

export const calculatorScenarioSchema = z.object({
  id: z.string(),
  name: z.string(),
  periods: z.array(calculatorPeriodSchema),
  grossAmount: z.number().nullable(),
  currency: z.literal('PLN'),
  assumptions: z.array(z.string()),
  warnings: z.array(z.string()),
  missingInputs: z.array(z.string()),
});

export const calculatorResultSchema = ruleMetaSchema.extend({
  calculatedAt: z.string(),
  scenarios: z.array(calculatorScenarioSchema),
});

export const documentAnalyzeRequestMetaSchema = z.object({
  fileName: z.string(),
  mimeType: z.string().optional(),
  sizeBytes: z.number().optional(),
});

export const documentFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.string().nullable(),
  confidence: z.number().min(0).max(1).nullable(),
  editable: z.boolean().default(true),
});

export const documentAnalyzeResultSchema = ruleMetaSchema.extend({
  analyzedAt: z.string(),
  status: z.enum(['ok', 'unsupported', 'partial', 'error']),
  documentType: z.string().nullable(),
  fields: z.array(documentFieldSchema),
  message: z.string().optional(),
});

export const knowledgeItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  officialUrl: z.string().nullable(),
  updatedAt: z.string().nullable(),
  tags: z.array(z.string()).default([]),
});

export const knowledgeResponseSchema = z.object({
  items: z.array(knowledgeItemSchema),
  updatedAt: z.string().nullable(),
  isDemo: z.boolean(),
});

export const apiErrorSchema = z.object({
  detail: z
    .union([
      z.string(),
      z.array(
        z.object({
          loc: z.array(z.union([z.string(), z.number()])).optional(),
          msg: z.string(),
          type: z.string().optional(),
        }),
      ),
    ])
    .optional(),
  message: z.string().optional(),
  code: z.string().optional(),
  error_code: z.string().optional(),
});

export type EligibilityEvaluationDto = z.infer<typeof eligibilityEvaluationSchema>;
export type CalculatorResultDto = z.infer<typeof calculatorResultSchema>;
export type DocumentAnalyzeResultDto = z.infer<typeof documentAnalyzeResultSchema>;
export type KnowledgeResponseDto = z.infer<typeof knowledgeResponseSchema>;
