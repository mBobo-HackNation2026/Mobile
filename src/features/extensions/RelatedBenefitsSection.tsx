import { Linking, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { InstitutionMark } from '@/components/ui/InstitutionMark';
import { colors, spacing, typography } from '@/theme';
import type { RelatedBenefitHint } from '@/types/extensions';
import { resolveInstitutionFromText } from '@/types/institutions';

interface RelatedBenefitsSectionProps {
  items: RelatedBenefitHint[];
  title?: string;
  subtitle?: string;
}

/** Karty informacyjne ze źródłami — bez oceny prawa do świadczenia. */
export function RelatedBenefitsSection({
  items,
  title = 'Sprawdź również',
  subtitle = 'Inne świadczenia i oficjalne źródła — bez niezweryfikowanej oceny Twojego uprawnienia.',
}: RelatedBenefitsSectionProps) {
  if (!items.length) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {items.map((item) => {
        const institutionId =
          item.institution ?? resolveInstitutionFromText(item.sourceLabel);

        return (
          <Card key={item.id}>
            <View style={styles.cardTop}>
              <View style={styles.row}>
                <Badge label="Informacja" tone="neutral" />
                {item.isDemo ? <Badge label="Demo" tone="demo" /> : null}
              </View>
              {institutionId ? <InstitutionMark institutionId={institutionId} /> : null}
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.body}>{item.summary}</Text>
            <Text style={styles.meta}>Dlaczego tu: {item.whyShown}</Text>
            <Text
              style={styles.link}
              onPress={() => Linking.openURL(item.officialUrl)}
              accessibilityRole="link"
            >
              {item.sourceLabel} →
            </Text>
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary, maxWidth: 720 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, flex: 1 },
  cardTitle: { ...typography.h3, color: colors.text, marginTop: spacing.sm },
  body: { ...typography.body, color: colors.textSecondary, marginVertical: spacing.sm },
  meta: { ...typography.small, color: colors.textMuted, marginBottom: spacing.sm },
  link: { ...typography.bodyStrong, color: colors.primary },
});
