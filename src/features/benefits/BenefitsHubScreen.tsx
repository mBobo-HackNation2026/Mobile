import { useQuery } from '@tanstack/react-query';
import { Link, router, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { InstitutionMark } from '@/components/ui/InstitutionMark';
import { Screen } from '@/components/ui/Screen';
import { BENEFIT_TONE } from '@/features/benefits/benefitUi';
import { resolveBenefitInstitution } from '@/features/benefits/resolveBenefitInstitution';
import { apiErrorMessage } from '@/lib/apiErrorMessage';
import { eligibilityService, getApiMode } from '@/services/api';
import { useUserJourneyStore } from '@/store/useUserJourneyStore';
import { colors, spacing, typography } from '@/theme';
import {
  BENEFIT_GROUP_ORDER,
  BENEFIT_GROUP_TITLE,
  BENEFIT_STATUS_LABEL,
  type BenefitAssessment,
  type BenefitPresentationStatus,
} from '@/types/benefits';

export function BenefitsHubScreen() {
  const profile = useUserJourneyStore((s) => s.profile);
  const mode = getApiMode();

  const query = useQuery({
    queryKey: ['eligibility', profile],
    queryFn: () => eligibilityService.evaluate(profile),
    enabled: profile.onboardingCompleted,
  });

  if (!profile.onboardingCompleted) {
    return (
      <Screen>
        <EmptyState
          title="Najpierw poznajmy Twoją sytuację"
          description="Krótka ankieta lub profil demo — potem pokażemy, jakie świadczenia możesz mieć i co zrobić dalej."
          actionLabel="Rozpocznij"
          onAction={() => router.push('/onboarding')}
        />
      </Screen>
    );
  }

  if (query.isLoading) {
    return (
      <Screen>
        <Card>
          <Text style={styles.muted}>Analizujemy potencjalne uprawnienia…</Text>
        </Card>
      </Screen>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Screen>
        <EmptyState
          title="Nie udało się ocenić świadczeń"
          description={apiErrorMessage(
            query.error,
            mode === 'rest'
              ? 'Sprawdź połączenie z API albo ustaw EXPO_PUBLIC_API_MODE=mock.'
              : 'Spróbuj ponownie — mock powinien działać offline.',
          )}
          actionLabel="Spróbuj ponownie"
          onAction={() => query.refetch()}
        />
      </Screen>
    );
  }

  const grouped = groupBenefits(query.data.benefits);

  return (
    <Screen
      title="Moje świadczenia"
      subtitle="Zasiłki i urlopy ZUS — ocena na podstawie Twoich danych, przeszkody i kolejny krok do wniosku. Świadczenia poza ZUS (bez silnika oceny) są na osobnym ekranie."
    >
      <DemoBanner
        message={
          mode === 'rest'
            ? '9 świadczeń: FastAPI /eligibility/check/{code}. Bez cichego mocka. To nie jest decyzja ZUS. Deklaracja ankiety ≠ potwierdzenie ZUS.'
            : 'Ocena jest symulacją mock — nie decyzją ZUS. Ustaw EXPO_PUBLIC_API_MODE=rest, by podłączyć silnik.'
        }
      />

      {query.data.missingInputs.length > 0 ? (
        <Card>
          <Badge label="Brakuje danych" tone="primary" />
          <Text style={styles.cardTitle}>Uzupełnij, żeby doprecyzować ocenę</Text>
          <Text style={styles.body}>Brakuje: {query.data.missingInputs.join(', ')}.</Text>
          <Button label="Uzupełnij informacje" onPress={() => router.push('/onboarding')} />
        </Card>
      ) : null}

      {BENEFIT_GROUP_ORDER.map((status) => {
        const items = grouped[status];
        if (!items.length) return null;
        return (
          <View key={status} style={styles.group}>
            <Text style={styles.groupTitle}>{BENEFIT_GROUP_TITLE[status]}</Text>
            {items.map((benefit) => (
              <BenefitCard key={benefit.id} benefit={benefit} />
            ))}
          </View>
        );
      })}

      <Card>
        <Badge label="Poza silnikiem ZUS" tone="demo" />
        <Text style={styles.cardTitle}>Inne świadczenia (800+, becikowe…)</Text>
        <Text style={styles.body}>
          Nie oceniamy ich w eBobo — brak silnika uprawnień. Tu zostają tylko zasiłki ZUS z
          indywidualną oceną. Informacje i oficjalne źródła są osobno.
        </Text>
        <Button
          label="Zobacz inne świadczenia"
          variant="secondary"
          onPress={() => router.push('/other-benefits')}
        />
      </Card>

      <Card>
        <Badge label={mode === 'rest' ? 'FastAPI katalog 9' : 'Mock'} tone="primary" />
        <Text style={styles.cardTitle}>Kalkulator i porównanie</Text>
        <Text style={styles.body}>
          {mode === 'rest'
            ? 'Kwoty: POST /benefits/calculate/{code}. Podział rodzicielskiego: compare/urlop-rodzicielski.'
            : 'W trybie mock kalkulator używa lokalnych fixture’ów DEMO.'}
        </Text>
        <Button
          label="Otwórz kalkulator"
          variant="secondary"
          onPress={() => router.push('/calculator')}
        />
      </Card>

      <Card>
        <Text style={styles.meta}>
          Wersja reguł hubu: {query.data.ruleSetVersion}. {query.data.warnings.join(' ')}
        </Text>
        <Link href="/sprawy">
          <Text style={styles.link}>Przejdź do Moich spraw (terminy i checklista) →</Text>
        </Link>
      </Card>
    </Screen>
  );
}

function BenefitCard({ benefit }: { benefit: BenefitAssessment }) {
  const institutionId = resolveBenefitInstitution(benefit);

  return (
    <Card>
      <View style={styles.cardTop}>
        <Badge label={BENEFIT_STATUS_LABEL[benefit.status]} tone={BENEFIT_TONE[benefit.status]} />
        {institutionId ? <InstitutionMark institutionId={institutionId} /> : null}
      </View>
      <Text style={styles.cardTitle}>{benefit.title}</Text>
      <Text style={styles.body}>{benefit.headline}</Text>
      <Text style={styles.meta}>{benefit.summary}</Text>
      {benefit.warnings && benefit.warnings.length > 0 ? (
        <Badge label={`${benefit.warnings.length} ostrzeż.`} tone="warning" />
      ) : null}
      {benefit.planMissing ? (
        <Badge label="Brak planu formalności" tone="neutral" />
      ) : null}
      <Text style={styles.next}>Następny krok: {benefit.nextStepLabel}</Text>
      <Button
        label={benefit.nextStepLabel}
        onPress={() => router.push(benefit.nextStepHref as Href)}
      />
      <Link href={`/benefits/${benefit.id}` as Href}>
        <Text style={styles.link}>Szczegóły świadczenia →</Text>
      </Link>
    </Card>
  );
}

function groupBenefits(benefits: BenefitAssessment[]) {
  const map = BENEFIT_GROUP_ORDER.reduce(
    (acc, status) => {
      acc[status] = [];
      return acc;
    },
    {} as Record<BenefitPresentationStatus, BenefitAssessment[]>,
  );

  for (const benefit of benefits) {
    map[benefit.status].push(benefit);
  }
  return map;
}

const styles = StyleSheet.create({
  group: { gap: spacing.md },
  groupTitle: { ...typography.h2, color: colors.text },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitle: { ...typography.h3, color: colors.text, marginTop: spacing.sm },
  body: { ...typography.body, color: colors.textSecondary, marginVertical: spacing.sm },
  meta: { ...typography.small, color: colors.textMuted, marginBottom: spacing.sm },
  next: { ...typography.bodyStrong, color: colors.text, marginBottom: spacing.sm },
  link: { ...typography.bodyStrong, color: colors.primary, marginTop: spacing.sm },
  muted: { ...typography.body, color: colors.textSecondary },
});
