import { Link, router, useLocalSearchParams, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { InstitutionMark } from '@/components/ui/InstitutionMark';
import { LegalDisclaimer } from '@/components/ui/LegalDisclaimer';
import { Screen } from '@/components/ui/Screen';
import { BenefitExplainSection } from '@/features/benefits/BenefitExplainSection';
import {
  assessmentReviewHref,
  BENEFIT_TONE,
  CONDITION_LABEL,
  CONDITION_TONE,
  shouldOpenAssessmentReview,
} from '@/features/benefits/benefitUi';
import { BenefitFormalitiesPanel } from '@/features/benefits/BenefitFormalitiesPanel';
import { OfficialLinksSection } from '@/features/benefits/OfficialLinksSection';
import { mentionsRetiredForm } from '@/features/benefits/officialLinks';
import { resolveBenefitInstitution } from '@/features/benefits/resolveBenefitInstitution';
import { useCatalogEligibility } from '@/hooks/useCatalogEligibility';
import { apiErrorMessage } from '@/lib/apiErrorMessage';
import { formatDatePl } from '@/lib/format';
import { getApiMode, isKnownBenefitCode, type BenefitCode } from '@/services/api';
import { colors, spacing, typography } from '@/theme';
import { BENEFIT_STATUS_LABEL, type BenefitAssessment } from '@/types/benefits';
import { INSTITUTIONS } from '@/types/institutions';

export function BenefitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const mode = getApiMode();
  const [showConditions, setShowConditions] = useState(false);

  const { profile, evaluation, isLoading, isError, error, refetch } =
    useCatalogEligibility();

  const benefit = evaluation?.benefits.find((item) => item.id === id);

  if (!profile.onboardingCompleted) {
    return (
      <Screen>
        <EmptyState title="Brak danych" description="Uzupełnij ankietę." />
      </Screen>
    );
  }

  if (isLoading) {
    return (
      <Screen>
        <Card>
          <Text style={styles.muted}>Ładowanie…</Text>
        </Card>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <EmptyState
          title="Nie udało się wczytać szczegółów"
          description={apiErrorMessage(error, 'Spróbuj ponownie.')}
          actionLabel="Spróbuj ponownie"
          onAction={() => refetch()}
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
  const needsReview =
    benefit.status === 'needs_review' || benefit.requiresVerification;
  const openReview = shouldOpenAssessmentReview(benefit.status);
  const calm = benefit.id === 'zasilek_pogrzebowy_martwe_urodzenie';
  const benefitCode = isKnownBenefitCode(benefit.id)
    ? (benefit.id as BenefitCode)
    : null;
  const calcHref = `/calculator?benefit=${encodeURIComponent(benefit.id)}&from=benefit` as Href;

  return (
    <Screen
      title={benefit.title}
      subtitle={benefit.headline}
      backFallbackHref="/benefits"
    >
      <DemoBanner
        message={
          mode === 'rest'
            ? 'Ocena informacyjna na podstawie Twoich danych — nie decyzja ZUS.'
            : 'Dane przykładowe — nie decyzja ZUS.'
        }
      />
      {needsReview ? (
        <LegalDisclaimer variant="verification" />
      ) : (
        <LegalDisclaimer />
      )}

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Badge
            label={BENEFIT_STATUS_LABEL[benefit.status]}
            tone={BENEFIT_TONE[benefit.status]}
          />
          {institutionId ? (
            <InstitutionMark institutionId={institutionId} withLabel size="md" />
          ) : null}
        </View>
        {institutionId ? (
          <Text style={styles.meta}>
            Adresat: {INSTITUTIONS[institutionId].fullLabel}
          </Text>
        ) : null}
      </View>

      {/* 1. Twój wynik */}
      <Card>
        <Text style={styles.section}>Twój wynik</Text>
        <Text style={styles.body}>{benefit.rationale}</Text>
        {benefit.warnings && benefit.warnings.length > 0
          ? benefit.warnings.map((warning) => (
              <Text key={warning} style={styles.warn}>
                • {warning}
              </Text>
            ))
          : null}
        <Pressable
          onPress={() => setShowConditions((v) => !v)}
          accessibilityRole="button"
        >
          <Text style={styles.link}>
            {showConditions ? 'Ukryj warunki' : 'Pokaż warunki oceny'} →
          </Text>
        </Pressable>
        {showConditions
          ? benefit.conditions.map((condition) => (
              <View key={condition.id} style={styles.row}>
                <Badge
                  label={CONDITION_LABEL[condition.state]}
                  tone={CONDITION_TONE[condition.state]}
                />
                <Text style={styles.rowTitle}>{condition.label}</Text>
                <Text style={styles.meta}>{condition.explanation}</Text>
              </View>
            ))
          : null}
        {openReview ? (
          <Button
            label="Sprawdź szczegóły oceny"
            onPress={() =>
              router.push(assessmentReviewHref(benefit.id) as Href)
            }
            fullWidth
          />
        ) : null}
      </Card>

      <BenefitExplainSection benefit={benefit} profile={profile} />

      {/* 2. Ile możesz otrzymać? */}
      <AmountSection benefit={benefit} calcHref={calcHref} />

      {/* Porównanie rodziców — tylko urlop rodzicielski */}
      {benefit.id === 'urlop_rodzicielski' ? (
        <Card>
          <Text style={styles.section}>Jak podzielić urlop między rodziców?</Text>
          <Text style={styles.body}>
            Porównaj warianty podziału tygodni i szacunkowe kwoty dla obojga rodziców.
            Nieprzenoszalne tygodnie drugiego rodzica rozliczane są według odpowiedzi
            silnika — bez lokalnego przeliczania.
          </Text>
          <Button
            label="Porównaj warianty"
            onPress={() =>
              router.push(
                `/calculator?benefit=${encodeURIComponent(benefit.id)}&from=benefit&compare=1` as Href,
              )
            }
            fullWidth
          />
        </Card>
      ) : null}

      {/* 3. Co należy przygotować? */}
      {benefitCode ? (
        <BenefitFormalitiesPanel benefitCode={benefitCode} />
      ) : null}
      <ProcedureSection benefit={benefit} calm={calm} />

      {/* 4. Gdzie załatwisz sprawę? */}
      {benefitCode ? (
        <OfficialLinksSection
          benefitCode={benefitCode}
          profile={profile}
          officeText={benefit.procedure?.office}
          calm={calm}
        />
      ) : null}

      {calm || benefit.id === 'uzupelniajacy_urlop_macierzynski' ? (
        <Card style={styles.calmCard}>
          <Text style={styles.section}>Gdzie szukać pomocy</Text>
          <Text style={styles.body}>
            W szczególnych sytuacjach możesz sprawdzić zweryfikowane organizacje
            charytatywne — bez nachalnego marketingu.
          </Text>
          <Button
            label="Otwórz listę wsparcia"
            variant="secondary"
            onPress={() => router.push('/help')}
            fullWidth
          />
        </Card>
      ) : null}

      {/* 5. Co dalej? */}
      <Card>
        <Text style={styles.section}>Co dalej?</Text>
        {benefit.remedies.length > 0 ? (
          <>
            {benefit.remedies.slice(0, 2).map((remedy) => (
              <Text key={remedy.id} style={styles.body}>
                • {remedy.title}
              </Text>
            ))}
            <Button
              label="Sprawdź możliwe rozwiązania"
              variant="secondary"
              onPress={() =>
                router.push(`/benefits/${benefit.id}/solutions` as Href)
              }
              fullWidth
            />
          </>
        ) : (
          <Text style={styles.body}>
            {benefit.nextStepLabel
              ? `Następny krok: ${benefit.nextStepLabel}.`
              : 'Możesz policzyć kwotę, sprawdzić dokumenty albo przejść do oficjalnej instytucji.'}
          </Text>
        )}
        {benefit.alternatives.map((alt) => (
          <Link key={alt.id} href={`/benefits/${alt.id}` as Href}>
            <Text style={styles.link}>Alternatywa: {alt.title} →</Text>
          </Link>
        ))}
        <Button
          label="Mój plan"
          variant="ghost"
          onPress={() => router.push('/home')}
          fullWidth
        />
      </Card>
    </Screen>
  );
}

function AmountSection({
  benefit,
  calcHref,
}: {
  benefit: BenefitAssessment;
  calcHref: Href;
}) {
  const status = benefit.status;
  const notEligible = status === 'not_eligible';
  const needsInfo =
    status === 'insufficient_data' ||
    status === 'needs_review' ||
    status === 'obstacle_with_options';

  return (
    <Card>
      <Text style={styles.section}>Ile możesz otrzymać?</Text>
      <Text style={styles.body}>
        {benefit.amountNote ??
          'Kwota pochodzi wyłącznie z silnika. Nie liczymy jej lokalnie.'}
      </Text>

      {status === 'likely_eligible' ? (
        <>
          <Text style={styles.meta}>
            To przewidywane uprawnienie na podstawie podanych danych — nie decyzja ZUS.
          </Text>
          <Button
            label="Oblicz wysokość świadczenia"
            onPress={() => router.push(calcHref)}
            fullWidth
          />
        </>
      ) : null}

      {needsInfo ? (
        <>
          <Text style={styles.meta}>
            Możemy oszacować kwotę, ale samo uprawnienie wymaga dodatkowych informacji.
          </Text>
          <Button
            label="Oblicz wysokość świadczenia"
            onPress={() => router.push(calcHref)}
            fullWidth
          />
          <Button
            label="Uzupełnij informacje"
            variant="secondary"
            onPress={() => router.push('/complete-data')}
            fullWidth
          />
        </>
      ) : null}

      {notEligible ? (
        <>
          <Text style={styles.meta}>
            Kalkulator nie zmienia oceny uprawnienia. Symulacja kwoty służy wyłącznie
            do orientacji.
          </Text>
          <Button
            label="Sprawdź symulację kwoty"
            variant="secondary"
            onPress={() => router.push(calcHref)}
            fullWidth
          />
        </>
      ) : null}
    </Card>
  );
}

function ProcedureSection({
  benefit,
  calm,
}: {
  benefit: BenefitAssessment;
  calm: boolean;
}) {
  const procedure = benefit.procedure;
  const formCode = procedure?.formCode ?? null;
  const retired =
    formCode != null && mentionsRetiredForm(formCode)
      ? formCode
      : procedure?.documents.find((d) => mentionsRetiredForm(d));

  return (
    <Card style={calm ? styles.calmCard : undefined}>
      <Text style={styles.section}>Co należy przygotować?</Text>
      {procedure ? (
        <>
          {formCode && !mentionsRetiredForm(formCode) ? (
            <Text style={styles.body}>Formularz: {formCode}</Text>
          ) : null}
          {retired ? (
            <View style={styles.warnBox}>
              <Badge label="Formularz historyczny" tone="warning" />
              <Text style={styles.meta}>
                Wskazanie „{retired}” może być nieaktualne (od 24.10.2026 ZUR/ZAO → ZAM,
                Z-3b zlikwidowano). Sprawdź aktualny wzór na stronie ZUS w sekcji poniżej.
              </Text>
            </View>
          ) : null}
          {procedure.documents.length > 0 ? (
            procedure.documents.map((doc) => (
              <Text key={doc} style={styles.meta}>
                • {doc}
                {/gdy|jeśli|jeżeli|optional|opcjonal/i.test(doc)
                  ? ' (warunkowo)'
                  : ''}
              </Text>
            ))
          ) : (
            <Text style={styles.body}>
              Brak listy dokumentów w tej odpowiedzi — sprawdź oficjalną procedurę.
            </Text>
          )}
          <Text style={styles.body}>
            Gdzie: {procedure.office ?? 'Do potwierdzenia'}
          </Text>
          <Text style={styles.body}>
            Do kiedy:{' '}
            {procedure.submitBy
              ? formatDatePl(procedure.submitBy)
              : 'Brak sztywnego terminu w tej odpowiedzi'}
          </Text>
          {procedure.steps.map((step, index) => (
            <Text key={step} style={styles.meta}>
              {index + 1}. {step}
            </Text>
          ))}
          {procedure.simulatedSubmission ? (
            <Badge label="Składanie w app — tylko symulacja" tone="demo" />
          ) : null}
          <Button
            label="Przejdź do dokumentów"
            variant="secondary"
            onPress={() => router.push('/documents')}
            fullWidth
          />
        </>
      ) : benefit.planMissing ||
        benefit.status === 'needs_review' ||
        benefit.status === 'insufficient_data' ? (
        <Text style={styles.body}>
          Brak ostatecznej listy obowiązków — ocena wymaga jeszcze danych lub
          weryfikacji. Nie tworzymy fikcyjnej checklisty.
        </Text>
      ) : (
        <Text style={styles.body}>
          Najpierw usuń przeszkodę albo uzupełnij dane — wtedy pokażemy procedurę.
        </Text>
      )}
    </Card>
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
  body: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  meta: {
    ...typography.small,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  row: { gap: spacing.xxs, marginBottom: spacing.md },
  rowTitle: { ...typography.bodyStrong, color: colors.text },
  link: {
    ...typography.bodyStrong,
    color: colors.primary,
    marginBottom: spacing.xs,
    minHeight: 44,
    paddingTop: spacing.xs,
  },
  muted: { ...typography.body, color: colors.textSecondary },
  warn: {
    ...typography.body,
    color: colors.warning,
    marginBottom: spacing.xs,
  },
  warnBox: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  calmCard: {
    backgroundColor: colors.surface,
  },
});
