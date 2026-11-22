import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChoiceChip } from '@/components/ui/ChoiceChip';
import { TextField } from '@/components/ui/TextField';
import type { KnownMissingFieldId } from '@/features/profile/missingFields';
import { colors, spacing, typography } from '@/theme';
import {
  EMPLOYMENT_LABELS,
  INSURANCE_LABELS,
  STAGE_LABELS,
  type EmploymentType,
  type InsuranceStatus,
  type ParentProfile,
} from '@/types/journey';

type Tri = 'yes' | 'no' | 'unknown';

type Draft = {
  employmentType: EmploymentType | null;
  insuranceStatus: InsuranceStatus | null;
  childrenCount: string;
  childrenSurvivedCount: string;
  childAgeMonths: string;
  fatherInsured: Tri;
  zaZyciemCertificate: Tri;
  fullDoseClaimedWithin21Days: Tri;
  isFullTimeEmployment: Tri;
  debtAmountZl: string;
  insuredDaysContinuous: string;
  otherParentUsedParentalLeaveWeeks: string;
  childHospitalizationWeeks: string;
  gestationalWeekAtBirth: string;
};

type Props = {
  profile: ParentProfile;
  busy?: boolean;
  /** Pola z missing_fields — wyróżnione i otwarte do edycji. */
  priorityFields?: KnownMissingFieldId[];
  startEditing?: boolean;
  onApplyAndRecheck: (patch: Partial<ParentProfile>) => void;
};

function triFromBool(value: boolean | null | undefined): Tri {
  if (value === true) return 'yes';
  if (value === false) return 'no';
  return 'unknown';
}

function triToBool(value: Tri): boolean | null {
  if (value === 'yes') return true;
  if (value === 'no') return false;
  return null;
}

function triLabel(value: Tri): string {
  if (value === 'yes') return 'Tak';
  if (value === 'no') return 'Nie';
  return 'Nie wiem';
}

function profileToDraft(profile: ParentProfile): Draft {
  return {
    employmentType: profile.employmentType,
    insuranceStatus: profile.insuranceStatus,
    childrenCount: profile.childrenCount != null ? String(profile.childrenCount) : '1',
    childrenSurvivedCount:
      profile.childrenSurvivedCount != null
        ? String(profile.childrenSurvivedCount)
        : '',
    childAgeMonths:
      profile.childAgeMonths != null ? String(profile.childAgeMonths) : '',
    fatherInsured: triFromBool(profile.fatherInsured),
    zaZyciemCertificate: triFromBool(profile.zaZyciemCertificate),
    fullDoseClaimedWithin21Days: triFromBool(profile.fullDoseClaimedWithin21Days),
    isFullTimeEmployment: triFromBool(profile.isFullTimeEmployment),
    debtAmountZl: profile.debtAmountZl != null ? String(profile.debtAmountZl) : '',
    insuredDaysContinuous:
      profile.insuredDaysContinuous != null
        ? String(profile.insuredDaysContinuous)
        : '',
    otherParentUsedParentalLeaveWeeks:
      profile.otherParentUsedParentalLeaveWeeks != null
        ? String(profile.otherParentUsedParentalLeaveWeeks)
        : '',
    childHospitalizationWeeks:
      profile.childHospitalizationWeeks != null
        ? String(profile.childHospitalizationWeeks)
        : '',
    gestationalWeekAtBirth:
      profile.gestationalWeekAtBirth != null
        ? String(profile.gestationalWeekAtBirth)
        : '',
  };
}

