import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, router, useLocalSearchParams, type Href } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { LegalDisclaimer } from '@/components/ui/LegalDisclaimer';
import { Screen } from '@/components/ui/Screen';
import { BenefitExplainSection } from '@/features/benefits/BenefitExplainSection';
import {
  BENEFIT_TONE,
  CONDITION_LABEL,
  CONDITION_TONE,
} from '@/features/benefits/benefitUi';
import { ProfileAnswersReview } from '@/features/benefits/ProfileAnswersReview';
import {
  CATALOG_ELIGIBILITY_QUERY_KEY,
  useCatalogEligibility,
} from '@/hooks/useCatalogEligibility';
import { apiErrorMessage } from '@/lib/apiErrorMessage';
import {
  BENEFIT_CODE_LABEL,
  checkBenefitEligibility,
  getApiMode,
  isKnownBenefitCode,
  mapEligibilityCheckToBenefit,
  profileToEligibilityCheckRequest,
} from '@/services/api';
import type { LegalAdvisorExplainResponse } from '@/services/api/legalAdvisorExplain';
import { useUserJourneyStore } from '@/store/useUserJourneyStore';
import { colors, radii, spacing, typography } from '@/theme';
import {
  BENEFIT_STATUS_HEADLINE,
  BENEFIT_STATUS_LABEL,
  type BenefitAssessment,
} from '@/types/benefits';
import type { ParentProfile } from '@/types/journey';

/**
 * Widok „Szczegóły oceny i ponowna weryfikacja” — dla wyników negatywnych / niejednoznacznych.
 * AI wyłącznie wyjaśnia; ponowna ocena idzie przez eligibility/check.
 */
