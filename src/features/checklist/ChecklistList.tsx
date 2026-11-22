import { Link, type Href } from 'expo-router';
import { Check, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import {
  PRIORITY_LABEL,
  PRIORITY_TONE,
  STATUS_LABEL,
  STATUS_TONE,
  sortChecklistByProcedure,
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
  /** Wykonane są zwinięte; tu trzymamy te, które użytkownik rozwinął. */
  const [expandedDoneIds, setExpandedDoneIds] = useState<Record<string, true>>({});

  const filtered = items.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'todo' || filter === 'pending' || filter === 'done') {
      return item.status === filter;
    }
    return (item.priority ?? 'optional') === filter;
  });

  const visible = sortChecklistByProcedure(filtered);

  const toggleDoneExpanded = (id: string) => {
    setExpandedDoneIds((prev) => {
      if (prev[id]) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: true };
    });
  };

  const handleStatusChange = (id: string, status: ChecklistStatus) => {
    if (status === 'done') {
      setExpandedDoneIds((prev) => {
        if (!prev[id]) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
    onStatusChange?.(id, status);
  };

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
      {visible.map((item, index) => {
        const priority = item.priority ?? 'optional';
        const step = index + 1;
        const isDone = item.status === 'done';
        const isExpanded = !isDone || Boolean(expandedDoneIds[item.id]);

        if (isDone && !isExpanded) {
          return (
            <Pressable
              key={item.id}
              onPress={() => toggleDoneExpanded(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}. Wykonane. Rozwiń, aby zmienić.`}
              style={({ pressed }) => [
                styles.collapsedCard,
                pressed && styles.collapsedPressed,
              ]}
            >
              <View style={styles.collapsedLeft}>
                <View style={styles.stepDone}>
                  <Check size={16} color={colors.accent} strokeWidth={2.5} />
                </View>
                <View style={styles.collapsedText}>
                  <Text style={styles.collapsedStep}>Krok {step}</Text>
                  <Text style={styles.collapsedTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                </View>
              </View>
              <View style={styles.collapsedRight}>
                <Badge label={STATUS_LABEL.done} tone="success" />
                <ChevronDown size={18} color={colors.textMuted} />
              </View>
            </Pressable>
          );
        }

        return (
          <Card key={item.id}>
            <View style={styles.cardHeader}>
              <View style={styles.stepRow}>
                <View style={[styles.stepBadge, isDone && styles.stepBadgeDone]}>
                  <Text style={[styles.stepBadgeText, isDone && styles.stepBadgeTextDone]}>
                    {step}
                  </Text>
                </View>
                <View style={styles.badges}>
                  <Badge label={STATUS_LABEL[item.status]} tone={STATUS_TONE[item.status]} />
                  <Badge label={PRIORITY_LABEL[priority]} tone={PRIORITY_TONE[priority]} />
                </View>
              </View>
              {isDone ? (
                <Pressable
                  onPress={() => toggleDoneExpanded(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel="Zwiń wykonany krok"
                  hitSlop={8}
                  style={styles.collapseToggle}
                >
                  <ChevronUp size={18} color={colors.textMuted} />
                </Pressable>
              ) : null}
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
                  {(['todo', 'pending', 'done'] as ChecklistStatus[]).map((status) => (
                    <Pressable
                      key={status}
                      onPress={() => handleStatusChange(item.id, status)}
                      style={[
                        styles.statusBtn,
                        item.status === status && styles.statusBtnActive,
                        status === 'pending' &&
                          item.status === status &&
                          styles.statusBtnPendingActive,
                        status === 'done' &&
                          item.status === status &&
                          styles.statusBtnDoneActive,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Ustaw status: ${STATUS_LABEL[status]}`}
                    >
                      <Text
                        style={[
                          styles.statusBtnText,
                          item.status === status && styles.statusBtnTextActive,
                          status === 'pending' &&
                            item.status === status &&
                            styles.statusBtnTextPendingActive,
                          status === 'done' &&
                            item.status === status &&
                            styles.statusBtnTextDoneActive,
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
  collapsedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  collapsedPressed: {
    opacity: 0.88,
  },
  collapsedLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  stepDone: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  collapsedText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  collapsedStep: {
    ...typography.caption,
    color: colors.textMuted,
  },
  collapsedTitle: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  collapsedRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  stepRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  stepBadgeDone: {
    backgroundColor: colors.accentSoft,
  },
  stepBadgeText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  stepBadgeTextDone: {
    color: colors.accent,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  collapseToggle: {
    padding: spacing.xs,
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
  statusBtnPendingActive: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
  },
  statusBtnDoneActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  statusBtnText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statusBtnTextActive: {
    color: colors.primary,
  },
  statusBtnTextPendingActive: {
    color: colors.warning,
  },
  statusBtnTextDoneActive: {
    color: colors.accent,
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
