import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChoiceChip } from '@/components/ui/ChoiceChip';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { Screen } from '@/components/ui/Screen';
import { Stepper } from '@/components/ui/Stepper';
import { TextField } from '@/components/ui/TextField';
import {
  ONBOARDING_STEPS,
  SPECIAL_CIRCUMSTANCE_LABELS,
  TRI_STATE_LABELS,
  isSensitiveSituation,
  onboardingSchema,
  triStateToBool,
  type OnboardingFormValues,
  type SpecialCircumstance,
  type TriState,
} from '@/features/onboarding/schema';
import { useAdaptiveLayout } from '@/hooks/useAdaptiveLayout';
import { prefetchCatalogEligibility } from '@/hooks/useCatalogEligibility';
import { useUserJourneyStore } from '@/store/useUserJourneyStore';
import { colors, spacing, typography } from '@/theme';
import {
  EMPLOYMENT_ENDED_REASON_LABELS,
  EMPLOYMENT_LABELS,
  INSURANCE_LABELS,
  ROLE_LABELS,
  STAGE_LABELS,
  type EmploymentEndedReason,
  type EmploymentType,
  type InsuranceStatus,
  type ParentRole,
  type ParentStage,
} from '@/types/journey';

const defaultValues: OnboardingFormValues = {
  stage: 'pregnancy',
  role: 'mother',
  eventDate: '',
  employmentType: 'employment_contract',
  insuranceStatus: 'unknown',
  hasSecondParent: true,
  childrenCount: 1,
  specialCircumstances: ['none'],
  debtAmountZl: '',
  employmentEndedReason: 'unknown',
  fatherInsured: 'unknown',
  childAgeMonths: '',
  zaZyciemCertificate: 'unknown',
  fullDoseClaimedWithin21Days: 'unknown',
  childHospitalizationWeeks: '',
  daysSinceBurial: '',
  isFullTimeEmployment: 'unknown',
  otherEmploymentSecured: 'unknown',
};