export function BenefitAssessmentReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const setProfile = useUserJourneyStore((s) => s.setProfile);
  const mode = getApiMode();
  const queryClient = useQueryClient();
  const [explain, setExplain] = useState<LegalAdvisorExplainResponse | null>(null);
  const [overrideBenefit, setOverrideBenefit] = useState<BenefitAssessment | null>(
    null,
  );

  const {
    profile,
    evaluation,
    isLoading,
    isError,
    error,
    refetch,
  } = useCatalogEligibility();

  const fromList = evaluation?.benefits.find((item) => item.id === id);
  const benefit = overrideBenefit?.id === id ? overrideBenefit : fromList;

  const recheck = useMutation({
    mutationFn: async (nextProfile: ParentProfile) => {
      if (!id) throw new Error('Brak kodu świadczenia');
      const payload = profileToEligibilityCheckRequest(nextProfile);
      const result = await checkBenefitEligibility(id, payload);
      return mapEligibilityCheckToBenefit(result, nextProfile);
    },
    onSuccess: async (mapped) => {
      setOverrideBenefit(mapped);
      setExplain(null);
      await queryClient.invalidateQueries({
        queryKey: [CATALOG_ELIGIBILITY_QUERY_KEY],
      });
    },
  });

  if (!profile.onboardingCompleted) {
    return (
      <Screen>
        <EmptyState
          title="Brak danych"
          description="Uzupełnij ankietę, żeby zobaczyć szczegóły oceny."
          actionLabel="Ankieta"
          onAction={() => router.push('/onboarding')}
        />
      </Screen>
    );
  }

  if (isLoading && !benefit) {
    return (
      <Screen title="Szczegóły oceny">
        <Card>
          <Text style={styles.muted}>Ładowanie wyniku oceny…</Text>
        </Card>
      </Screen>
    );
  }

  if (isError && !benefit) {
    return (
      <Screen title="Szczegóły oceny">
        <EmptyState
          title="Nie udało się wczytać oceny"
          description={apiErrorMessage(error, 'Spróbuj ponownie.')}
          actionLabel="Spróbuj ponownie"
          onAction={() => refetch()}
        />
      </Screen>
    );
  }

  if (!benefit || !id) {
    return (
      <Screen title="Szczegóły oceny">
        <EmptyState
          title="Nie znaleziono świadczenia"
          description="Wróć do listy Moje świadczenia."
          actionLabel="Lista"
          onAction={() => router.push('/benefits')}
        />
      </Screen>
    );
  }

  const unmet = benefit.conditions.filter((c) => c.state === 'unmet');
  const unknown = benefit.conditions.filter((c) => c.state === 'unknown');
  const needsIndividual =
    benefit.status === 'needs_review' ||
    benefit.status === 'insufficient_data' ||
    benefit.requiresVerification ||
    explain?.requires_additional_verification === true;

  const reasonCopy = parentFriendlyReason(benefit);

  return (
    <Screen
      title="Szczegóły oceny"
      subtitle={benefit.title}
      backFallbackHref={`/benefits/${encodeURIComponent(benefit.id)}`}
    >
      <DemoBanner
        message={
          mode === 'rest'
            ? 'Ocena informacyjna — nie decyzja ZUS. AI nie przyznaje świadczenia.'
            : 'Ocena na danych przykładowych — nie decyzja ZUS.'
        }
      />
      <LegalDisclaimer variant="verification" />

      {/* Sekcja A — Wynik i powód */}
      <Card>
        <View style={styles.headerTop}>
          <Badge
            label={BENEFIT_STATUS_LABEL[benefit.status]}
            tone={BENEFIT_TONE[benefit.status]}
          />
        </View>
        <Text style={styles.benefitTitle}>{benefit.title}</Text>
        <Text style={styles.headline}>{BENEFIT_STATUS_HEADLINE[benefit.status]}</Text>
        <Text style={styles.body}>{reasonCopy}</Text>

        {needsIndividual ? (
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>
              Twoja sytuacja może wymagać indywidualnego sprawdzenia.
            </Text>
            <Text style={styles.infoBody}>
              Pokazujemy dostępne informacje z silnika. Nie generujemy odpowiedzi poza
              potwierdzonymi źródłami.
            </Text>
          </View>
        ) : null}

        {unmet.length > 0 ? (
          <>
            <Text style={styles.section}>Niespełnione warunki</Text>
            {unmet.map((condition) => (
              <View key={condition.id} style={styles.conditionRow}>
                <Badge
                  label={CONDITION_LABEL[condition.state]}
                  tone={CONDITION_TONE[condition.state]}
                />
                <Text style={styles.rowTitle}>{condition.label}</Text>
                {condition.explanation ? (
                  <Text style={styles.meta}>{condition.explanation}</Text>
                ) : null}
              </View>
            ))}
          </>
        ) : null}

        {unknown.length > 0 ? (
          <>
            <Text style={styles.section}>Do uzupełnienia</Text>
            {unknown.map((condition) => (
              <View key={condition.id} style={styles.conditionRow}>
                <Badge
                  label={CONDITION_LABEL[condition.state]}
                  tone={CONDITION_TONE[condition.state]}
                />
                <Text style={styles.rowTitle}>{condition.label}</Text>
              </View>
            ))}
          </>
        ) : null}

        {recheck.isPending ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.meta}>Ponownie oceniamy uprawnienie…</Text>
          </View>
        ) : null}
        {recheck.isError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              {apiErrorMessage(
                recheck.error,
                'Nie udało się ponownie ocenić świadczenia.',
              )}
            </Text>
            <Button
              label="Spróbuj ponownie"
              variant="secondary"
              onPress={() => recheck.mutate(profile)}
            />
          </View>
        ) : null}
      </Card>

      {/* Sekcja B — Double check */}
      <ProfileAnswersReview
        profile={profile}
        busy={recheck.isPending}
        onApplyAndRecheck={(patch) => {
          const next = { ...profile, ...patch };
          setProfile(patch);
          setOverrideBenefit(null);
          recheck.mutate(next);
        }}
      />

      {/* Sekcja C — AI */}
      <BenefitExplainSection
        benefit={benefit}
        profile={profile}
        ctaLabel="Wyjaśnij mój wynik z AI"
        loadingHint="Analizujemy Twoją sytuację na podstawie dostępnych przepisów…"
        onExplainResult={setExplain}
      />

      {/* Sekcja D — Co możesz teraz zrobić */}
      <Card>
        <Text style={styles.section}>Co możesz teraz zrobić?</Text>
        <Text style={styles.body}>
          Kroki wynikają z oceny silnika, formalności lub wyjaśnienia — nie są poradą
          prawną generowaną lokalnie.
        </Text>
        <ActionList benefit={benefit} explain={explain} />
      </Card>

      {/* Sekcja E — Podstawy prawne */}
      <Card>
        <Text style={styles.section}>Podstawy prawne</Text>
        {explain?.requires_additional_verification ? (
          <View style={styles.warnBox}>
            <Text style={styles.warnText}>
              Nie wszystkie informacje udało się potwierdzić na podstawie dostępnych
              źródeł. Zalecamy dodatkową weryfikację w ZUS lub u specjalisty.
            </Text>
          </View>
        ) : null}
        {explain && explain.verified_legal_basis.length > 0 ? (
          explain.verified_legal_basis.map((item) => (
            <Text key={item} style={styles.meta}>
              • {item}
            </Text>
          ))
        ) : benefit.legalBasisNote ? (
          <Text style={styles.meta}>
            {parentFriendlyLegalNote(benefit.legalBasisNote)}
          </Text>
        ) : (
          <Text style={styles.meta}>
            Podstawa prawna pojawi się po wyjaśnieniu AI albo w szczegółach procedury.
          </Text>
        )}
        <Button
          label="Pełne szczegóły świadczenia"
          variant="ghost"
          onPress={() =>
            router.push(`/benefits/${encodeURIComponent(benefit.id)}` as Href)
          }
        />
      </Card>
    </Screen>
  );
}

