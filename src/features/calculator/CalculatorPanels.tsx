import { type ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  NON_TRANSFERABLE_PARENT_NOTE,
  UNVERIFIED_AMOUNT_NOTE,
  hasUnverifiedRateWarning,
  rateVariantLabel,
} from '@/features/calculator/calculatorPresentation';
import {
  formatAmountDisplay,
  formatNullableZl,
  isZeroAmount,
  primaryRateFromBreakdown,
} from '@/features/calculator/calculatorFormat';
import type {
  CalculatedAmount,
  ParentalLeaveCompareResponse,
} from '@/services/api';
import { colors, radii, spacing, typography } from '@/theme';

export function CalculatorSection({
  step,
  title,
  subtitle,
  children,
}: {
  step: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.sectionWrap}>
      <View style={styles.sectionHeader}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepText}>{step}</Text>
        </View>
        <View style={styles.sectionTitles}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );
}

export function CalculatorErrorPanel({
  message,
  onRetry,
  pending,
}: {
  message: string;
  onRetry: () => void;
  pending?: boolean;
}) {
  return (
    <View style={styles.errorPanel} accessibilityRole="alert">
      <Badge label="Błąd obliczenia" tone="danger" />
      <Text style={styles.errorText}>{message}</Text>
      <Button
        label="Spróbuj ponownie"
        variant="secondary"
        onPress={onRetry}
        disabled={pending}
      />
    </View>
  );
}

export function CalculatorResultHero({
  result,
  fullDose21,
  empty,
  loading,
}: {
  result: CalculatedAmount | null;
  fullDose21: boolean;
  empty?: boolean;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card style={styles.heroCard}>
        <Text style={styles.heroLoading}>Liczymy kwotę w silniku…</Text>
      </Card>
    );
  }

  if (empty || !result) {
    return (
      <Card style={styles.heroEmpty}>
        <Badge label="Oczekuje na obliczenie" tone="neutral" />
        <Text style={styles.heroEmptyTitle}>Twoje świadczenie pojawi się tutaj</Text>
        <Text style={styles.heroEmptyBody}>
          Uzupełnij dane i naciśnij „Policz”. Kwota pochodzi wyłącznie z silnika — bez
          lokalnych przeliczeń.
        </Text>
      </Card>
    );
  }

  const unverified = hasUnverifiedRateWarning(result.warnings);
  const ambiguousZero =
    isZeroAmount(result.total_amount_zl) && result.total_days === 0;
  const isLumpSum =
    result.lump_sum_amount_zl != null &&
    result.lump_sum_amount_zl !== '' &&
    result.total_days == null;
  const displayAmount = ambiguousZero
    ? '0 zł'
    : formatAmountDisplay(
        result.total_amount_zl ?? result.lump_sum_amount_zl ?? null,
      );
  const rate = primaryRateFromBreakdown(result.rate_breakdown);

  return (
    <Card style={unverified ? styles.heroCardWarn : styles.heroCard}>
      <View style={styles.heroTop}>
        <Badge
          label={
            unverified
              ? 'Szacunek — wymaga weryfikacji'
              : ambiguousZero
                ? 'Wymiar nieustalony'
                : 'Szacunek z silnika'
          }
          tone={unverified || ambiguousZero ? 'warning' : 'success'}
        />
        <Text style={styles.heroVariant}>{rateVariantLabel(fullDose21)}</Text>
      </View>
      <Text style={styles.heroName}>{result.benefit_name}</Text>
      <Text
        style={[styles.heroAmount, unverified && styles.heroAmountMuted]}
        accessibilityRole="text"
      >
        {displayAmount}
      </Text>
      {unverified ? <Text style={styles.warn}>{UNVERIFIED_AMOUNT_NOTE}</Text> : null}
      {ambiguousZero ? (
        <Text style={styles.warn}>
          Silnik zwrócił 0 dni i 0 zł. To może oznaczać brak wymiaru przy tych danych, a nie
          ostateczną odmowę.
        </Text>
      ) : null}
      <View style={styles.heroMetaRow}>
        <MetaChip
          label="Okres"
          value={
            result.total_days == null
              ? isLumpSum
                ? 'ryczałt'
                : 'nieznany'
              : `${result.total_days} dni`
          }
        />
        <MetaChip
          label="Stawka"
          value={rate ? `${rate}%` : fullDose21 ? '81,5%*' : '100/70%*'}
        />
        {result.lump_sum_amount_zl ? (
          <MetaChip
            label="Ryczałt"
            value={formatNullableZl(result.lump_sum_amount_zl)}
          />
        ) : null}
      </View>
      <Text style={styles.disclaimer}>
        Symulacja przy przyjętych założeniach. Nie jest decyzją ZUS.
      </Text>
    </Card>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaChip}>
      <Text style={styles.metaChipLabel}>{label}</Text>
      <Text style={styles.metaChipValue}>{value}</Text>
    </View>
  );
}