function parseOptionalInt(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number.parseInt(t, 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Podsumowanie i edycja odpowiedzi mających wpływ na ocenę — bez całej ankiety.
 */
export function ProfileAnswersReview({
  profile,
  busy = false,
  priorityFields = [],
  startEditing = false,
  onApplyAndRecheck,
}: Props) {
  const [editing, setEditing] = useState(startEditing);
  const [draft, setDraft] = useState<Draft>(() => profileToDraft(profile));

  useEffect(() => {
    if (startEditing) {
      setDraft(profileToDraft(profile));
      setEditing(true);
    }
  }, [startEditing, profile]);

  const needs = (id: KnownMissingFieldId) => priorityFields.includes(id);

  const summaryRows = useMemo(
    () => [
      {
        label: 'Etap',
        value: profile.stage ? STAGE_LABELS[profile.stage] : '—',
      },
      {
        label: 'Zatrudnienie',
        value: profile.employmentType
          ? EMPLOYMENT_LABELS[profile.employmentType]
          : '—',
      },
      {
        label: 'Ubezpieczenie chorobowe',
        value: profile.insuranceStatus
          ? INSURANCE_LABELS[profile.insuranceStatus]
          : '—',
      },
      {
        label: 'Liczba dzieci',
        value: profile.childrenCount != null ? String(profile.childrenCount) : '—',
      },
      {
        label: 'Drugi rodzic ubezpieczony',
        value: triLabel(triFromBool(profile.fatherInsured)),
      },
      {
        label: 'Zaświadczenie „Za życiem”',
        value: triLabel(triFromBool(profile.zaZyciemCertificate)),
      },
    ],
    [profile],
  );

  if (!editing) {
    return (
      <Card>
        <Text style={styles.section}>Sprawdź swoje dane</Text>
        <Text style={styles.body}>
          Możesz poprawić odpowiedzi wpływające na ocenę tego świadczenia, a potem
          ponownie uruchomić silnik uprawnień.
        </Text>
        {summaryRows.map((row) => (
          <View key={row.label} style={styles.row}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Text style={styles.rowValue}>{row.value}</Text>
          </View>
        ))}
        <Button
          label="Sprawdź moje odpowiedzi"
          variant="secondary"
          onPress={() => {
            setDraft(profileToDraft(profile));
            setEditing(true);
          }}
          fullWidth
        />
      </Card>
    );
  }

  return (
    <Card>
      <Text style={styles.section}>Popraw odpowiedzi</Text>
      <Text style={styles.body}>
        Po zapisaniu uruchomimy ponowną ocenę silnika dla tego świadczenia. AI nie
        zmienia wyniku — tylko wyjaśnia.
      </Text>

      {priorityFields.length > 0 ? (
        <Text style={styles.body}>
          Najpierw uzupełnij pola oznaczone „Potrzebne” — pochodzą z
          missing_fields silnika.
        </Text>
      ) : null}

      <FieldLabel
        label="Ubezpieczenie chorobowe"
        needed={needs('insured_at_birth')}
      />
      <View style={styles.chips}>
        {(
          [
            ['insured', 'Tak'],
            ['not_insured', 'Nie'],
            ['unknown', 'Nie wiem'],
          ] as const
        ).map(([key, label]) => (
          <ChoiceChip
            key={key}
            label={label}
            selected={draft.insuranceStatus === key}
            onPress={() => setDraft((d) => ({ ...d, insuranceStatus: key }))}
          />
        ))}
      </View>

      <FieldLabel
        label="Forma zatrudnienia"
        needed={needs('insurance_title')}
      />
      <View style={styles.chips}>
        {(
          [
            'employment_contract',
            'civil_contract',
            'self_employed',
            'unemployed',
            'other',
            'unknown',
          ] as const
        ).map((key) => (
          <ChoiceChip
            key={key}
            label={EMPLOYMENT_LABELS[key]}
            selected={draft.employmentType === key}
            onPress={() => setDraft((d) => ({ ...d, employmentType: key }))}
          />
        ))}
      </View>

      {draft.employmentType === 'self_employed' || needs('debt_amount_zl') ? (
        <TextField
          label={
            needs('debt_amount_zl')
              ? 'Zadłużenie składkowe (zł) — potrzebne'
              : 'Zadłużenie składkowe (zł)'
          }
          value={draft.debtAmountZl}
          onChangeText={(debtAmountZl) => setDraft((d) => ({ ...d, debtAmountZl }))}
          keyboardType="numeric"
          placeholder="0"
        />
      ) : null}

      <TextField
        label={
          needs('children_count') ? 'Liczba dzieci — potrzebne' : 'Liczba dzieci'
        }
        value={draft.childrenCount}
        onChangeText={(childrenCount) => setDraft((d) => ({ ...d, childrenCount }))}
        keyboardType="numeric"
      />

      {(needs('children_survived_count') ||
        profile.isStillbirthOrInfantDeath === true) && (
        <TextField
          label="Liczba dzieci pozostałych przy życiu — potrzebne przy stracie"
          value={draft.childrenSurvivedCount}
          onChangeText={(childrenSurvivedCount) =>
            setDraft((d) => ({ ...d, childrenSurvivedCount }))
          }
          keyboardType="numeric"
          placeholder="np. 0 lub 1"
        />
      )}

      <TextField
        label={
          needs('child_age_months')
            ? 'Wiek dziecka (miesiące) — potrzebne'
            : 'Wiek dziecka (miesiące)'
        }
        value={draft.childAgeMonths}
        onChangeText={(childAgeMonths) =>
          setDraft((d) => ({ ...d, childAgeMonths }))
        }
        keyboardType="numeric"
        placeholder="np. 1"
      />

      <FieldLabel
        label="Drugi rodzic ubezpieczony"
        needed={needs('father_insured')}
      />
      <TriChips
        value={draft.fatherInsured}
        onChange={(fatherInsured) => setDraft((d) => ({ ...d, fatherInsured }))}
      />

      <FieldLabel
        label="Zaświadczenie „Za życiem”"
        needed={needs('za_zyciem_certificate')}
      />
      <TriChips
        value={draft.zaZyciemCertificate}
        onChange={(zaZyciemCertificate) =>
          setDraft((d) => ({ ...d, zaZyciemCertificate }))
        }
      />

      <FieldLabel
        label="Pełny wymiar zgłoszony w 21 dni"
        needed={needs('full_dose_claimed_within_21_days')}
      />
      <TriChips
        value={draft.fullDoseClaimedWithin21Days}
        onChange={(fullDoseClaimedWithin21Days) =>
          setDraft((d) => ({ ...d, fullDoseClaimedWithin21Days }))
        }
      />

      <FieldLabel
        label="Zatrudnienie w pełnym wymiarze"
        needed={needs('is_full_time_employment')}
      />
      <TriChips
        value={draft.isFullTimeEmployment}
        onChange={(isFullTimeEmployment) =>
          setDraft((d) => ({ ...d, isFullTimeEmployment }))
        }
      />

      <TextField
        label={
          needs('insured_days_continuous')
            ? 'Dni ciągłego ubezpieczenia — potrzebne'
            : 'Dni ciągłego ubezpieczenia'
        }
        value={draft.insuredDaysContinuous}
        onChangeText={(insuredDaysContinuous) =>
          setDraft((d) => ({ ...d, insuredDaysContinuous }))
        }
        keyboardType="numeric"
        placeholder="opcjonalnie"
      />

      <TextField
        label={
          needs('other_parent_used_parental_leave_weeks')
            ? 'Tygodnie urlopu rodzicielskiego drugiego rodzica — potrzebne'
            : 'Tygodnie urlopu rodzicielskiego drugiego rodzica'
        }
        value={draft.otherParentUsedParentalLeaveWeeks}
        onChangeText={(otherParentUsedParentalLeaveWeeks) =>
          setDraft((d) => ({ ...d, otherParentUsedParentalLeaveWeeks }))
        }
        keyboardType="numeric"
        placeholder="opcjonalnie"
      />

      {(needs('child_hospitalization_weeks') ||
        needs('gestational_week_at_birth')) && (
        <>
          <TextField
            label="Tygodnie hospitalizacji dziecka"
            value={draft.childHospitalizationWeeks}
            onChangeText={(childHospitalizationWeeks) =>
              setDraft((d) => ({ ...d, childHospitalizationWeeks }))
            }
            keyboardType="numeric"
          />
          <TextField
            label="Tydzień ciąży w momencie porodu"
            value={draft.gestationalWeekAtBirth}
            onChangeText={(gestationalWeekAtBirth) =>
              setDraft((d) => ({ ...d, gestationalWeekAtBirth }))
            }
            keyboardType="numeric"
          />
        </>
      )}

      <View style={styles.actions}>
        <Button
          label="Anuluj"
          variant="ghost"
          onPress={() => setEditing(false)}
          disabled={busy}
        />
        <Button
          label={busy ? 'Ponowna ocena…' : 'Zapisz i oceń ponownie'}
          onPress={() => {
            const children = Number.parseInt(draft.childrenCount, 10);
            const debt = draft.debtAmountZl.trim()
              ? Number.parseFloat(draft.debtAmountZl.replace(',', '.'))
              : null;

            onApplyAndRecheck({
              employmentType: draft.employmentType,
              insuranceStatus: draft.insuranceStatus,
              childrenCount:
                Number.isFinite(children) && children >= 1 ? children : 1,
              childrenSurvivedCount: parseOptionalInt(draft.childrenSurvivedCount),
              childAgeMonths: parseOptionalInt(draft.childAgeMonths),
              fatherInsured: triToBool(draft.fatherInsured),
              zaZyciemCertificate: triToBool(draft.zaZyciemCertificate),
              fullDoseClaimedWithin21Days: triToBool(
                draft.fullDoseClaimedWithin21Days,
              ),
              isFullTimeEmployment: triToBool(draft.isFullTimeEmployment),
              debtAmountZl:
                draft.employmentType === 'self_employed' &&
                debt != null &&
                Number.isFinite(debt)
                  ? debt
                  : draft.employmentType === 'self_employed'
                    ? 0
                    : profile.debtAmountZl,
              insuredDaysContinuous: parseOptionalInt(draft.insuredDaysContinuous),
              otherParentUsedParentalLeaveWeeks: parseOptionalInt(
                draft.otherParentUsedParentalLeaveWeeks,
              ),
              childHospitalizationWeeks: parseOptionalInt(
                draft.childHospitalizationWeeks,
              ),
              gestationalWeekAtBirth: parseOptionalInt(
                draft.gestationalWeekAtBirth,
              ),
            });
            setEditing(false);
          }}
          disabled={busy}
          fullWidth
        />
      </View>
    </Card>
  );
}

function FieldLabel({
  label,
  needed,
}: {
  label: string;
  needed?: boolean;
}) {
  return (
    <View style={styles.fieldLabelRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {needed ? <Badge label="Potrzebne" tone="warning" /> : null}
    </View>
  );
}

function TriChips({
  value,
  onChange,
}: {
  value: Tri;
  onChange: (value: Tri) => void;
}) {
  return (
    <View style={styles.chips}>
      {(
        [
          ['yes', 'Tak'],
          ['no', 'Nie'],
          ['unknown', 'Nie wiem'],
        ] as const
      ).map(([key, label]) => (
        <ChoiceChip
          key={key}
          label={label}
          selected={value === key}
          onPress={() => onChange(key)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  row: { marginBottom: spacing.sm, gap: spacing.xxs },
  rowLabel: { ...typography.small, color: colors.textMuted },
  rowValue: { ...typography.bodyStrong, color: colors.text },
  fieldLabelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  fieldLabel: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  chips: { gap: spacing.xs, marginBottom: spacing.sm },
  actions: { gap: spacing.sm, marginTop: spacing.md },
});