function ActionList({
  benefit,
  explain,
}: {
  benefit: BenefitAssessment;
  explain: LegalAdvisorExplainResponse | null;
}) {
  const steps: { key: string; label: string; href?: string }[] = [];

  if (benefit.conditions.some((c) => c.state === 'unknown')) {
    steps.push({
      key: 'fill',
      label: 'Uzupełnij brakujące dane w odpowiedziach powyżej lub w ankiecie.',
      href: '/onboarding',
    });
  }

  for (const remedy of benefit.remedies.slice(0, 4)) {
    steps.push({
      key: remedy.id,
      label: remedy.title,
      href: remedy.ctaHref,
    });
  }

  if (explain?.suggested_next_steps?.length) {
    for (const [index, step] of explain.suggested_next_steps.entries()) {
      steps.push({ key: `ai-step-${index}`, label: step });
    }
  }

  steps.push({
    key: 'calc',
    label: 'Oblicz wysokość świadczenia',
    href: `/calculator?benefit=${encodeURIComponent(benefit.id)}&from=benefit`,
  });

  if (benefit.id === 'urlop_rodzicielski') {
    steps.push({
      key: 'compare',
      label: 'Porównaj warianty podziału urlopu',
      href: `/calculator?benefit=${encodeURIComponent(benefit.id)}&from=benefit&compare=1`,
    });
  }

  if (benefit.procedure?.documents[0]) {
    steps.push({
      key: 'docs',
      label: `Przygotuj dokument: ${benefit.procedure.documents[0]}`,
      href: '/documents',
    });
  }

  for (const alt of benefit.alternatives) {
    steps.push({
      key: `alt-${alt.id}`,
      label: `Sprawdź inne świadczenie: ${alt.title}`,
      href: `/benefits/${encodeURIComponent(alt.id)}`,
    });
  }

  if (explain?.other_benefits_to_check?.length) {
    for (const code of explain.other_benefits_to_check) {
      const title = isKnownBenefitCode(code)
        ? BENEFIT_CODE_LABEL[code]
        : code;
      steps.push({
        key: `other-${code}`,
        label: `Warto osobno sprawdzić: ${title}`,
        href: `/benefits/${encodeURIComponent(code)}`,
      });
    }
  }

  if (benefit.requiresVerification || benefit.status === 'needs_review') {
    steps.push({
      key: 'zus',
      label: 'Zweryfikuj informacje w ZUS lub u płatnika składek.',
    });
  }

  if (steps.length === 0) {
    return (
      <Text style={styles.body}>
        Możesz poprawić odpowiedzi powyżej albo wrócić do listy świadczeń.
      </Text>
    );
  }

  return (
    <View style={styles.actionList}>
      {steps.map((step, index) => (
        <View key={step.key} style={styles.actionItem}>
          <Text style={styles.actionIndex}>{index + 1}.</Text>
          <View style={styles.actionBody}>
            <Text style={styles.actionLabel}>{step.label}</Text>
            {step.href ? (
              <Link href={step.href as Href}>
                <Text style={styles.link}>Przejdź →</Text>
              </Link>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

function parentFriendlyReason(benefit: BenefitAssessment): string {
  if (benefit.status === 'not_eligible') {
    return 'Na podstawie podanych informacji nie możemy potwierdzić prawa do tego świadczenia. Możesz sprawdzić swoje odpowiedzi i zobaczyć, jakie dodatkowe informacje mogą wpłynąć na ocenę.';
  }
  if (benefit.status === 'needs_review' || benefit.requiresVerification) {
    return 'Wynik jest niejednoznaczny albo wymaga potwierdzenia. To nie jest formalna odmowa ZUS — część warunków trzeba jeszcze zweryfikować.';
  }
  if (benefit.status === 'insufficient_data') {
    return 'Brakuje informacji potrzebnych do oceny. Uzupełnij odpowiedzi i uruchom ponowną ocenę silnika.';
  }
  if (benefit.status === 'obstacle_with_options') {
    return 'Obecnie nie spełniasz jednego z warunków. Sprawdź, czy możesz poprawić dane albo skorzystać z innej ścieżki.';
  }
  return benefit.headline;
}

/** Ukrywa surowe ID ścieżek API przed rodzicem. */
function parentFriendlyLegalNote(note: string): string {
  return note
    .replace(/FastAPI eligibility\/check\/[^\s·]+/gi, 'Ocena uprawnień')
    .replace(/Ocena silnika uprawnień/gi, 'Ocena uprawnień')
    .replace(/rules_version\s*\d+/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const styles = StyleSheet.create({
  headerTop: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  benefitTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.xs },
  headline: {
    ...typography.bodyStrong,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  section: {
    ...typography.bodyStrong,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  meta: { ...typography.small, color: colors.textMuted, marginBottom: spacing.xs },
  muted: { ...typography.body, color: colors.textSecondary },
  conditionRow: { gap: spacing.xxs, marginBottom: spacing.md },
  rowTitle: { ...typography.bodyStrong, color: colors.text },
  infoBox: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  infoTitle: { ...typography.bodyStrong, color: colors.text },
  infoBody: { ...typography.small, color: colors.textSecondary },
  warnBox: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  warnText: { ...typography.small, color: colors.warning },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  errorBox: { gap: spacing.sm, marginTop: spacing.sm },
  errorText: { ...typography.body, color: colors.danger },
  actionList: { gap: spacing.sm },
  actionItem: { flexDirection: 'row', gap: spacing.sm },
  actionIndex: { ...typography.bodyStrong, color: colors.primary, width: 22 },
  actionBody: { flex: 1, gap: spacing.xxs },
  actionLabel: { ...typography.body, color: colors.textSecondary },
  link: { ...typography.bodyStrong, color: colors.primary },
});