export function CalculatorComparePanel({
  result,
  fullDose21,
}: {
  result: ParentalLeaveCompareResponse;
  fullDose21: boolean;
}) {
  const unverified = hasUnverifiedRateWarning(result.warnings);
  const pool = Math.max(1, result.total_pool_weeks);

  return (
    <View style={styles.compareWrap}>
      <View style={styles.compareIntro}>
        <Badge
          label={
            unverified
              ? 'Porównanie wstępne — do weryfikacji'
              : 'Porównanie z silnika'
          }
          tone={unverified ? 'warning' : 'primary'}
        />
        <Text style={styles.compareMeta}>
          Pula {result.total_pool_weeks} tyg. · model stawki w odpowiedzi:{' '}
          {result.rate_percentage}% · {rateVariantLabel(fullDose21)}
        </Text>
        {unverified ? <Text style={styles.warn}>{UNVERIFIED_AMOUNT_NOTE}</Text> : null}
      </View>

      <View style={styles.reservedCard}>
        <Badge
          label={`${result.non_transferable_weeks_per_parent} tyg. · stawka 70%`}
          tone="warning"
        />
        <Text style={styles.reservedTitle}>
          Nieprzenoszalne tygodnie drugiego rodzica
        </Text>
        <Text style={styles.reservedBody}>{NON_TRANSFERABLE_PARENT_NOTE}</Text>
        <Text style={styles.reservedHint}>
          Wartość {result.non_transferable_weeks_per_parent} tyg. pochodzi z odpowiedzi
          silnika. Frontend nie przelicza kwoty za ten okres.
        </Text>
      </View>

      <View style={styles.variantGrid}>
        {result.variants.map((variant) => {
          const shareA = Math.min(100, (variant.weeks_parent_a / pool) * 100);
          const shareB = Math.min(100, (variant.weeks_parent_b / pool) * 100);
          return (
            <Card key={variant.label} style={styles.variantCard}>
              <Text style={styles.variantTitle}>{variant.label}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barA, { width: `${shareA}%` }]} />
                <View style={[styles.barB, { width: `${shareB}%` }]} />
              </View>
              <Text style={styles.variantLine}>
                Rodzic A · {variant.weeks_parent_a} tyg.
              </Text>
              <Text style={styles.variantAmount}>
                {formatNullableZl(variant.amount_parent_a_zl)}
              </Text>
              <Text style={styles.variantLine}>
                Rodzic B · {variant.weeks_parent_b} tyg.
              </Text>
              <Text style={styles.variantAmount}>
                {formatNullableZl(variant.amount_parent_b_zl)}
              </Text>
              <View style={styles.variantTotal}>
                <Text style={styles.variantTotalLabel}>Suma rodzinna</Text>
                <Text
                  style={[
                    styles.variantTotalValue,
                    unverified && styles.heroAmountMuted,
                  ]}
                >
                  {formatNullableZl(variant.total_household_amount_zl)}
                  {unverified ? ' · wstępna' : ''}
                </Text>
              </View>
            </Card>
          );
        })}
      </View>

      {result.warnings.map((w) => (
        <Text key={w} style={styles.warn}>
          {w}
        </Text>
      ))}
    </View>
  );
}

