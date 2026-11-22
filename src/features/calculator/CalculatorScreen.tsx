import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ApiHealthBanner } from '@/components/ui/ApiHealthBanner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChoiceChip } from '@/components/ui/ChoiceChip';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { LegalDisclaimer } from '@/components/ui/LegalDisclaimer';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import {
  CalculatorComparePanel,
  CalculatorDetailsPanel,
  CalculatorErrorPanel,
  CalculatorResultHero,
  CalculatorSection,
} from '@/features/calculator/CalculatorPanels';
import { parseOptionalNumber } from '@/features/calculator/calculatorFormat';
import { rateVariantLabel } from '@/features/calculator/calculatorPresentation';
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

export function CalculatorScreen() {
  const params = useLocalSearchParams<{
    benefit?: string;
    from?: string;
    compare?: string;
  }>();
  const profile = useUserJourneyStore((s) => s.profile);
  const { columns, isCompact } = useAdaptiveLayout();
  const mode = getApiMode();

  const paramBenefit =
    typeof params.benefit === 'string' &&
    (BENEFIT_CODES as readonly string[]).includes(params.benefit)
      ? (params.benefit as BenefitCode)
      : null;

  const [benefitCode, setBenefitCode] = useState<BenefitCode>(
    paramBenefit ?? 'zasilek_macierzynski_urlop_macierzynski',
  );
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

  const fromBenefit = params.from === 'benefit' && paramBenefit != null;
  const preferCompare =
    params.compare === '1' || benefitCode === 'urlop_rodzicielski';

  useEffect(() => {
    if (paramBenefit) {
      setBenefitCode(paramBenefit);
      setCalcResult(null);
      setCompareResult(null);
    }
  }, [paramBenefit]);

  useEffect(() => {
    setZaZyciem(profile.zaZyciemCertificate === true);
    setFullDose21(profile.fullDoseClaimedWithin21Days !== false);
  }, [profile.zaZyciemCertificate, profile.fullDoseClaimedWithin21Days]);

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
  const twoColumn = columns > 1;

  const backToBenefitHref = (
    paramBenefit
      ? `/benefits/${encodeURIComponent(paramBenefit)}`
      : '/benefits'
  ) as Href;

  return (
    <Screen
      title="Kalkulator"
      subtitle="Ile możesz otrzymać — szacunek z silnika świadczeń."
      backFallbackHref={fromBenefit ? backToBenefitHref : ('/benefits' as Href)}
    >
      <ApiHealthBanner />
      <DemoBanner
        message={
          mode === 'rest'
            ? 'Wyniki z silnika świadczeń. Przy awarii API nie podstawiamy przykładowej kwoty.'
            : 'Dane przykładowe — lokalne przykłady, nie wynik silnika.'
        }
      />
      <LegalDisclaimer />

      {fromBenefit ? (
        <Card style={styles.contextCard}>
          <Badge label="Kontekst świadczenia" tone="primary" />
          <Text style={styles.body}>
            Liczymy: {BENEFIT_CODE_LABEL[benefitCode]}. Dane z ankiety są już
            uwzględnione — uzupełnij tylko dochód i warianty poniżej.
          </Text>
          <Button
            label="Wróć do świadczenia"
            variant="ghost"
            onPress={() => router.push(backToBenefitHref)}
          />
        </Card>
      ) : null}

      {mode === 'rest' ? (
        <View style={[styles.stack, twoColumn && styles.stackDesktop]}>
          <View style={[styles.column, twoColumn && styles.columnLeft]}>
            <CalculatorSection
              step="A"
              title="Twoje dane"
              subtitle="Założenia do symulacji — nie potwierdzenie danych ZUS."
            >
              <Card style={styles.formCard}>
                <View style={styles.formMeta}>
                  <Badge
                    label={mode === 'rest' ? 'Silnik online' : 'Demo'}
                    tone="primary"
                  />
                  <Text style={styles.meta}>{rateVariantLabel(fullDose21)}</Text>
                </View>

                <Text style={styles.fieldLabel}>Świadczenie</Text>
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

                <TextField
                  label="Średni miesięczny dochód / wynagrodzenie"
                  value={incomeA}
                  onChangeText={setIncomeA}
                  keyboardType="numeric"
                  hint="W PLN. Puste pole = silnik może nie zwrócić kwoty procentowej."
                />

                <View style={styles.toggleGroup}>
                  <ChoiceChip
                    label={fullTime ? 'Pełny etat' : 'Niepełny etat / nie wiem'}
                    selected={fullTime}
                    onPress={() => setFullTime((v) => !v)}
                  />
                  <ChoiceChip
                    label={
                      zaZyciem ? '„Za życiem”: tak' : '„Za życiem”: nie'
                    }
                    selected={zaZyciem}
                    onPress={() => setZaZyciem((v) => !v)}
                  />
                  <ChoiceChip
                    label={
                      fullDose21
                        ? 'Wariant 81,5% (wniosek w 21 dni)'
                        : 'Wariant 100% / 70%'
                    }
                    selected={fullDose21}
                    onPress={() => setFullDose21((v) => !v)}
                  />
                </View>

                <Button
                  label={
                    calcMutation.isPending
                      ? 'Liczymy…'
                      : `Policz: ${BENEFIT_CODE_LABEL[benefitCode]}`
                  }
                  onPress={() => calcMutation.mutate()}
                  disabled={calcMutation.isPending}
                  fullWidth
                />

                {calcMutation.isError ? (
                  <CalculatorErrorPanel
                    message={apiErrorMessage(
                      calcMutation.error,
                      'Nie udało się policzyć kwoty. Nie pokazujemy przykładowego wyniku.',
                    )}
                    onRetry={() => calcMutation.mutate()}
                    pending={calcMutation.isPending}
                  />
                ) : null}
              </Card>
            </CalculatorSection>
          </View>

          <View style={[styles.column, twoColumn && styles.columnRight]}>
            <CalculatorSection
              step="B"
              title="Twoje świadczenie"
              subtitle="Główny wynik szacunku z silnika."
            >
              <CalculatorResultHero
                result={calcResult}
                fullDose21={fullDose21}
                empty={!calcResult && !calcMutation.isPending}
                loading={calcMutation.isPending && !calcResult}
              />
            </CalculatorSection>
          </View>

          <View style={styles.fullWidth}>
            {preferCompare || benefitCode === 'urlop_rodzicielski' ? (
              <CalculatorSection
                step="C"
                title="Jak podzielić urlop między rodziców?"
                subtitle="100%/70%, 81,5% i podział tygodni — wyłącznie z odpowiedzi silnika."
              >
                <Card style={styles.formCard}>
                  <Text style={styles.body}>
                    Porównanie trzech wariantów podziału urlopu rodzicielskiego. Nie
                    oznaczamy automatycznie „najlepszego” wariantu. Nieprzenoszalne
                    tygodnie drugiego rodzica nie są lokalnie przeliczane na 81,5%.
                  </Text>
                  <TextField
                    label="Dochód drugiego rodzica"
                    value={incomeB}
                    onChangeText={setIncomeB}
                    keyboardType="numeric"
                    hint="W PLN — używane tylko w porównaniu."
                  />
                  <Button
                    label={
                      compareMutation.isPending
                        ? 'Porównujemy…'
                        : 'Porównaj warianty'
                    }
                    variant="secondary"
                    onPress={() => compareMutation.mutate()}
                    disabled={compareMutation.isPending}
                    fullWidth={isCompact}
                  />
                  {compareMutation.isError ? (
                    <CalculatorErrorPanel
                      message={apiErrorMessage(
                        compareMutation.error,
                        'Porównanie niedostępne. Spróbuj ponownie — bez podstawiania kwoty. Status uprawnienia się nie zmienia.',
                      )}
                      onRetry={() => compareMutation.mutate()}
                      pending={compareMutation.isPending}
                    />
                  ) : null}
                  {compareMutation.isPending && !compareResult ? (
                    <Text style={styles.meta}>Pobieramy warianty z silnika…</Text>
                  ) : null}
                </Card>

                {compareResult ? (
                  <CalculatorComparePanel
                    result={compareResult}
                    fullDose21={fullDose21}
                  />
                ) : null}
              </CalculatorSection>
            ) : null}

            {calcResult ? (
              <CalculatorSection
                step="D"
                title="Szczegóły obliczenia"
                subtitle="Podstawa wymiaru, okresy i stawki — na żądanie."
              >
                <CalculatorDetailsPanel result={calcResult} />
              </CalculatorSection>
            ) : null}

            {calcResult || compareResult ? (
              <CalculatorSection
                step="E"
                title="Co możesz zrobić dalej?"
                subtitle="Kwota to dopiero początek — przygotuj dokumenty i właściwy kanał."
              >
                <Card style={styles.formCard}>
                  <Button
                    label="Sprawdź potrzebne dokumenty"
                    variant="secondary"
                    onPress={() =>
                      router.push(
                        (paramBenefit
                          ? `/benefits/${encodeURIComponent(paramBenefit)}`
                          : '/documents') as Href,
                      )
                    }
                    fullWidth
                  />
                  <Button
                    label="Sprawdź terminy w sprawach"
                    variant="secondary"
                    onPress={() => router.push('/sprawy')}
                    fullWidth
                  />
                  <Button
                    label="Wróć do świadczenia"
                    onPress={() => router.push(backToBenefitHref)}
                    fullWidth
                  />
                </Card>
              </CalculatorSection>
            ) : null}
          </View>
        </View>
      ) : (
        <View style={[styles.stack, twoColumn && styles.layoutRow]}>
          <Card style={twoColumn ? styles.side : undefined}>
            <CalculatorSection
              step="A"
              title="Demo lokalne"
              subtitle="Przykładowe warianty bez FastAPI."
            >
              <Button
                label={
                  calcMutation.isPending ? 'Liczymy…' : 'Policz warianty DEMO'
                }
                onPress={() => calcMutation.mutate()}
                disabled={calcMutation.isPending}
                fullWidth
              />
            </CalculatorSection>
          </Card>
          {mockResult && 'scenarios' in mockResult ? (
            <Card style={twoColumn ? styles.side : undefined}>
              <CalculatorSection step="B" title="Wyniki DEMO">
                {(mockResult.scenarios ?? []).map((scenario) => (
                  <View key={scenario.id} style={styles.mockRow}>
                    <Text style={styles.mockTitle}>{scenario.name}</Text>
                    <Text style={styles.meta}>
                      {scenario.grossAmount == null
                        ? 'niedostępna'
                        : `${scenario.grossAmount} PLN`}
                    </Text>
                  </View>
                ))}
              </CalculatorSection>
            </Card>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

function shortLabel(code: BenefitCode): string {
  const full = BENEFIT_CODE_LABEL[code];
  return full.length > 26 ? `${full.slice(0, 25)}…` : full;
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.xl,
  },
  stackDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  column: {
    gap: spacing.xl,
    width: '100%',
  },
  columnLeft: {
    flexGrow: 1,
    flexBasis: 340,
    maxWidth: 520,
  },
  columnRight: {
    flexGrow: 1,
    flexBasis: 340,
    maxWidth: 640,
  },
  fullWidth: {
    width: '100%',
    gap: spacing.md,
  },
  formCard: {
    gap: spacing.md,
  },
  formMeta: {
    gap: spacing.xs,
  },
  fieldLabel: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  toggleGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
  },
  meta: {
    ...typography.small,
    color: colors.textMuted,
  },
  layoutRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  side: {
    flex: 1,
  },
  mockRow: {
    marginTop: spacing.sm,
    gap: 2,
  },
  mockTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  contextCard: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
});
