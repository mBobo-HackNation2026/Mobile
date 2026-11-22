import { Linking, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChoiceChip } from '@/components/ui/ChoiceChip';
import { useDocumentAssistantStore } from '@/store/useDocumentAssistantStore';
import { colors, spacing, typography } from '@/theme';
import {
  APPLICATION_DOC_STATUS_LABEL,
  type ApplicationDocumentStatus,
  type DocumentAssistantBundle,
} from '@/types/extensions';

interface DocumentAssistantSectionProps {
  bundle: DocumentAssistantBundle;
}

const STATUS_OPTIONS: ApplicationDocumentStatus[] = ['missing', 'ready', 'optional'];

export function DocumentAssistantSection({ bundle }: DocumentAssistantSectionProps) {
  const overrides = useDocumentAssistantStore((s) => s.overrides);
  const setDocumentStatus = useDocumentAssistantStore((s) => s.setDocumentStatus);

  if (!bundle.applications.length) {
    return (
      <Card>
        <Text style={styles.title}>Asystent dokumentów</Text>
        <Text style={styles.body}>Brak powiązań dokumentów z wnioskami w odpowiedzi API.</Text>
      </Card>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Asystent dokumentów</Text>
        {bundle.isDemo ? <Badge label="Demo / mock" tone="demo" /> : null}
      </View>
      <Text style={styles.subtitle}>
        Oznacz, które dokumenty masz, i zobacz, do którego wniosku należą. Status startowy
        pochodzi z API — lokalne zmiany nie są decyzją ZUS.
      </Text>

      {bundle.applications.map((app) => (
        <Card key={app.id}>
          <View style={styles.row}>
            <Badge label={app.formCode ?? 'Wniosek'} tone="primary" />
            {app.benefitId ? <Badge label="Powiązane świadczenie" tone="neutral" /> : null}
          </View>
          <Text style={styles.cardTitle}>{app.title}</Text>
          {app.benefitId ? (
            <Button
              label="Otwórz świadczenie"
              variant="ghost"
              onPress={() => router.push(`/benefits/${app.benefitId}` as Href)}
            />
          ) : null}

          {app.documents.map((doc) => {
            const status = overrides[doc.id] ?? doc.status;
            return (
              <View key={doc.id} style={styles.docBlock}>
                <View style={styles.row}>
                  <Badge
                    label={APPLICATION_DOC_STATUS_LABEL[status]}
                    tone={
                      status === 'ready'
                        ? 'success'
                        : status === 'missing'
                          ? 'warning'
                          : status === 'retired'
                            ? 'danger'
                            : 'neutral'
                    }
                  />
                  {doc.required ? <Badge label="Wymagany" tone="warning" /> : null}
                  {doc.formCode ? <Badge label={doc.formCode} tone="primary" /> : null}
                </View>
                <Text style={styles.docTitle}>{doc.title}</Text>
                <Text style={styles.body}>{doc.purpose}</Text>
                <Text style={styles.meta}>Wniosek: {doc.linkedApplicationTitle}</Text>
                {doc.officialUrl ? (
                  <Text
                    style={styles.link}
                    onPress={() => Linking.openURL(doc.officialUrl!)}
                    accessibilityRole="link"
                  >
                    Oficjalne źródło →
                  </Text>
                ) : null}
                {status !== 'retired' ? (
                  <View style={styles.chips}>
                    {STATUS_OPTIONS.map((option) => (
                      <ChoiceChip
                        key={option}
                        label={APPLICATION_DOC_STATUS_LABEL[option]}
                        selected={status === option}
                        onPress={() => setDocumentStatus(doc.id, option)}
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}
        </Card>
      ))}

      {bundle.retiredNote ? (
        <Text style={styles.warning}>{bundle.retiredNote}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary, maxWidth: 720 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.xs },
  cardTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  docBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  docTitle: { ...typography.bodyStrong, color: colors.text },
  body: { ...typography.body, color: colors.textSecondary },
  meta: { ...typography.small, color: colors.textMuted },
  link: { ...typography.bodyStrong, color: colors.primary, marginTop: spacing.xs },
  chips: { gap: spacing.xs, marginTop: spacing.sm },
  warning: { ...typography.small, color: colors.warning },
});
