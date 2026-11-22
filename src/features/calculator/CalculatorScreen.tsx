import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ApiHealthBanner } from '@/components/ui/ApiHealthBanner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChoiceChip } from '@/components/ui/ChoiceChip';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import {
  NON_TRANSFERABLE_PARENT_NOTE,
  UNVERIFIED_AMOUNT_NOTE,
  hasUnverifiedRateWarning,
  rateVariantLabel,
} from '@/features/calculator/calculatorPresentation';
import { useAdaptiveLayout } from '@/hooks/useAdaptiveLayout';
import { apiErrorMessage } from '@/lib/apiErrorMessage';
import {
  BENEFIT_CODE_LABEL,
  BENEFIT_CODES,
  calculateBenefitAmount,
  calculatorService,
  compareParentalLeave,
  getApiMode,
  mapInsuranceTitle,
  profileToEligibilityCheckRequest,
  type BenefitCode,
  type CalculatedAmount,
  type ParentalLeaveCompareResponse,
} from '@/services/api';
import { useUserJourneyStore } from '@/store/useUserJourneyStore';
import { colors, spacing, typography } from '@/theme';

const SIMULATION_DISCLAIMER =
  'To symulacja kwoty przy przyjętych założeniach. Nie oznacza potwierdzenia prawa do świadczenia.';

