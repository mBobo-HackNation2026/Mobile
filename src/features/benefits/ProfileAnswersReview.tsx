import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChoiceChip } from '@/components/ui/ChoiceChip';
import { TextField } from '@/components/ui/TextField';
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
  childAgeMonths: string;
  fatherInsured: Tri;
  zaZyciemCertificate: Tri;
  fullDoseClaimedWithin21Days: Tri;
  debtAmountZl: string;
  insuredDaysContinuous: string;
  otherParentUsedParentalLeaveWeeks: string;
};

type Props = {
  profile: ParentProfile;
  busy?: boolean;
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
    childAgeMonths:
      profile.childAgeMonths != null ? String(profile.childAgeMonths) : '',
    fatherInsured: triFromBool(profile.fatherInsured),
    zaZyciemCertificate: triFromBool(profile.zaZyciemCertificate),
    fullDoseClaimedWithin21Days: triFromBool(profile.fullDoseClaimedWithin21Days),
    debtAmountZl: profile.debtAmountZl != null ? String(profile.debtAmountZl) : '',
    insuredDaysContinuous:
      profile.insuredDaysContinuous != null
        ? String(profile.insuredDaysContinuous)
        : '',
    otherParentUsedParentalLeaveWeeks:
      profile.otherParentUsedParentalLeaveWeeks != null
        ? String(profile.otherParentUsedParentalLeaveWeeks)
        : '',
  };
}

/**
 * Podsumowanie i edycja odpowiedzi mających wpływ na ocenę — bez całej ankiety.
 */
export function ProfileAnswersReview({
  profile,
  busy = false,
  onApplyAndRecheck,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => profileToDraft(profile));

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

      <Text style={styles.fieldLabel}>Ubezpieczenie chorobowe</Text>
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

      <Text style={styles.fieldLabel}>Forma zatrudnienia</Text>
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

      {draft.employmentType === 'self_employed' ? (
        <TextField
          label="Zadłużenie składkowe (zł)"
          value={draft.debtAmountZl}
          onChangeText={(debtAmountZl) => setDraft((d) => ({ ...d, debtAmountZl }))}
          keyboardType="numeric"
          placeholder="0"
        />
      ) : null}

      <TextField
        label="Liczba dzieci"
        value={draft.childrenCount}
        onChangeText={(childrenCount) => setDraft((d) => ({ ...d, childrenCount }))}
        keyboardType="numeric"
      />

      <TextField
        label="Wiek dziecka (miesiące)"
        value={draft.childAgeMonths}
        onChangeText={(childAgeMonths) =>
          setDraft((d) => ({ ...d, childAgeMonths }))
        }
        keyboardType="numeric"
        placeholder="np. 1"
      />

      <Text style={styles.fieldLabel}>Drugi rodzic ubezpieczony</Text>
      <TriChips
        value={draft.fatherInsured}
        onChange={(fatherInsured) => setDraft((d) => ({ ...d, fatherInsured }))}
      />

      <Text style={styles.fieldLabel}>Zaświadczenie „Za życiem”</Text>
      <TriChips
        value={draft.zaZyciemCertificate}
        onChange={(zaZyciemCertificate) =>
          setDraft((d) => ({ ...d, zaZyciemCertificate }))
        }
      />

      <Text style={styles.fieldLabel}>Pełny wymiar zgłoszony w 21 dni</Text>
      <TriChips
        value={draft.fullDoseClaimedWithin21Days}
        onChange={(fullDoseClaimedWithin21Days) =>
          setDraft((d) => ({ ...d, fullDoseClaimedWithin21Days }))
        }
      />

      <TextField
        label="Dni ciągłego ubezpieczenia"
        value={draft.insuredDaysContinuous}
        onChangeText={(insuredDaysContinuous) =>
          setDraft((d) => ({ ...d, insuredDaysContinuous }))
        }
        keyboardType="numeric"
        placeholder="opcjonalnie"
      />

      <TextField
        label="Tygodnie urlopu rodzicielskiego drugiego rodzica"
        value={draft.otherParentUsedParentalLeaveWeeks}
        onChangeText={(otherParentUsedParentalLeaveWeeks) =>
          setDraft((d) => ({ ...d, otherParentUsedParentalLeaveWeeks }))
        }
        keyboardType="numeric"
        placeholder="opcjonalnie"
      />

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
            const childMonths = draft.childAgeMonths.trim()
              ? Number.parseInt(draft.childAgeMonths, 10)
              : null;
            const debt = draft.debtAmountZl.trim()
              ? Number.parseFloat(draft.debtAmountZl.replace(',', '.'))
              : null;
            const insuredDays = draft.insuredDaysContinuous.trim()
              ? Number.parseInt(draft.insuredDaysContinuous, 10)
              : null;
            const otherWeeks = draft.otherParentUsedParentalLeaveWeeks.trim()
              ? Number.parseInt(draft.otherParentUsedParentalLeaveWeeks, 10)
              : null;

            onApplyAndRecheck({
              employmentType: draft.employmentType,
              insuranceStatus: draft.insuranceStatus,
              childrenCount: Number.isFinite(children) && children >= 1 ? children : 1,
              childAgeMonths:
                childMonths != null && Number.isFinite(childMonths)
                  ? childMonths
                  : null,
              fatherInsured: triToBool(draft.fatherInsured),
              zaZyciemCertificate: triToBool(draft.zaZyciemCertificate),
              fullDoseClaimedWithin21Days: triToBool(
                draft.fullDoseClaimedWithin21Days,
              ),
              debtAmountZl:
                draft.employmentType === 'self_employed' &&
                debt != null &&
                Number.isFinite(debt)
                  ? debt
                  : draft.employmentType === 'self_employed'
                    ? 0
                    : profile.debtAmountZl,
              insuredDaysContinuous:
                insuredDays != null && Number.isFinite(insuredDays)
                  ? insuredDays
                  : null,
              otherParentUsedParentalLeaveWeeks:
                otherWeeks != null && Number.isFinite(otherWeeks)
                  ? otherWeeks
                  : null,
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
  fieldLabel: {
    ...typography.bodyStrong,
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  chips: { gap: spacing.xs, marginBottom: spacing.sm },
  actions: { gap: spacing.sm, marginTop: spacing.md },
});
