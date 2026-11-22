import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChoiceChip } from '@/components/ui/ChoiceChip';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { useAdaptiveLayout } from '@/hooks/useAdaptiveLayout';
import {
  ApiClientError,
  BENEFIT_CODE_LABEL,
  BENEFIT_CODES,
  calculateBenefitAmount,
  calculatorService,
  compareParentalLeave,
  getApiBaseUrl,
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
  const baseUrl = getApiBaseUrl();

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
      subtitle="Kwoty i okresy liczy FastAPI. Frontend nie przelicza stawek samodzielnie."
    >
      <DemoBanner
        message={
          mode === 'rest'
            ? 'REST: calculate/{benefit_code} oraz compare/urlop-rodzicielski. Bez cichego mocka.'
            : 'Tryb mock — lokalne fixture DEMO, nie wyniki FastAPI.'
        }
      />

      <Card>
        <Text style={styles.disclaimer}>{SIMULATION_DISCLAIMER}</Text>
      </Card>

      <View style={styles.headerMeta}>
        <Badge label={mode === 'rest' ? 'REST' : 'Mock'} tone="primary" />
        <Text style={styles.meta}>
          {mode === 'rest'
            ? `${baseUrl}/api/v1/benefits/calculate/{code}`
            : 'MockCalculatorAdapter'}
        </Text>
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
            <Text style={styles.section}>Dane do kalkulacji (nie potwierdzenie ZUS)</Text>
            <TextField
              label="Średni miesięczny dochód / wynagrodzenie (PLN)"
              value={incomeA}
              onChangeText={setIncomeA}
              keyboardType="numeric"
              hint="Wymagane do kwot procentowych. Puste = BE może zwrócić null."
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
                  ? 'Wniosek o pełny wymiar w 21 dni: TAK'
                  : 'Wniosek o pełny wymiar w 21 dni: NIE'
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
              <Text style={styles.error}>
                {calcMutation.error instanceof ApiClientError
                  ? calcMutation.error.message
                  : 'Nie udało się policzyć kwoty (brak fallbacku mock).'}
              </Text>
            ) : null}
          </Card>

          {calcResult ? <CalculatedAmountCard result={calcResult} /> : null}

          <Card>
            <Text style={styles.section}>Porównanie urlopu rodzicielskiego</Text>
            <Text style={styles.body}>
              Wstępne porównanie trzech wariantów z FastAPI. Nie oznaczamy automatycznie
              „najlepszego” wariantu. Uproszczenia stawek 81,5%/70% i 9 tygodni
              nieprzenoszalnych — w ostrzeżeniach API.
            </Text>
            <TextField
              label="Dochód rodzica B (PLN)"
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
              <Text style={styles.error}>
                {compareMutation.error instanceof ApiClientError
                  ? compareMutation.error.message
                  : 'Porównanie niedostępne.'}
              </Text>
            ) : null}
          </Card>

          {compareResult ? <CompareCard result={compareResult} /> : null}
        </>
      ) : (
        <View style={[styles.layout, columns > 1 && styles.layoutRow]}>
          <Card style={columns > 1 ? styles.side : undefined}>
            <Text style={styles.section}>Mock — lokalne warianty</Text>
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
                      ? 'niedostępna (null)'
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

function CalculatedAmountCard({ result }: { result: CalculatedAmount }) {
  const zeroLikeAmount = isZeroAmount(result.total_amount_zl);
  const zeroDays = result.total_days === 0;
  const ambiguousZero = zeroLikeAmount && zeroDays;
  const isLumpSum =
    result.lump_sum_amount_zl != null &&
    result.lump_sum_amount_zl !== '' &&
    result.total_days == null;

  return (
    <Card>
      <Badge label="Wynik calculate" tone="primary" />
      <Text style={styles.cardTitle}>{result.benefit_name}</Text>
      <Text style={styles.disclaimer}>{SIMULATION_DISCLAIMER}</Text>
      {ambiguousZero ? (
        <Text style={styles.warn}>
          Silnik zwrócił 0 dni i 0 zł przy tych danych. To może oznaczać brak wymiaru dla
          podanych parametrów (np. brak hospitalizacji dla uzupełniającego urlopu), a nie
          ostateczną odmowę. Uzupełnij dane w ankiecie i policz ponownie — nie traktujemy
          tego jako przyznanego ani odebranego świadczenia.
        </Text>
      ) : null}
      <AmountRow
        label="Łączna kwota"
        value={
          ambiguousZero
            ? '0 zł (wymiar nieustalony / brak okresu w odpowiedzi)'
            : formatNullableZl(result.total_amount_zl)
        }
      />
      <AmountRow
        label="Ryczałt"
        value={formatNullableZl(result.lump_sum_amount_zl)}
      />
      <AmountRow
        label="Liczba dni"
        value={
          result.total_days == null
            ? isLumpSum
              ? 'nie dotyczy (świadczenie kwotowe)'
              : 'nieznana (null)'
            : String(result.total_days)
        }
      />
      {result.basis ? (
        <>
          <Text style={styles.meta}>
            Podstawa miesięczna: {result.basis.monthly_basis_zl} zł · dzienna:{' '}
            {result.basis.daily_basis_zl} zł
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
      {result.rate_breakdown.map((period, index) => (
        <Text key={`${period.days}-${index}`} style={styles.meta}>
          {period.days} dni · {period.rate_percentage}% · {period.amount_zl} zł
        </Text>
      ))}
      {result.warnings.map((w) => (
        <Text key={w} style={styles.warn}>
          {w}
        </Text>
      ))}
      <Text style={styles.meta}>rules_version: {result.rules_version}</Text>
    </Card>
  );
}

function isZeroAmount(value: string | null | undefined): boolean {
  if (value == null || value === '') return false;
  const n = Number(String(value).replace(',', '.'));
  return Number.isFinite(n) && n === 0;
}

function CompareCard({ result }: { result: ParentalLeaveCompareResponse }) {
  return (
    <Card>
      <Badge label="Wstępne porównanie" tone="warning" />
      <Text style={styles.cardTitle}>Urlop rodzicielski — 3 warianty</Text>
      <Text style={styles.meta}>
        Pula: {result.total_pool_weeks} tyg. · nieprzenoszalne:{' '}
        {result.non_transferable_weeks_per_parent} tyg./rodzic · stawka modelu:{' '}
        {result.rate_percentage}%
      </Text>
      <Text style={styles.disclaimer}>{SIMULATION_DISCLAIMER}</Text>
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
          <Text style={styles.bodyStrong}>
            Suma rodzinna: {formatNullableZl(variant.total_household_amount_zl)}
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

function AmountRow({ label, value }: { label: string; value: string }) {
  return (
    <Text style={styles.body}>
      {label}: <Text style={styles.bodyStrong}>{value}</Text>
    </Text>
  );
}

function formatNullableZl(value: string | null | undefined): string {
  if (value == null || value === '') return 'niedostępna (null)';
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
  meta: { ...typography.small, color: colors.textMuted },
  section: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
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
  error: { ...typography.small, color: colors.danger, marginTop: spacing.sm },
  variant: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 2,
  },
});
