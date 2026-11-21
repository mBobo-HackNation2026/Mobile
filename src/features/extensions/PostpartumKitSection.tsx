import { router, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatDatePl } from '@/lib/format';
import { colors, spacing, typography } from '@/theme';
import type { PostpartumKit } from '@/types/extensions';
import { STAGE_LABELS } from '@/types/journey';

interface PostpartumKitSectionProps {
  kit: PostpartumKit | null;
}

export function PostpartumKitSection({ kit }: PostpartumKitSectionProps) {
  if (!kit) return null;

  if (!kit.isApplicable) {
    return (
      <Card>
        <View style={styles.row}>
          <Badge label="Niezbędnik" tone="neutral" />
          {kit.isDemo ? <Badge label="Demo" tone="demo" /> : null}
        </View>
        <Text style={styles.cardTitle}>Niezbędnik po porodzie</Text>
        <Text style={styles.body}>{kit.headline}</Text>
        {kit.stageContext ? (
          <Text style={styles.meta}>
            Obecny etap: {STAGE_LABELS[kit.stageContext]}. Zmień etap w ankiecie, aby
            odblokować checklistę.
          </Text>
        ) : null}
        <Button
          label="Zmień etap w ankiecie"
          variant="secondary"
          onPress={() => router.push('/onboarding')}
        />
      </Card>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Niezbędnik po porodzie</Text>
      <Text style={styles.subtitle}>{kit.headline}</Text>
      {kit.items.map((item) => (
        <Card key={item.id}>
          <View style={styles.row}>
            <Badge
              label={
                item.priority === 'required'
                  ? 'Wymagane'
                  : item.priority === 'optional'
                    ? 'Opcjonalne'
                    : 'Do weryfikacji'
              }
              tone={
                item.priority === 'required'
                  ? 'warning'
                  : item.priority === 'optional'
                    ? 'neutral'
                    : 'primary'
              }
            />
            <Badge
              label={
                item.status === 'now' ? 'Teraz' : item.status === 'done' ? 'Zrobione' : 'Później'
              }
              tone={item.status === 'now' ? 'danger' : 'neutral'}
            />
          </View>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.body}>{item.description}</Text>
          {item.documents.length > 0 ? (
            <Text style={styles.meta}>Dokumenty: {item.documents.join(', ')}</Text>
          ) : null}
          {item.dueDate ? (
            <Text style={styles.meta}>Orientacyjnie do: {formatDatePl(item.dueDate)}</Text>
          ) : null}
          <Button label={item.ctaLabel} onPress={() => router.push(item.ctaHref as Href)} />
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
  body: { ...typography.body, color: colors.textSecondary, marginVertical: spacing.sm },
  meta: { ...typography.small, color: colors.textMuted, marginBottom: spacing.xs },
});