export function OnboardingWizard() {
  const params = useLocalSearchParams<{ stage?: string }>();
  const profile = useUserJourneyStore((s) => s.profile);
  const completeOnboarding = useUserJourneyStore((s) => s.completeOnboarding);
  const queryClient = useQueryClient();
  const { isCompact } = useAdaptiveLayout();
  const [step, setStep] = useState(0);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      ...defaultValues,
      stage:
        (params.stage as ParentStage | undefined) ??
        profile.stage ??
        defaultValues.stage,
    },
    mode: 'onChange',
  });

  const values = form.watch();
  const total = ONBOARDING_STEPS.length;
  const current = ONBOARDING_STEPS[step];
  const sensitive = isSensitiveSituation(values.specialCircumstances ?? []);

  useEffect(() => {
    if (params.stage && typeof params.stage === 'string') {
      form.setValue('stage', params.stage as ParentStage);
    }
  }, [params.stage, form]);

  const goNext = async () => {
    if (current.id === 'date') {
      const ok = await form.trigger('eventDate');
      if (!ok) return;
    }
    if (current.id === 'special') {
      const ok = await form.trigger('specialCircumstances');
      if (!ok) return;
    }
    if (step < total - 1) {
      setStep((s) => s + 1);
      return;
    }

    const parsed = onboardingSchema.safeParse(form.getValues());
    if (!parsed.success) {
      const message = parsed.error.issues
        .slice(0, 3)
        .map((issue) => issue.message)
        .join('\n');
      Alert.alert(
        'Uzupełnij ankietę',
        message || 'Sprawdź odpowiedzi i spróbuj ponownie.',
      );
      setStep(0);
      return;
    }

    const data = parsed.data;
    const debtParsed =
      data.debtAmountZl.trim() === ''
        ? null
        : Number(data.debtAmountZl.replace(',', '.'));

    const months =
      data.childAgeMonths.trim() === '' ? null : Number(data.childAgeMonths);
    const hospWeeks =
      data.childHospitalizationWeeks.trim() === ''
        ? null
        : Number(data.childHospitalizationWeeks);
    const burialDays =
      data.daysSinceBurial.trim() === '' ? null : Number(data.daysSinceBurial);

    completeOnboarding({
      stage: data.stage,
      role: data.role,
      eventDate: data.eventDate || null,
      employmentType: data.employmentType,
      insuranceStatus: data.insuranceStatus,
      hasSecondParent: data.hasSecondParent,
      childrenCount: data.childrenCount,
      specialCircumstances: data.specialCircumstances.filter((item) => item !== 'none'),
      debtAmountZl:
        data.employmentType === 'self_employed' && debtParsed != null && !Number.isNaN(debtParsed)
          ? debtParsed
          : null,
      employmentEndedReason:
        data.insuranceStatus === 'not_insured' && data.employmentEndedReason !== 'unknown'
          ? (data.employmentEndedReason as EmploymentEndedReason)
          : null,
      fatherInsured: triStateToBool(data.fatherInsured),
      childAgeMonths:
        months != null && !Number.isNaN(months) ? months : null,
      zaZyciemCertificate: triStateToBool(data.zaZyciemCertificate),
      fullDoseClaimedWithin21Days: triStateToBool(data.fullDoseClaimedWithin21Days),
      childHospitalizationWeeks:
        hospWeeks != null && !Number.isNaN(hospWeeks) ? hospWeeks : null,
      daysSinceBurial:
        burialDays != null && !Number.isNaN(burialDays) ? burialDays : null,
      isFullTimeEmployment: triStateToBool(data.isFullTimeEmployment),
      otherEmploymentSecured: triStateToBool(data.otherEmploymentSecured),
      isDemo: false,
      demoScenarioId: null,
    });
    const nextProfile = useUserJourneyStore.getState().profile;
    void prefetchCatalogEligibility(queryClient, nextProfile);
    router.push('/benefits');
  };

  const goBack = () => {
    if (step === 0) {
      router.back();
      return;
    }
    setStep((s) => s - 1);
  };

  const toggleSpecial = (key: SpecialCircumstance) => {
    const currentValues = form.getValues('specialCircumstances');
    if (key === 'none' || key === 'prefer_not_to_say') {
      form.setValue('specialCircumstances', [key], { shouldValidate: true });
      return;
    }
    const withoutNone = currentValues.filter(
      (item) => item !== 'none' && item !== 'prefer_not_to_say',
    );
    const next = withoutNone.includes(key)
      ? withoutNone.filter((item) => item !== key)
      : [...withoutNone, key];
    form.setValue('specialCircumstances', next.length ? next : ['none'], {
      shouldValidate: true,
    });
  };

  return (
    <Screen
      header={false}
      back={false}
      edges={['left', 'right', 'bottom']}
      keyboardOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <DemoBanner message="Ankieta zostaje u Ciebie — nic nie wysyłamy do ZUS. To nie jest wniosek urzędowy." />
      <View style={styles.header}>
        <Badge label={`Krok ${step + 1} z ${total}`} tone="primary" />
        <Text style={styles.title}>
          {sensitive ? 'Dopasujemy spokojny plan do Twojej sytuacji' : 'Poznajmy Twoją sytuację'}
        </Text>
        <Text style={styles.subtitle}>
          Kilka pytań. Nieznane pola pomiń — uzupełnisz później.
        </Text>
        <Stepper current={step + 1} total={total} label={current.title} />
      </View>

      <Card>
        {current.id === 'stage' ? (
          <ChoiceGroup
            title="Na jakim etapie jesteś?"
            options={(Object.keys(STAGE_LABELS) as ParentStage[]).map((key) => ({
              key,
              label: STAGE_LABELS[key],
            }))}
            selected={values.stage}
            onSelect={(key) => form.setValue('stage', key as ParentStage)}
            compact={isCompact}
          />
        ) : null}

        {current.id === 'role' ? (
          <ChoiceGroup
            title="Kim jesteś w tym planie?"
            options={(Object.keys(ROLE_LABELS) as ParentRole[]).map((key) => ({
              key,
              label: ROLE_LABELS[key],
            }))}
            selected={values.role}
            onSelect={(key) => form.setValue('role', key as ParentRole)}
            compact={isCompact}
          />
        ) : null}

        {current.id === 'date' ? (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>
              {values.stage === 'adoption' || values.stage === 'foster'
                ? 'Data przyjęcia dziecka'
                : values.stage === 'after_birth'
                  ? 'Data porodu'
                  : 'Przewidywana data porodu'}
            </Text>
            <Text style={styles.blockHint}>
              Dotknij pola, żeby otworzyć kalendarz. Możesz też pominąć, jeśli jeszcze nie
              wiesz.
            </Text>
            <Controller
              control={form.control}
              name="eventDate"
              render={({ field, fieldState }) => (
                <DatePickerField
                  label="Data"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Wybierz datę w kalendarzu"
                  error={fieldState.error?.message}
                  hint="Data zapisze się automatycznie po wyborze dnia."
                />
              )}
            />
          </View>
        ) : null}

        {current.id === 'work' ? (
          <View style={styles.block}>
            <ChoiceGroup
              title="Forma zatrudnienia / tytuł ubezpieczenia"
              options={(Object.keys(EMPLOYMENT_LABELS) as EmploymentType[]).map((key) => ({
                key,
                label: EMPLOYMENT_LABELS[key],
              }))}
              selected={values.employmentType}
              onSelect={(key) => form.setValue('employmentType', key as EmploymentType)}
              compact={isCompact}
            />
            <ChoiceGroup
              title={
                values.stage === 'pregnancy' || values.stage === 'planning'
                  ? 'Ubezpieczenie chorobowe w dniu porodu (planowane / przewidywane)'
                  : 'Ubezpieczenie chorobowe w dniu porodu'
              }
              options={(Object.keys(INSURANCE_LABELS) as InsuranceStatus[]).map((key) => ({
                key,
                label: INSURANCE_LABELS[key],
              }))}
              selected={values.insuranceStatus}
              onSelect={(key) => form.setValue('insuranceStatus', key as InsuranceStatus)}
              compact={isCompact}
            />
            <Text style={styles.blockHint}>
              „Nie wiem” nie jest wysyłane do API jako „nie”. Przy ciąży wynik traktujemy jako
              wstępny scenariusz, nie historyczny fakt.
            </Text>

            {values.employmentType === 'self_employed' ? (
              <Controller
                control={form.control}
                name="debtAmountZl"
                render={({ field, fieldState }) => (
                  <TextField
                    label="Zadłużenie składkowe (PLN), jeśli dotyczy"
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder="0"
                    hint="Pole tylko dla działalności. Zostaw puste, jeśli nie wiesz."
                    error={fieldState.error?.message}
                    keyboardType="numeric"
                  />
                )}
              />
            ) : null}

            {values.insuranceStatus === 'not_insured' ? (
              <ChoiceGroup
                title="Powód ustania ubezpieczenia / zatrudnienia w ciąży (opcjonalnie)"
                options={[
                  ...(
                    Object.keys(EMPLOYMENT_ENDED_REASON_LABELS) as EmploymentEndedReason[]
                  ).map((key) => ({
                    key,
                    label: EMPLOYMENT_ENDED_REASON_LABELS[key],
                  })),
                  { key: 'unknown', label: 'Nie wiem / pomiń' },
                ]}
                selected={values.employmentEndedReason}
                onSelect={(key) =>
                  form.setValue(
                    'employmentEndedReason',
                    key as OnboardingFormValues['employmentEndedReason'],
                  )
                }
                compact={isCompact}
              />
            ) : null}
          </View>
        ) : null}

        {current.id === 'family' ? (
          <View style={styles.block}>
            <ChoiceGroup
              title="Czy w planie jest drugi rodzic?"
              options={[
                { key: 'yes', label: 'Tak' },
                { key: 'no', label: 'Nie / na razie tylko ja' },
              ]}
              selected={values.hasSecondParent ? 'yes' : 'no'}
              onSelect={(key) => form.setValue('hasSecondParent', key === 'yes')}
              compact={isCompact}
            />
            <ChoiceGroup
              title="Liczba dzieci w tym wydarzeniu"
              options={[1, 2, 3].map((n) => ({
                key: String(n),
                label: String(n),
              }))}
              selected={String(values.childrenCount)}
              onSelect={(key) => form.setValue('childrenCount', Number(key))}
              compact={isCompact}
            />
          </View>
        ) : null}

        {current.id === 'special' ? (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Okoliczności szczególne</Text>
            <Text style={styles.blockHint}>
              Pytamy tylko po to, by ukryć nieadekwatne komunikaty i pokazać właściwe
              dokumenty. Nie zbieramy zbędnych szczegółów medycznych.
            </Text>
            <View style={[styles.choices, !isCompact && styles.choicesGrid]}>
              {(Object.keys(SPECIAL_CIRCUMSTANCE_LABELS) as SpecialCircumstance[]).map(
                (key) => (
                  <View key={key} style={!isCompact ? styles.choiceItem : undefined}>
                    <ChoiceChip
                      label={SPECIAL_CIRCUMSTANCE_LABELS[key]}
                      selected={values.specialCircumstances.includes(key)}
                      onPress={() => toggleSpecial(key)}
                    />
                  </View>
                ),
              )}
            </View>
          </View>
        ) : null}

        {current.id === 'engine' ? (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Szczegóły potrzebne silnikowi uprawnień</Text>
            <Text style={styles.blockHint}>
              „Nie wiem” trafia do API jako brak danych (null), nie jako „nie”. Deklaracja
              nie jest potwierdzeniem ZUS. Dochód zbieramy dopiero w kalkulatorze.
            </Text>

            {(values.role === 'father' || values.hasSecondParent) && (
              <ChoiceGroup
                title="Czy ojciec / drugi rodzic ma ubezpieczenie chorobowe?"
                options={(Object.keys(TRI_STATE_LABELS) as TriState[]).map((key) => ({
                  key,
                  label: TRI_STATE_LABELS[key],
                }))}
                selected={values.fatherInsured}
                onSelect={(key) => form.setValue('fatherInsured', key as TriState)}
                compact={isCompact}
              />
            )}

            {(values.stage === 'after_birth' || values.role === 'father') && (
              <Controller
                control={form.control}
                name="childAgeMonths"
                render={({ field, fieldState }) => (
                  <TextField
                    label="Wiek dziecka (pełne miesiące)"
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder="np. 2"
                    hint="Ważne m.in. dla urlopu ojcowskiego. Puste = nie wiem."
                    error={fieldState.error?.message}
                    keyboardType="numeric"
                  />
                )}
              />
            )}

            <ChoiceGroup
              title="Zaświadczenie „Za życiem”?"
              options={(Object.keys(TRI_STATE_LABELS) as TriState[]).map((key) => ({
                key,
                label: TRI_STATE_LABELS[key],
              }))}
              selected={values.zaZyciemCertificate}
              onSelect={(key) => form.setValue('zaZyciemCertificate', key as TriState)}
              compact={isCompact}
            />

            <ChoiceGroup
              title="Wniosek o pełny wymiar urlopu rodzicielskiego w 21 dni od porodu?"
              options={(Object.keys(TRI_STATE_LABELS) as TriState[]).map((key) => ({
                key,
                label: TRI_STATE_LABELS[key],
              }))}
              selected={values.fullDoseClaimedWithin21Days}
              onSelect={(key) =>
                form.setValue('fullDoseClaimedWithin21Days', key as TriState)
              }
              compact={isCompact}
            />

            <ChoiceGroup
              title="Zatrudnienie w pełnym wymiarze czasu pracy?"
              options={(Object.keys(TRI_STATE_LABELS) as TriState[]).map((key) => ({
                key,
                label: TRI_STATE_LABELS[key],
              }))}
              selected={values.isFullTimeEmployment}
              onSelect={(key) => form.setValue('isFullTimeEmployment', key as TriState)}
              compact={isCompact}
            />

            {values.insuranceStatus === 'not_insured' ? (
              <ChoiceGroup
                title="Czy po ustaniu zatrudnienia zapewniono inne zatrudnienie? (art. 30)"
                options={(Object.keys(TRI_STATE_LABELS) as TriState[]).map((key) => ({
                  key,
                  label: TRI_STATE_LABELS[key],
                }))}
                selected={values.otherEmploymentSecured}
                onSelect={(key) =>
                  form.setValue('otherEmploymentSecured', key as TriState)
                }
                compact={isCompact}
              />
            ) : null}

            {values.specialCircumstances.includes('premature_birth') ||
            values.stage === 'after_birth' ? (
              <Controller
                control={form.control}
                name="childHospitalizationWeeks"
                render={({ field, fieldState }) => (
                  <TextField
                    label="Tygodnie hospitalizacji noworodka (jeśli dotyczy)"
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder="puste = nie wiem"
                    hint="Uzupełniający urlop macierzyński — nie zgadujemy wartości."
                    error={fieldState.error?.message}
                    keyboardType="numeric"
                  />
                )}
              />
            ) : null}

            {values.specialCircumstances.includes('stillbirth') ||
            values.specialCircumstances.includes('child_death') ? (
              <Controller
                control={form.control}
                name="daysSinceBurial"
                render={({ field, fieldState }) => (
                  <TextField
                    label="Dni od pochówku (zasiłek pogrzebowy)"
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder="puste = nie wiem"
                    error={fieldState.error?.message}
                    keyboardType="numeric"
                  />
                )}
              />
            ) : null}
          </View>
        ) : null}

        {current.id === 'summary' ? (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Sprawdź, zanim przejdziemy do planu</Text>
            <SummaryRow label="Etap" value={STAGE_LABELS[values.stage] ?? '—'} />
            <SummaryRow label="Rola" value={ROLE_LABELS[values.role] ?? '—'} />
            <SummaryRow
              label="Data"
              value={values.eventDate ? values.eventDate : 'Pominięto'}
            />
            <SummaryRow
              label="Zatrudnienie"
              value={EMPLOYMENT_LABELS[values.employmentType] ?? '—'}
            />
            <SummaryRow
              label="Ubezpieczenie"
              value={INSURANCE_LABELS[values.insuranceStatus] ?? '—'}
            />
            <SummaryRow
              label="Drugi rodzic"
              value={values.hasSecondParent ? 'Tak' : 'Nie'}
            />
            <SummaryRow label="Dzieci" value={String(values.childrenCount ?? '—')} />
            <SummaryRow
              label="Okoliczności"
              value={
                (values.specialCircumstances ?? [])
                  .map((item) => SPECIAL_CIRCUMSTANCE_LABELS[item] ?? item)
                  .join(', ') || '—'
              }
            />
            <Text style={styles.blockHint}>
              Wynik będzie oceną informacyjną — nie decyzją ZUS.
            </Text>
          </View>
        ) : null}
      </Card>

      <View style={[styles.actions, isCompact && styles.actionsStack]}>
        <Button
          label={step === 0 ? 'Wróć' : 'Wstecz'}
          variant="secondary"
          onPress={goBack}
          fullWidth={isCompact}
        />
        {current.id === 'date' ? (
          <Button
            label="Pomiń datę"
            variant="ghost"
            onPress={() => {
              form.setValue('eventDate', '');
              setStep((s) => s + 1);
            }}
            fullWidth={isCompact}
          />
        ) : null}
        <Button
          label={step === total - 1 ? 'Zobacz Moje świadczenia' : 'Dalej'}
          onPress={goNext}
          fullWidth={isCompact}
        />
      </View>
    </Screen>
  );
}

