import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import {
  fetchFormalitiesForBenefit,
  type BenefitFormalities,
} from '@/services/api/formalities';
import { getApiMode } from '@/services/api';
import { colors, spacing, typography } from '@/theme';

/**
 * Live GET /formalities/{code}. Przy błędzie — cisza (szczegóły mają fallback procedure).
 */
export function BenefitFormalitiesPanel({
  benefitCode,
}: {
  benefitCode: string;
}) {
  const mode = getApiMode();
  const query = useQuery({
    queryKey: ['formalities', benefitCode],
    queryFn: () => fetchFormalitiesForBenefit(benefitCode),
    enabled: mode === 'rest' && Boolean(benefitCode),
    staleTime: 60_000,
    retry: 1,
  });

  if (mode !== 'rest') return null;
  if (query.isLoading) {
    return (
      <Card>
        <Text style={styles.meta}>Ładowanie formalności…</Text>
      </Card>
    );
  }

  const result = query.data;
  if (!result || result.status !== 'ok') {
    if (result?.status === 'error') {
      return (
        <Card>
          <Badge label="Formalności niedostępne" tone="warning" />
          <Text style={styles.meta}>
            Nie udało się pobrać `/formalities`. Poniżej zostaje procedura z oceny
            uprawnień, jeśli jest dostępna.
          </Text>
        </Card>
      );
    }
    return null;
  }

  return <FormalitiesCard data={result.data} />;
}

function FormalitiesCard({ data }: { data: BenefitFormalities }) {
  return (
    <Card>
      <Text style={styles.section}>Formalności z silnika</Text>
      {data.institution ? (
        <Text style={styles.body}>Gdzie: {data.institution}</Text>
      ) : null}
      {data.required_documents.map((doc) => (
        <View key={doc.code} style={styles.docRow}>
          <Text style={styles.docTitle}>{doc.name}</Text>
          {doc.when ? (
            <Text style={styles.meta}>Kiedy: {doc.when}</Text>
          ) : null}
        </View>
      ))}
      {data.deadlines.length > 0 ? (
        <>
          <Text style={styles.sub}>Terminy</Text>
          {data.deadlines.map((d) => (
            <Text key={d} style={styles.meta}>
              • {d}
            </Text>
          ))}
        </>
      ) : null}
      {data.next_steps.length > 0 ? (
        <>
          <Text style={styles.sub}>Kolejne kroki</Text>
          {data.next_steps.map((s, i) => (
            <Text key={s} style={styles.meta}>
              {i + 1}. {s}
            </Text>
          ))}
        </>
      ) : null}
      {data.general_risks.length > 0 ? (
        <>
          <Text style={styles.sub}>Ryzyka</Text>
          {data.general_risks.map((r) => (
            <Text key={r} style={styles.warn}>
              • {r}
            </Text>
          ))}
        </>
      ) : null}
      {data.employment_protection_note ? (
        <Text style={styles.meta}>{data.employment_protection_note}</Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  section: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  sub: {
    ...typography.bodyStrong,
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  meta: { ...typography.small, color: colors.textMuted, marginBottom: spacing.xs },
  docRow: { marginBottom: spacing.sm, gap: 2 },
  docTitle: { ...typography.bodyStrong, color: colors.text },
  warn: { ...typography.small, color: colors.warning, marginBottom: spacing.xs },
});