export function CalculatorDetailsPanel({
  result,
}: {
  result: CalculatedAmount;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={styles.detailsToggle}
      >
        <Text style={styles.detailsToggleTitle}>Szczegóły obliczenia</Text>
        <Text style={styles.detailsChevron}>{open ? 'Ukryj' : 'Pokaż'}</Text>
      </Pressable>
      {open ? (
        <View style={styles.detailsBody}>
          {result.basis ? (
            <View style={styles.detailBlock}>
              <Text style={styles.detailHeading}>Podstawa wymiaru</Text>
              <DetailRow
                label="Miesięczna"
                value={`${result.basis.monthly_basis_zl} zł`}
              />
              <DetailRow
                label="Dzienna"
                value={`${result.basis.daily_basis_zl} zł`}
              />
              <DetailRow
                label="Potrącenie"
                value={`${result.basis.deduction_rate_percent}%`}
              />
              {result.basis.minimum_basis_applied ? (
                <Badge label="Zastosowano podstawę minimalną" tone="warning" />
              ) : null}
              {result.basis.warnings.map((w) => (
                <Text key={w} style={styles.warn}>
                  {w}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={styles.detailMuted}>
              Brak podstawy wymiaru (np. świadczenie ryczałtowe).
            </Text>
          )}

          {result.rate_breakdown.length > 0 ? (
            <View style={styles.detailBlock}>
              <Text style={styles.detailHeading}>Okresy i stawki</Text>
              {result.rate_breakdown.map((period, index) => (
                <View
                  key={`${period.days}-${index}`}
                  style={styles.breakdownRow}
                >
                  <Text style={styles.breakdownDays}>{period.days} dni</Text>
                  <Text style={styles.breakdownRate}>
                    {period.rate_percentage}%
                  </Text>
                  <Text style={styles.breakdownAmount}>
                    {period.amount_zl} zł
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.detailBlock}>
            <Text style={styles.detailHeading}>Informacje prawne / silnik</Text>
            <DetailRow label="Wersja reguł" value={String(result.rules_version)} />
            <Text style={styles.detailMuted}>
              Kwoty i okresy pochodzą z FastAPI. Aplikacja nie przelicza świadczeń
              lokalnie i nie wydaje decyzji ZUS.
            </Text>
          </View>

          {result.warnings.map((w) => (
            <Text key={w} style={styles.warn}>
              {w}
            </Text>
          ))}
        </View>
      ) : (
        <Text style={styles.detailMuted}>
          Podstawa wymiaru, stawki i ostrzeżenia silnika — rozwiń, gdy potrzebujesz
          szczegółów.
        </Text>
      )}
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionWrap: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  sectionTitles: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  sectionSubtitle: {
    ...typography.small,
    color: colors.textMuted,
  },
  errorPanel: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  errorText: {
    ...typography.small,
    color: colors.danger,
  },
  heroCard: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryMuted,
    gap: spacing.sm,
  },
  heroCardWarn: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
    gap: spacing.sm,
  },
  heroEmpty: {
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
  },
  heroEmptyTitle: {
    ...typography.h2,
    color: colors.text,
  },
  heroEmptyBody: {
    ...typography.body,
    color: colors.textSecondary,
  },
  heroLoading: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  heroTop: {
    gap: spacing.xs,
  },
  heroVariant: {
    ...typography.small,
    color: colors.textSecondary,
  },
  heroName: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  heroAmount: {
    ...typography.display,
    color: colors.text,
    marginVertical: spacing.xs,
  },
  heroAmountMuted: {
    color: colors.warning,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaChip: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 96,
  },
  metaChipLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  metaChipValue: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  disclaimer: {
    ...typography.small,
    color: colors.warning,
  },
  warn: {
    ...typography.small,
    color: colors.warning,
  },
  compareWrap: {
    gap: spacing.md,
  },
  compareIntro: {
    gap: spacing.xs,
  },
  compareMeta: {
    ...typography.small,
    color: colors.textMuted,
  },
  reservedCard: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: colors.warningSoft,
  },
  reservedTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  reservedBody: {
    ...typography.small,
    color: colors.textSecondary,
  },
  reservedHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  variantGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  variantCard: {
    flexGrow: 1,
    flexBasis: 240,
    maxWidth: '100%',
    gap: spacing.xs,
  },
  variantTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  barTrack: {
    height: 10,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
    flexDirection: 'row',
    marginVertical: spacing.xs,
  },
  barA: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  barB: {
    height: '100%',
    backgroundColor: colors.zus,
  },
  variantLine: {
    ...typography.caption,
    color: colors.textMuted,
  },
  variantAmount: {
    ...typography.bodyStrong,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  variantTotal: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 2,
  },
  variantTotalLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  variantTotalValue: {
    ...typography.h3,
    color: colors.text,
  },
  detailsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailsToggleTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  detailsChevron: {
    ...typography.small,
    color: colors.primary,
  },
  detailsBody: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  detailBlock: {
    gap: spacing.xs,
  },
  detailHeading: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  detailLabel: {
    ...typography.small,
    color: colors.textMuted,
  },
  detailValue: {
    ...typography.small,
    color: colors.text,
    fontWeight: '600',
  },
  detailMuted: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  breakdownDays: {
    ...typography.small,
    color: colors.textSecondary,
    flex: 1,
  },
  breakdownRate: {
    ...typography.small,
    color: colors.primary,
    width: 64,
    textAlign: 'center',
  },
  breakdownAmount: {
    ...typography.small,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
});