function ChoiceGroup({
  title,
  options,
  selected,
  onSelect,
  compact,
}: {
  title: string;
  options: { key: string; label: string }[];
  selected: string;
  onSelect: (key: string) => void;
  compact: boolean;
}) {
  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{title}</Text>
      <View style={[styles.choices, !compact && styles.choicesGrid]}>
        {options.map((option) => (
          <View key={option.key} style={!compact ? styles.choiceItem : undefined}>
            <ChoiceChip
              label={option.label}
              selected={selected === option.key}
              onPress={() => onSelect(option.key)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    maxWidth: 640,
  },
  block: {
    gap: spacing.md,
  },
  blockTitle: {
    ...typography.h3,
    color: colors.text,
  },
  blockHint: {
    ...typography.small,
    color: colors.textMuted,
  },
  choices: {
    gap: spacing.sm,
  },
  choicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  choiceItem: {
    width: '48%',
    minWidth: 200,
    flexGrow: 1,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'flex-end',
    paddingBottom: spacing.lg,
  },
  actionsStack: {
    flexDirection: 'column-reverse',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabel: {
    ...typography.small,
    color: colors.textMuted,
  },
  summaryValue: {
    ...typography.bodyStrong,
    color: colors.text,
    flexShrink: 1,
    textAlign: 'right',
  },
});
