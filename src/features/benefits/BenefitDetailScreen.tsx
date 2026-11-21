import { useQuery } from '@tanstack/react-query';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { InstitutionMark } from '@/components/ui/InstitutionMark';
import { Screen } from '@/components/ui/Screen';
import { BENEFIT_TONE, CONDITION_LABEL, CONDITION_TONE } from '@/features/benefits/benefitUi';
import { resolveBenefitInstitution } from '@/features/benefits/resolveBenefitInstitution';
import { apiErrorMessage } from '@/lib/apiErrorMessage';
import { formatDatePl } from '@/lib/format';
import { eligibilityService } from '@/services/api';
import { useUserJourneyStore } from '@/store/useUserJourneyStore';
import { colors, spacing, typography } from '@/theme';
import { BENEFIT_STATUS_LABEL } from '@/types/benefits';
import { INSTITUTIONS } from '@/types/institutions';

export function BenefitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useUserJourneyStore((s) => s.profile);

  const query = useQuery({
    queryKey: ['eligibility', profile],
    queryFn: () => eligibilityService.evaluate(profile),
    enabled: profile.onboardingCompleted,
  });

  const benefit = query.data?.benefits.find((item) => item.id === id);

  if (!profile.onboardingCompleted) {
    return (
      <Screen>
        <EmptyState title="Brak danych" description="Uzupełnij ankietę." />
      </Screen>
    );
  }

  if (query.isLoading) {
    return (
      <Screen>
        <Card>
          <Text style={styles.muted}>Ładowanie…</Text>
        </Card>
      </Screen>
    );
  }

  if (query.isError) {
    return (
      <Screen>
        <EmptyState
          title="Nie udało się wczytać szczegółów"
          description={apiErrorMessage(query.error, 'Spróbuj ponownie.')}
          actionLabel="Spróbuj ponownie"
          onAction={() => query.refetch()}
        />
      </Screen>
    );
  }

  if (!benefit) {
    return (
      <Screen>
        <EmptyState
          title="Nie znaleziono świadczenia"
          description="Wróć do listy Moje świadczenia."
          actionLabel="Lista"
          onAction={() => router.push('/benefits')}
        />
      </Screen>
    );
  }

  const institutionId = resolveBenefitInstitution(benefit);

  return (
    <Screen title={benefit.title} subtitle={benefit.headline} backFallbackHref="/benefits">
      <DemoBanner />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Badge label={BENEFIT_STATUS_LABEL[benefit.status]} tone={BENEFIT_TONE[benefit.status]} />
          {institutionId ? (
            <InstitutionMark institutionId={institutionId} withLabel size="md" />
          ) : null}
        </View>
        {institutionId ? (
          <Text style={styles.meta}>Adresat: {INSTITUTIONS[institutionId].fullLabel}</Text>
        ) : null}
      </View>

      <Card>
        <Text style={styles.section}>Dlaczego?</Text>
        <Text style={styles.body}>{benefit.rationale}</Text>
        {benefit.conditions.map((condition) => (
          <View key={condition.id} style={styles.row}>
            <Badge
              label={CONDITION_LABEL[condition.state]}
              tone={CONDITION_TONE[condition.state]}
            />
            <Text style={styles.rowTitle}>{condition.label}</Text>
            <Text style={styles.meta}>{condition.explanation}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={styles.section}>Co mogę zrobić?</Text>
        {benefit.remedies.length === 0 ? (
          <Text style={styles.body}>
            Brak osobnych działań naprawczych — możesz przejść do formalności albo
            kalkulatora.
          </Text>
        ) : (
          benefit.remedies.slice(0, 2).map((remedy) => (
            <Text key={remedy.id} style={styles.body}>
              • {remedy.title}
            </Text>
          ))
        )}
        {benefit.remedies.length > 0 ? (
          <Button
            label="Sprawdź możliwe rozwiązania"
            onPress={() => router.push(`/benefits/${benefit.id}/solutions`)}
          />
        ) : null}
        {benefit.alternatives.map((alt) => (
          <Link key={alt.id} href={`/benefits/${alt.id}`}>
            <Text style={styles.link}>
              Alternatywa: {alt.title} →
            </Text>
          </Link>
        ))}
      </Card>

      <Card>
        <Text style={styles.section}>Jak uzyskać świadczenie?</Text>
        {benefit.procedure ? (
          <>
            {benefit.procedure.formCode ? (
              <Text style={styles.body}>Formularz: {benefit.procedure.formCode}</Text>
            ) : null}
            <Text style={styles.body}>
              Dokumenty: {benefit.procedure.documents.join(', ') || '—'}
            </Text>
            <Text style={styles.body}>
              Gdzie: {benefit.procedure.office ?? 'Do potwierdzenia'}
            </Text>
            <Text style={styles.body}>
              Do kiedy:{' '}
              {benefit.procedure.submitBy
                ? formatDatePl(benefit.procedure.submitBy)
                : 'Bez sztywnego terminu w demo'}
            </Text>
            {benefit.procedure.steps.map((step, index) => (
              <Text key={step} style={styles.meta}>
                {index + 1}. {step}
              </Text>
            ))}
            {benefit.procedure.simulatedSubmission ? (
              <Badge label="Składanie wniosku w app — tylko symulacja" tone="demo" />
            ) : null}
            <Button label="Przejdź do dokumentów" onPress={() => router.push('/documents')} />
          </>
        ) : (
          <Text style={styles.body}>
            Najpierw usuń przeszkodę albo uzupełnij dane — wtedy pokażemy procedurę wniosku.
          </Text>
        )}
      </Card>

      <Card>
        <Text style={styles.section}>Ile mogę otrzymać?</Text>
        <Text style={styles.body}>
          {benefit.amountNote ??
            'Kwota pojawi się po kalkulacji w backendzie. Nie liczymy jej lokalnie.'}
        </Text>
        <Button
          label="Otwórz kalkulator"
          variant="secondary"
          onPress={() => router.push('/calculator')}
        />
      </Card>

      <Card>
        <Text style={styles.section}>Skąd ta informacja?</Text>
        <Text style={styles.meta}>{benefit.legalBasisNote}</Text>
        {benefit.sourceUrls.map((url) => (
          <Text
            key={url}
            style={styles.link}
            onPress={() => Linking.openURL(url)}
            accessibilityRole="link"
          >
            {url}
          </Text>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  section: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  body: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  meta: { ...typography.small, color: colors.textMuted, marginBottom: spacing.xs },
  row: { gap: spacing.xxs, marginBottom: spacing.md },
  rowTitle: { ...typography.bodyStrong, color: colors.text },
  link: { ...typography.bodyStrong, color: colors.primary, marginBottom: spacing.xs },
  muted: { ...typography.body, color: colors.textSecondary },
});
