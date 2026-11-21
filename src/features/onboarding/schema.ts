import { z } from 'zod';

export const specialCircumstanceValues = [
  'none',
  'premature_birth',
  'stillbirth',
  'child_death',
  'serious_illness',
  'prefer_not_to_say',
] as const;

export type SpecialCircumstance = (typeof specialCircumstanceValues)[number];

export const SPECIAL_CIRCUMSTANCE_LABELS: Record<SpecialCircumstance, string> = {
  none: 'Brak okoliczności szczególnych',
  premature_birth: 'Wcześniactwo',
  stillbirth: 'Martwe urodzenie',
  child_death: 'Śmierć dziecka',
  serious_illness: 'Ciężka choroba dziecka / rodzica',
  prefer_not_to_say: 'Wolę nie odpowiadać',
};

export const employmentEndedReasonValues = [
  'upadlosc_likwidacja_smierc_pracodawcy',
  'naruszenie_prawa_wyrokiem_sadu',
  'unknown',
] as const;

export const onboardingSchema = z.object({
  stage: z.enum(['planning', 'pregnancy', 'after_birth', 'adoption', 'foster']),
  role: z.enum(['mother', 'father', 'partner', 'guardian']),
  eventDate: z
    .string()
    .refine((value) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: 'Użyj formatu RRRR-MM-DD albo pomiń to pole.',
    }),
  employmentType: z.enum([
    'employment_contract',
    'civil_contract',
    'self_employed',
    'unemployed',
    'other',
    'unknown',
  ]),
  /** unknown = nie wiem — mapowane na null w API, nigdy na false. */
  insuranceStatus: z.enum(['insured', 'not_insured', 'unknown']),
  hasSecondParent: z.boolean(),
  childrenCount: z.number().int().min(1).max(10),
  specialCircumstances: z.array(z.enum(specialCircumstanceValues)).min(1),
  /** Tylko działalność — puste = nie wysyłamy. */
  debtAmountZl: z
    .string()
    .refine((value) => value === '' || /^\d+([.,]\d{1,2})?$/.test(value), {
      message: 'Podaj kwotę w PLN albo zostaw puste.',
    }),
  employmentEndedReason: z.enum(employmentEndedReasonValues),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export const ONBOARDING_STEPS = [
  { id: 'stage', title: 'Twój etap' },
  { id: 'role', title: 'Twoja rola' },
  { id: 'date', title: 'Data' },
  { id: 'work', title: 'Praca i ubezpieczenie' },
  { id: 'family', title: 'Rodzina' },
  { id: 'special', title: 'Okoliczności' },
  { id: 'summary', title: 'Podsumowanie' },
] as const;

export function isSensitiveSituation(circumstances: string[]): boolean {
  return circumstances.some((item) =>
    ['stillbirth', 'child_death', 'serious_illness', 'premature_birth'].includes(item),
  );
}
