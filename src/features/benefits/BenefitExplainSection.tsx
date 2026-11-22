import { useMutation } from '@tanstack/react-query';
import { Link, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  isUserAbortError,
  shouldAcceptExplainResponse,
} from '@/features/benefits/explainAcceptance';
import { apiErrorMessage } from '@/lib/apiErrorMessage';
import {
  BENEFIT_CODE_LABEL,
  getApiMode,
  isKnownBenefitCode,
  profileToEligibilityCheckRequest,
} from '@/services/api';
import {
  explainBenefitEligibility,
  isExplainStatusAligned,
  type LegalAdvisorExplainResponse,
} from '@/services/api/legalAdvisorExplain';
import { colors, radii, spacing, typography } from '@/theme';
import type { BenefitAssessment } from '@/types/benefits';
import type { ParentProfile } from '@/types/journey';

type Props = {
  benefit: BenefitAssessment;
  profile: ParentProfile;
  /** Domyślnie: „Wyjaśnij mój wynik”. */
  ctaLabel?: string;
  loadingHint?: string;
  onExplainResult?: (data: LegalAdvisorExplainResponse | null) => void;
};

/**
 * Wyjaśnienie wyniku na żądanie — nie zmienia statusu eligibility.
 */
export function BenefitExplainSection({
  benefit,
  profile,
  ctaLabel = 'Wyjaśnij mój wynik',
  loadingHint = 'Przygotowujemy wyjaśnienie Twojej sytuacji…',
  onExplainResult,
}: Props) {
  const mode = getApiMode();
  const [showLegal, setShowLegal] = useState(false);
  const [result, setResult] = useState<LegalAdvisorExplainResponse | null>(null);
  const [statusMismatch, setStatusMismatch] = useState(false);
  const requestGen = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  /** Snapshot profilu w momencie startu — do diagnostyki, bez logowania PII. */
  const profileKey = profile.demoScenarioId ?? `${profile.stage}:${profile.employmentType}:${profile.insuranceStatus}`;

  const prominent =
    benefit.status === 'not_eligible' ||
    benefit.status === 'needs_review' ||
    benefit.requiresVerification;

  useEffect(() => {
    requestGen.current += 1;
    abortRef.current?.abort();
    setResult(null);
    setStatusMismatch(false);
    setShowLegal(false);
    onExplainResult?.(null);
  }, [benefit.id, profileKey, onExplainResult]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const mutation = useMutation({
    mutationFn: async () => {
      abortRef.current?.abort();
      setResult(null);
      setStatusMismatch(false);
      onExplainResult?.(null);
      const controller = new AbortController();
      abortRef.current = controller;
      const gen = ++requestGen.current;
      const payload = profileToEligibilityCheckRequest(profile);
      const data = await explainBenefitEligibility(
        benefit.id,
        payload,
        controller.signal,
      );
      return { gen, data, requestedCode: benefit.id };
    },
    onSuccess: ({ gen, data, requestedCode }) => {
      const gate = shouldAcceptExplainResponse({
        requestGen: gen,
        currentGen: requestGen.current,
        requestedBenefitCode: requestedCode,
        response: data,
      });
      if (!gate.accept) {
        if (gate.benefitMismatch) {
          console.warn('[legal-advisor] benefit_code mismatch', {
            requested: requestedCode,
            received: data.benefit_code,
          });
        }
        return;
      }
      const aligned = isExplainStatusAligned(benefit.engineStatus, data.status);
      setStatusMismatch(!aligned);
      if (!aligned) {
        console.warn('[legal-advisor] status mismatch', {
          benefit: benefit.id,
          engine: benefit.engineStatus,
          explain: data.status,
        });
        setResult(data);
        onExplainResult?.(null);
        return;
      }
      setResult(data);
      onExplainResult?.(data);
    },
    onError: (error) => {
      if (isUserAbortError(error)) return;
    },
  });

  const showError =
    mutation.isError && !mutation.isPending && !isUserAbortError(mutation.error);

  if (mode !== 'rest') {
    return (
      <Card elevated style={styles.wrap}>
        <Text style={styles.title}>Nie wszystko jasne?</Text>
        <Text style={styles.body}>
          Wyjaśnienie wyniku wymaga połączenia z silnikiem świadczeń.
        </Text>
      </Card>
    );
  }

  return (
    <Card
      elevated
      style={
        prominent
          ? { ...styles.wrap, ...styles.wrapProminent }
          : styles.wrap
      }
    >
      <Text style={styles.title}>
        {prominent
          ? 'Nie wszystko jasne? Wyjaśnimy Ci wynik'
          : 'Chcesz jaśniejsze wyjaśnienie?'}
      </Text>
      <Text style={styles.body}>
        To wyjaśnienie nie zmienia oceny uprawnień i nie jest decyzją ZUS.
      </Text>

      {!result && !mutation.isPending && !showError ? (
        <Button
          label={ctaLabel}
          variant={prominent ? 'primary' : 'secondary'}
          onPress={() => mutation.mutate()}
          disabled={mutation.isPending}
          fullWidth
        />
      ) : null}

      {mutation.isPending ? (
        <View style={styles.loading} accessibilityRole="progressbar">
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>{loadingHint}</Text>
          <Text style={styles.meta}>Może to potrwać kilkanaście sekund.</Text>
        </View>
      ) : null}

      {showError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>
            {apiErrorMessage(
              mutation.error,
              'Nie udało się pobrać wyjaśnienia. Spróbuj ponownie.',
            )}
          </Text>
          <Button
            label="Spróbuj ponownie"
            variant="secondary"
            onPress={() => mutation.mutate()}
          />
        </View>
      ) : null}

      {result && !mutation.isPending ? (
        <ExplainCard
          data={result}
          statusMismatch={statusMismatch}
          showLegal={showLegal}
          onToggleLegal={() => setShowLegal((v) => !v)}
          onRetry={() => mutation.mutate()}
        />
      ) : null}
    </Card>
  );
}