export function CalculatorScreen() {
  const params = useLocalSearchParams<{ benefit?: string }>();
  const profile = useUserJourneyStore((s) => s.profile);
  const { columns, isCompact } = useAdaptiveLayout();
  const mode = getApiMode();

  const initialBenefit =
    typeof params.benefit === 'string' &&
    (BENEFIT_CODES as readonly string[]).includes(params.benefit)
      ? (params.benefit as BenefitCode)
      : 'zasilek_macierzynski_urlop_macierzynski';

  const [benefitCode, setBenefitCode] = useState<BenefitCode>(initialBenefit);
  const [incomeA, setIncomeA] = useState('7000');
  const [incomeB, setIncomeB] = useState('6000');
  const [fullTime, setFullTime] = useState(true);
  const [zaZyciem, setZaZyciem] = useState(profile.zaZyciemCertificate === true);
  const [fullDose21, setFullDose21] = useState(
    profile.fullDoseClaimedWithin21Days !== false,
  );
  const [calcResult, setCalcResult] = useState<CalculatedAmount | null>(null);
  const [compareResult, setCompareResult] =
    useState<ParentalLeaveCompareResponse | null>(null);

  const baseRequest = useMemo(
    () => profileToEligibilityCheckRequest(profile),
    [profile],
  );

  const calcMutation = useMutation({
    mutationFn: async () => {
      if (mode !== 'rest') {
        return calculatorService.calculate({
          profile,
          leaveSplitMotherWeeks: 20,
          leaveSplitFatherWeeks: 9,
          workDuringParental: false,
        });
      }

      const income = parseOptionalNumber(incomeA);
      const request = {
        ...baseRequest,
        average_monthly_income_zl: income,
        is_full_time_employment: fullTime,
        za_zyciem_certificate: zaZyciem,
        full_dose_claimed_within_21_days: fullDose21,
      };
      return calculateBenefitAmount(benefitCode, request);
    },
    onSuccess: (data) => {
      if (mode === 'rest') {
        setCalcResult(data as CalculatedAmount);
        setCompareResult(null);
      }
    },
  });

  const compareMutation = useMutation({
    mutationFn: async () => {
      const title = mapInsuranceTitle(profile.employmentType);
      return compareParentalLeave({
        children_count: Math.max(1, profile.childrenCount ?? 1),
        za_zyciem_certificate: zaZyciem,
        full_dose_claimed_within_21_days: fullDose21,
        parent_a: {
          label: 'Rodzic A',
          average_monthly_income_zl: parseOptionalNumber(incomeA),
          insurance_title: title,
          is_full_time_employment: fullTime,
        },
        parent_b: {
          label: 'Rodzic B',
          average_monthly_income_zl: parseOptionalNumber(incomeB),
          insurance_title: title ?? 'umowa_o_prace',
          is_full_time_employment: fullTime,
        },
      });
    },
    onSuccess: (data) => {
      setCompareResult(data);
    },
  });

  /** Po zmianie profilu nie pokazuj starej kwoty jako aktualnej. */
  useEffect(() => {
    setCalcResult(null);
    setCompareResult(null);
  }, [profile]);

  if (!profile.onboardingCompleted) {
    return (
      <Screen>
        <EmptyState
          title="Kalkulator potrzebuje Twojej sytuacji"
          description="Uzupełnij ankietę albo wybierz profil demo — wtedy policzymy warianty."
          actionLabel="Ankieta"
          onAction={() => router.push('/onboarding')}
        />
      </Screen>
    );
  }

  const mockResult = mode !== 'rest' ? calcMutation.data : null;

  return (
    <Screen
      title="Kalkulator świadczeń"
      subtitle="Kwoty i okresy pochodzą z silnika. Aplikacja nie przelicza stawek samodzielnie."
    >
      <ApiHealthBanner />
      <DemoBanner
        message={
          mode === 'rest'
            ? 'Wyniki z silnika świadczeń. Przy awarii API nie podstawiamy przykładowej kwoty.'
            : 'Tryb demonstracyjny — lokalne przykłady, nie wynik silnika.'
        }
      />

      <Card>
        <Text style={styles.disclaimer}>{SIMULATION_DISCLAIMER}</Text>
        <Text style={styles.meta}>{rateVariantLabel(fullDose21)}</Text>
      </Card>

      <View style={styles.headerMeta}>
        <Badge
          label={mode === 'rest' ? 'Silnik online' : 'Demo lokalne'}
          tone="primary"
        />
      </View>

      {mode === 'rest' ? (
        <>
          <Text style={styles.section}>Świadczenie</Text>
          <View style={styles.chips}>
            {BENEFIT_CODES.map((code) => (
              <ChoiceChip
                key={code}
                label={shortLabel(code)}
                selected={benefitCode === code}
                onPress={() => {
                  setBenefitCode(code);
                  setCalcResult(null);
                }}
              />
            ))}
          </View>

          <Card>
            <Text style={styles.section}>Dane do kalkulacji</Text>
            <Text style={styles.body}>
              To Twoje założenia do symulacji — nie potwierdzenie danych ZUS.
            </Text>
            <TextField
              label="Średni miesięczny dochód / wynagrodzenie (PLN)"
              value={incomeA}
              onChangeText={setIncomeA}
              keyboardType="numeric"
              hint="Potrzebne do kwot procentowych. Puste pole = silnik może nie zwrócić kwoty."
            />
            <ChoiceChip
              label={fullTime ? 'Pełny etat: TAK' : 'Pełny etat: NIE / nie wiem'}
              selected={fullTime}
              onPress={() => setFullTime((v) => !v)}
            />
            <ChoiceChip
              label={
                zaZyciem
                  ? 'Zaświadczenie „Za życiem”: TAK'
                  : 'Zaświadczenie „Za życiem”: NIE'
              }
              selected={zaZyciem}
              onPress={() => setZaZyciem((v) => !v)}
            />
            <ChoiceChip
              label={
                fullDose21
                  ? 'Wariant 81,5% (wniosek o pełny wymiar w 21 dni): TAK'
                  : 'Wariant 100% / 70% (bez wniosku o pełny wymiar w 21 dni)'
              }
              selected={fullDose21}
              onPress={() => setFullDose21((v) => !v)}
            />
            <Button
              label={
                calcMutation.isPending
                  ? 'Liczymy…'
                  : `Policz: ${BENEFIT_CODE_LABEL[benefitCode]}`
              }
              onPress={() => calcMutation.mutate()}
              disabled={calcMutation.isPending}
              fullWidth={isCompact}
            />
            {calcMutation.isError ? (
              <View style={styles.errorBlock}>
                <Text style={styles.error}>
                  {apiErrorMessage(
                    calcMutation.error,
                    'Nie udało się policzyć kwoty. Nie pokazujemy przykładowego wyniku.',
                  )}
                </Text>
                <Button
                  label="Spróbuj ponownie"
                  variant="secondary"
                  onPress={() => calcMutation.mutate()}
                  disabled={calcMutation.isPending}
                />
              </View>
            ) : null}
          </Card>

          {calcResult ? (
            <CalculatedAmountCard result={calcResult} fullDose21={fullDose21} />
          ) : null}

          <Card>
            <Text style={styles.section}>Porównanie urlopu rodzicielskiego</Text>
            <Text style={styles.body}>
              Trzy warianty podziału z silnika. Nie oznaczamy automatycznie „najlepszego”.
            </Text>
            <Text style={styles.callout}>{NON_TRANSFERABLE_PARENT_NOTE}</Text>
            <TextField
              label="Dochód drugiego rodzica (PLN)"
              value={incomeB}
              onChangeText={setIncomeB}
              keyboardType="numeric"
            />
            <Button
              label={
                compareMutation.isPending
                  ? 'Porównujemy…'
                  : 'Porównaj 3 warianty podziału'
              }
              variant="secondary"
              onPress={() => compareMutation.mutate()}
              disabled={compareMutation.isPending}
            />
            {compareMutation.isError ? (
              <View style={styles.errorBlock}>
                <Text style={styles.error}>
                  {apiErrorMessage(
                    compareMutation.error,
                    'Porównanie niedostępne. Spróbuj ponownie — bez podstawiania kwoty.',
                  )}
                </Text>
                <Button
                  label="Spróbuj ponownie"
                  variant="secondary"
                  onPress={() => compareMutation.mutate()}
                  disabled={compareMutation.isPending}
                />
              </View>
            ) : null}
          </Card>

          {compareResult ? (
            <CompareCard result={compareResult} fullDose21={fullDose21} />
          ) : null}
        </>
      ) : (
        <View style={[styles.layout, columns > 1 && styles.layoutRow]}>
          <Card style={columns > 1 ? styles.side : undefined}>
            <Text style={styles.section}>Demo lokalne — przykładowe warianty</Text>
            <Button
              label={calcMutation.isPending ? 'Liczymy…' : 'Policz warianty DEMO'}
              onPress={() => calcMutation.mutate()}
              disabled={calcMutation.isPending}
            />
          </Card>
          {mockResult && 'scenarios' in mockResult ? (
            <Card>
              {(mockResult.scenarios ?? []).map((scenario) => (
                <View key={scenario.id} style={styles.variant}>
                  <Text style={styles.cardTitle}>{scenario.name}</Text>
                  <Text style={styles.meta}>
                    Kwota:{' '}
                    {scenario.grossAmount == null
                      ? 'niedostępna'
                      : `${scenario.grossAmount} PLN`}
                  </Text>
                </View>
              ))}
              <Text style={styles.disclaimer}>{SIMULATION_DISCLAIMER}</Text>
            </Card>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

function CalculatedAmountCard({
  result,
  fullDose21,
}: {
  result: CalculatedAmount;
  fullDose21: boolean;
}) {
  const zeroLikeAmount = isZeroAmount(result.total_amount_zl);
  const zeroDays = result.total_days === 0;
  const ambiguousZero = zeroLikeAmount && zeroDays;
  const isLumpSum =
    result.lump_sum_amount_zl != null &&
    result.lump_sum_amount_zl !== '' &&
    result.total_days == null;
  const unverified = hasUnverifiedRateWarning(result.warnings);

  return (
    <Card>
      <Badge
        label={unverified ? 'Kwota wstępna — do weryfikacji' : 'Wynik z silnika'}
        tone={unverified ? 'warning' : 'primary'}
      />
      <Text style={styles.cardTitle}>{result.benefit_name}</Text>
      <Text style={styles.disclaimer}>{SIMULATION_DISCLAIMER}</Text>
      <Text style={styles.meta}>{rateVariantLabel(fullDose21)}</Text>
      {unverified ? <Text style={styles.warn}>{UNVERIFIED_AMOUNT_NOTE}</Text> : null}
      {ambiguousZero ? (
        <Text style={styles.warn}>
          Silnik zwrócił 0 dni i 0 zł przy tych danych. To może oznaczać brak wymiaru dla
          podanych parametrów (np. brak hospitalizacji), a nie ostateczną odmowę.
        </Text>
      ) : null}
      <AmountRow
        label="Łączna kwota"
        value={
          ambiguousZero
            ? '0 zł (wymiar nieustalony)'
            : formatNullableZl(result.total_amount_zl)
        }
        emphasize={!unverified && !ambiguousZero}
      />
      {unverified && result.total_amount_zl ? (
        <Text style={styles.meta}>
          Kwota wyświetlona, ale oznaczona jako nieweryfikowana z powodu ostrzeżeń silnika.
        </Text>
      ) : null}
      <AmountRow label="Ryczałt" value={formatNullableZl(result.lump_sum_amount_zl)} />
      <AmountRow
        label="Liczba dni"
        value={
          result.total_days == null
            ? isLumpSum
              ? 'nie dotyczy (świadczenie kwotowe)'
              : 'nieznana'
            : String(result.total_days)
        }
      />
      {result.basis ? (
        <>
          <Text style={styles.meta}>
            Podstawa miesięczna: {result.basis.monthly_basis_zl} zł · dzienna:{' '}
            {result.basis.daily_basis_zl} zł · potrącenie:{' '}
            {result.basis.deduction_rate_percent}%
          </Text>
          {result.basis.minimum_basis_applied ? (
            <Badge label="Zastosowano podstawę minimalną" tone="warning" />
          ) : null}
          {result.basis.warnings.map((w) => (
            <Text key={w} style={styles.warn}>
              {w}
            </Text>
          ))}
        </>
      ) : (
        <Text style={styles.meta}>Brak podstawy wymiaru (np. świadczenie ryczałtowe).</Text>
      )}
      {result.rate_breakdown.length > 0 ? (
        <>
          <Text style={styles.sectionSmall}>Okresy i stawki z odpowiedzi silnika</Text>
          {result.rate_breakdown.map((period, index) => (
            <Text key={`${period.days}-${index}`} style={styles.meta}>
              {period.days} dni · {period.rate_percentage}% · {period.amount_zl} zł
            </Text>
          ))}
        </>
      ) : null}
      {result.warnings.map((w) => (
        <Text key={w} style={styles.warn}>
          {w}
        </Text>
      ))}
    </Card>
  );
}

function isZeroAmount(value: string | null | undefined): boolean {
  if (value == null || value === '') return false;
  const n = Number(String(value).replace(',', '.'));
  return Number.isFinite(n) && n === 0;
}

function CompareCard({
  result,
  fullDose21,
}: {
  result: ParentalLeaveCompareResponse;
  fullDose21: boolean;
}) {
  const unverified = hasUnverifiedRateWarning(result.warnings);
  const nonTransferable = result.non_transferable_weeks_per_parent;

  return (
    <Card>
      <Badge
        label={unverified ? 'Porównanie wstępne — do weryfikacji' : 'Porównanie z silnika'}
        tone={unverified ? 'warning' : 'primary'}
      />
      <Text style={styles.cardTitle}>Urlop rodzicielski — 3 warianty</Text>
      <Text style={styles.meta}>{rateVariantLabel(fullDose21)}</Text>
      <Text style={styles.meta}>
        Pula: {result.total_pool_weeks} tyg. · stawka modelu w odpowiedzi:{' '}
        {result.rate_percentage}%
      </Text>
      <View style={styles.reservedBlock}>
        <Badge label={`${nonTransferable} tyg. zarezerwowane / rodzic`} tone="warning" />
        <Text style={styles.callout}>{NON_TRANSFERABLE_PARENT_NOTE}</Text>
        <Text style={styles.body}>
          Silnik podaje {nonTransferable} nieprzenoszalnych tygodni na rodzica. Kwoty poniżej
          pochodzą wyłącznie z API — frontend ich nie przelicza.
        </Text>
      </View>
      <Text style={styles.disclaimer}>{SIMULATION_DISCLAIMER}</Text>
      {unverified ? <Text style={styles.warn}>{UNVERIFIED_AMOUNT_NOTE}</Text> : null}
      {result.variants.map((variant) => (
        <View key={variant.label} style={styles.variant}>
          <Text style={styles.cardTitle}>{variant.label}</Text>
          <Text style={styles.body}>
            Rodzic A: {variant.weeks_parent_a} tyg. ·{' '}
            {formatNullableZl(variant.amount_parent_a_zl)}
          </Text>
          <Text style={styles.body}>
            Rodzic B: {variant.weeks_parent_b} tyg. ·{' '}
            {formatNullableZl(variant.amount_parent_b_zl)}
          </Text>
          <Text style={unverified ? styles.body : styles.bodyStrong}>
            Suma rodzinna: {formatNullableZl(variant.total_household_amount_zl)}
            {unverified ? ' (wstępna)' : ''}
          </Text>
        </View>
      ))}
      {result.warnings.map((w) => (
        <Text key={w} style={styles.warn}>
          {w}
        </Text>
      ))}
    </Card>
  );
}

function AmountRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <Text style={styles.body}>
      {label}:{' '}
      <Text style={emphasize ? styles.bodyStrong : styles.body}>{value}</Text>
    </Text>
  );
}

function formatNullableZl(value: string | null | undefined): string {
  if (value == null || value === '') return 'niedostępna';
  return `${value} zł`;
}

function parseOptionalNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function shortLabel(code: BenefitCode): string {
  const full = BENEFIT_CODE_LABEL[code];
  return full.length > 28 ? `${full.slice(0, 27)}…` : full;
}

const styles = StyleSheet.create({
  headerMeta: { gap: spacing.xs },
  meta: { ...typography.small, color: colors.textMuted, marginTop: 4 },
  section: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  sectionSmall: {
    ...typography.bodyStrong,
    color: colors.text,
    marginTop: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  layout: { gap: spacing.md },
  layoutRow: { flexDirection: 'row', alignItems: 'flex-start' },
  side: { flex: 1 },
  cardTitle: { ...typography.bodyStrong, color: colors.text, marginTop: spacing.xs },
  body: { ...typography.body, color: colors.textSecondary, marginTop: 4 },
  bodyStrong: { ...typography.bodyStrong, color: colors.text },
  disclaimer: {
    ...typography.small,
    color: colors.warning,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  warn: { ...typography.small, color: colors.warning, marginTop: 4 },
  error: { ...typography.small, color: colors.danger },
  errorBlock: { gap: spacing.sm, marginTop: spacing.sm },
  callout: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  reservedBlock: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: colors.warningSoft,
    gap: spacing.xs,
  },
  variant: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 2,
  },
});
