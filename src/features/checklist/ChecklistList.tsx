import { Link, type Href } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import {
  PRIORITY_LABEL,
  PRIORITY_TONE,
  STATUS_LABEL,
  STATUS_TONE,
  sortChecklistByPriority,
} from '@/features/checklist/labels';
import { formatShortDatePl } from '@/lib/format';
import { colors, radii, spacing, typography } from '@/theme';
import type { ChecklistItem, ChecklistPriority, ChecklistStatus } from '@/types/journey';

export type ChecklistFilter = ChecklistStatus | ChecklistPriority | 'all';

interface ChecklistListProps {
  items: ChecklistItem[];
  onStatusChange?: (id: string, status: ChecklistStatus) => void;
  filter?: ChecklistFilter;
  compact?: boolean;
}

export function ChecklistList({
  items,
  onStatusChange,
  filter = 'all',
  compact = false,
}: ChecklistListProps) {
  const filtered = items.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'now' || filter === 'later' || filter === 'done') {
      return item.status === filter;
    }
    return (item.priority ?? 'optional') === filter;
  });

  const visible = sortChecklistByPriority(filtered);

  if (visible.length === 0) {
    return (
      <Card>
        <Text style={styles.emptyTitle}>Brak pozycji w tym filtrze</Text>
        <Text style={styles.emptyText}>Zmień filtr albo uzupełnij dane w profilu.</Text>
      </Card>
    );
  }

  return (
    <View style={styles.list}>
      {visible.map((item) => {
        const priority = item.priority ?? 'optional';
        return (
          <Card key={item.id}>
            <View style={styles.badges}>
              <Badge label={STATUS_LABEL[item.status]} tone={STATUS_TONE[item.status]} />
              <Badge label={PRIORITY_LABEL[priority]} tone={PRIORITY_TONE[priority]} />
            </View>

            <Text style={styles.title}>{item.title}</Text>

            <View style={styles.facts}>
              <Fact
                label="Kiedy"
                value={item.dueDate ? formatShortDatePl(item.dueDate) : 'Bez sztywnego terminu'}
              />
              <Fact label="Dlaczego" value={item.description} />
              <Fact label="Gdzie" value={item.office ?? 'Do ustalenia / źródło oficjalne'} />
              <Fact
                label="Dokumenty"
                value={
                  item.documents.length
                    ? item.documents.join(', ')
                    : 'Brak wymaganych w tym kroku'
                }
              />
            </View>

            {item.officialUrl && !compact ? (
              <Pressable
                onPress={() => Linking.openURL(item.officialUrl!)}
                accessibilityRole="link"
              >
                <Text style={styles.source}>Źródło oficjalne →</Text>
              </Pressable>
            ) : null}

            <View style={styles.actions}>
              {onStatusChange ? (
                <View style={styles.statusActions}>
                  {(['now', 'later', 'done'] as ChecklistStatus[]).map((status) => (
                    <Pressable
                      key={status}
                      onPress={() => onStatusChange(item.id, status)}
                      style={[
                        styles.statusBtn,
                        item.status === status && styles.statusBtnActive,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Ustaw status: ${STATUS_LABEL[status]}`}
                    >
                      <Text
                        style={[
                          styles.statusBtnText,
                          item.status === status && styles.statusBtnTextActive,
                        ]}
                      >
                        {STATUS_LABEL[status]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              <Link href={item.ctaHref as Href} style={styles.cta}>
                <Text style={styles.ctaText}>{item.ctaLabel}</Text>
              </Link>
            </View>
          </Card>
        );
      })}
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  facts: {
    gap: spacing.xs,
  },
  fact: {
    gap: 2,
  },
  factLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  factValue: {
    ...typography.body,
    color: colors.textSecondary,
  },
  source: {
    ...typography.bodyStrong,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  actions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  statusActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  statusBtn: {
    minHeight: 36,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    justifyContent: 'center',
  },
  statusBtnActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  statusBtnText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statusBtnTextActive: {
    color: colors.primary,
  },
  cta: {
    alignSelf: 'flex-start',
  },
  ctaText: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