function ExplainCard({
  data,
  statusMismatch,
  showLegal,
  onToggleLegal,
  onRetry,
}: {
  data: LegalAdvisorExplainResponse;
  statusMismatch: boolean;
  showLegal: boolean;
  onToggleLegal: () => void;
  onRetry: () => void;
}) {
  const paragraphs = data.explanation
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (statusMismatch) {
    return (
      <View style={styles.result}>
        <View style={styles.warnBox}>
          <Text style={styles.warnText}>
            Wyjaśnienie nie jest spójne ze statusem oceny silnika. Nie traktujemy go jako
            wiążącego — wynik uprawnień pozostaje bez zmian. Odśwież ocenę lub spróbuj
            ponownie.
          </Text>
          <Button label="Ponów wyjaśnienie" variant="secondary" onPress={onRetry} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.result}>
      {data.source === 'ai' ? (
        <Badge label="Wyjaśnienie przygotowane z pomocą AI" tone="demo" />
      ) : null}

      {data.requires_additional_verification ? (
        <View style={styles.warnBox}>
          <Text style={styles.warnText}>
            Część informacji wymaga dodatkowego potwierdzenia. Sprawdź szczegóły w
            oficjalnych źródłach.
          </Text>
        </View>
      ) : null}

      <Text style={styles.section}>Dlaczego otrzymałem taki wynik?</Text>
      {paragraphs.map((p, index) => (
        <Text key={`p-${index}`} style={styles.body}>
          {p}
        </Text>
      ))}

      {data.missing_data_explained.length > 0 ? (
        <>
          <Text style={styles.section}>Jakich informacji brakuje?</Text>
          {data.missing_data_explained.map((item) => (
            <Text key={item} style={styles.bullet}>
              • {item}
            </Text>
          ))}
        </>
      ) : null}

      {data.suggested_next_steps.length > 0 ? (
        <>
          <Text style={styles.section}>Co mogę zrobić teraz?</Text>
          {data.suggested_next_steps.map((step, index) => (
            <Text key={step} style={styles.bullet}>
              {index + 1}. {step}
            </Text>
          ))}
          {data.missing_data_explained.length > 0 ? (
            <Link href={'/onboarding' as Href}>
              <Text style={styles.link}>Uzupełnij dane w ankiecie →</Text>
            </Link>
          ) : null}
        </>
      ) : null}

      {data.other_benefits_to_check.length > 0 ? (
        <>
          <Text style={styles.section}>Jakie inne świadczenia warto sprawdzić?</Text>
          <Text style={styles.meta}>
            To nie oznacza, że Ci przysługują — każde trzeba ocenić osobno.
          </Text>
          <View style={styles.chipRow}>
            {data.other_benefits_to_check.map((code) => (
              <Link key={code} href={`/benefits/${encodeURIComponent(code)}` as Href}>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>
                    {isKnownBenefitCode(code)
                      ? BENEFIT_CODE_LABEL[code]
                      : code}
                  </Text>
                </View>
              </Link>
            ))}
          </View>
        </>
      ) : null}

      {data.verified_legal_basis.length > 0 ? (
        <>
          <Pressable onPress={onToggleLegal} accessibilityRole="button">
            <Text style={styles.link}>
              {showLegal ? 'Ukryj podstawę prawną' : 'Podstawa prawna'} →
            </Text>
          </Pressable>
          {showLegal
            ? data.verified_legal_basis.map((item) => (
                <Text key={item} style={styles.meta}>
                  • {item}
                </Text>
              ))
            : null}
        </>
      ) : null}

      <Button label="Wyjaśnij ponownie" variant="ghost" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  wrapProminent: {
    borderColor: colors.primarySoft,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
  },
  title: { ...typography.h3, color: colors.text },
  section: {
    ...typography.bodyStrong,
    color: colors.text,
    marginTop: spacing.sm,
  },
  body: { ...typography.body, color: colors.textSecondary },
  bullet: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
  },
  meta: { ...typography.small, color: colors.textMuted },
  link: { ...typography.bodyStrong, color: colors.primary },
  loading: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  loadingText: {
    ...typography.bodyStrong,
    color: colors.text,
    textAlign: 'center',
  },
  errorBox: { gap: spacing.sm },
  errorText: { ...typography.body, color: colors.danger },
  result: { gap: spacing.xs },
  warnBox: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  warnText: { ...typography.small, color: colors.warning },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  chipText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
});
