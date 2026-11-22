import { router, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { isIsoDateString } from '@/services/api/deriveFormalitiesFromBenefits';
import { formatDatePl } from '@/lib/format';
import { colors, spacing, typography } from '@/theme';
import {
  DEADLINE_URGENCY_LABEL,
  type DeadlineRadarItem,
  type DeadlineUrgency,
} from '@/types/extensions';

interface DeadlineRadarSectionProps {
  items: DeadlineRadarItem[];
}

const URGENCY_TONE: Record<
  DeadlineUrgency,
  'danger' | 'warning' | 'primary' | 'neutral'
> = {
  overdue: 'danger',
  urgent: 'warning',
  soon: 'primary',
  planned: 'neutral',
};

export function DeadlineRadarSection({ items }: DeadlineRadarSectionProps) {
  if (!items.length) {
    return (
      <Card>
        <Text style={styles.title}>Radar terminów</Text>
        <Text style={styles.body}>Brak terminów w aktualnej ocenie API / mocka.</Text>
      </Card>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Radar terminów</Text>
      <Text style={styles.subtitle}>
        Terminy z planu FastAPI. Opis bez daty ISO nie trafia do kalendarza jako dzień.
      </Text>
      {items.map((item) => (
        <Card key={item.id}>
          <View style={styles.row}>
            <Badge
              label={DEADLINE_URGENCY_LABEL[item.urgency]}
              tone={URGENCY_TONE[item.urgency]}
            />
            {item.isDemo ? <Badge label="Demo" tone="demo" /> : null}
            <Badge label="FastAPI" tone="primary" />
          </View>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.meta}>
            {isIsoDateString(item.submitBy)
              ? `Do: ${formatDatePl(item.submitBy)}`
              : `Termin (opis API): ${item.submitBy}`}
          </Text>
          {item.office ? <Text style={styles.meta}>Adresat: {item.office}</Text> : null}
          {item.warning ? <Text style={styles.warning}>{item.warning}</Text> : null}
          <Button
            label={item.actionLabel}
            onPress={() => router.push(item.actionHref as Href)}
          />
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary, maxWidth: 720 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  cardTitle: { ...typography.h3, color: colors.text, marginTop: spacing.sm },
  meta: { ...typography.small, color: colors.textMuted, marginBottom: spacing.xs },
  warning: {
    ...typography.small,
    color: colors.warning,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  body: { ...typography.body, color: colors.textSecondary },
});
