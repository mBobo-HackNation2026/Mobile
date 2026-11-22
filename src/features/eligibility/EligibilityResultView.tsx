import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  eligibilityBadgeLabel,
  eligibilityHeadline,
  getEligibilityPresentation,
  type EligibilityPresentationMode,
} from '@/features/eligibility/eligibilityUi';
import { planDurationLabel } from '@/features/eligibility/planDuration';
import {
  isCautiousEligibilityResult,
  type EligibilityCheckResult,
  type MaternityLeaveEligibilityRequest,
} from '@/services/api/eligibilityCheckSchemas';
import { colors, spacing, typography } from '@/theme';

interface EligibilityResultViewProps {
  result: EligibilityCheckResult;
  pregnancyNote?: boolean;
  onRetry?: () => void;
  onFillMissing?: () => void;
  onCheckRelated?: (benefitCode: string) => void;
  checkingRelatedCode?: string | null;
  /** Poprzedni wynik — pozwala wrócić po przejściu do powiązanego świadczenia. */
  onBackToPrevious?: () => void;
  requestSnapshot?: MaternityLeaveEligibilityRequest | null;
}

export function EligibilityResultView({
  result,
  pregnancyNote = false,
  onRetry,
  onFillMissing,
  onCheckRelated,
  checkingRelatedCode,
  onBackToPrevious,
}: EligibilityResultViewProps) {
  const mode = getEligibilityPresentation(result);
  const tone = badgeTone(mode);
  const cautious = isCautiousEligibilityResult(result);
  const relatedSolutions = result.possible_solutions.filter(
    (s) => s.related_benefit_code?.trim(),
  );

  return (
    <View style={styles.wrap}>
      {onBackToPrevious ? (
        <Button label="← Wróć do poprzedniej oceny" variant="ghost" onPress={onBackToPrevious} />
      ) : null}

      {result.warnings.length > 0 ? (
        <Card style={styles.warningCard}>
          <Badge label="Ostrzeżenia z API" tone="warning" />
          <Text style={styles.section}>Przeczytaj przed decyzją</Text>
          <Text style={styles.body}>
            Treści z backendu — nie sterują logiką frontendu i nie oznaczają automatycznie braku
            prawa do świadczenia.
          </Text>
          {result.warnings.map((warning) => (
            <Text key={warning} style={styles.warning}>
              • {warning}
            </Text>
          ))}
        </Card>
      ) : null}

      {cautious ? (
        <Card style={styles.warningCard}>
          <Badge label="Ocena uproszczona" tone="warning" />
          <Text style={styles.headline}>
            To wstępna możliwość — nie potwierdzone prawo do świadczenia
          </Text>
          <Text style={styles.body}>
            Silnik nie weryfikuje obecnie wszystkich przesłanek (np. art. 30: ustanie
            ubezpieczenia w ciąży / brak innego zatrudnienia). Sprawdź ostrzeżenia i potwierdź
            warunki w ZUS.
          </Text>
        </Card>
      ) : null}

      <Card>
        <View style={styles.row}>
          <Badge
            label={
              cautious && mode === 'likely_eligible'
                ? 'Wstępna możliwość — wymaga weryfikacji'
                : eligibilityBadgeLabel(mode)
            }
            tone={cautious ? 'warning' : tone}
          />
          <Badge label={`Reguły v${result.rules_version}`} tone="neutral" />
          <Badge label={result.data_source} tone="demo" />
        </View>
        <Text style={styles.title}>{result.benefit_name}</Text>
        <Text style={styles.meta}>Kod: {result.benefit_code}</Text>
        <Text style={styles.headline}>
          {cautious
            ? 'Na podstawie uproszczonej oceny API możesz mieć ścieżkę do sprawdzenia.'
            : eligibilityHeadline(mode)}
        </Text>
        {pregnancyNote ? (
          <Text style={styles.warning}>
            Jesteś na etapie ciąży — ubezpieczenie w dniu porodu nie jest jeszcze historycznie
            potwierdzonym faktem. Traktuj wynik jako wstępny scenariusz.
          </Text>
        ) : null}
        <Text style={styles.next}>
          Następny krok:{' '}
          {mode === 'conditional_plan'
            ? 'Uzupełnij brakujące informacje'
            : relatedSolutions.length > 0
              ? 'Sprawdź możliwe inne świadczenie'
              : mode === 'likely_eligible' && !cautious
                ? 'Przygotuj dokumenty i zobacz plan'
                : 'Zweryfikuj dane lub skontaktuj się z ZUS'}
        </Text>
        {mode === 'conditional_plan' && onFillMissing ? (
          <Button label="Uzupełnij informacje" onPress={onFillMissing} />
        ) : null}
        {mode === 'unknown' && onRetry ? (
          <Button label="Ponów weryfikację" variant="secondary" onPress={onRetry} />
        ) : null}
      </Card>

      {result.met_conditions.length > 0 ? (
        <Card>
          <Text style={styles.section}>Spełnione warunki</Text>
          {result.met_conditions.map((item) => (
            <Text key={item} style={styles.bullet}>
              • {item}
            </Text>
          ))}
        </Card>
      ) : null}

      {result.unmet_conditions.length > 0 ? (
        <Card>
          <Text style={styles.section}>Niespełnione warunki</Text>
          {result.unmet_conditions.map((item) => (
            <Text key={item} style={styles.bullet}>
              • {item}
            </Text>
          ))}
        </Card>
      ) : null}

      {result.missing_data.length > 0 ? (
        <Card>
          <Text style={styles.section}>Brakujące informacje</Text>
          {result.missing_data.map((item) => (
            <Text key={item} style={styles.bullet}>
              • {item}
            </Text>
          ))}
          {onFillMissing ? (
            <Button
              label="Uzupełnij informacje"
              variant="secondary"
              onPress={onFillMissing}
            />
          ) : null}
        </Card>
      ) : null}

      {relatedSolutions.length > 0 ? (
        <Card>
          <Badge label="Powiązane świadczenie" tone="primary" />
          <Text style={styles.section}>Możliwe inne świadczenie</Text>
          <Text style={styles.body}>
            Powiązanie z backendu nie gwarantuje uzyskania świadczenia — to osobna ocena.
          </Text>
          {relatedSolutions.map((solution, index) => {
            const code = solution.related_benefit_code!.trim();
            return (
              <View key={`${code}-${index}`} style={styles.solution}>
                <Text style={styles.body}>{solution.description}</Text>
                {solution.legal_basis ? (
                  <Text style={styles.meta}>Podstawa: {solution.legal_basis}</Text>
                ) : null}
                <Text style={styles.meta}>Kod: {code}</Text>
                {onCheckRelated ? (
                  <Button
                    label={
                      checkingRelatedCode === code
                        ? 'Sprawdzam…'
                        : 'Sprawdź moje uprawnienia'
                    }
                    onPress={() => onCheckRelated(code)}
                    disabled={Boolean(checkingRelatedCode)}
                  />
                ) : null}
              </View>
            );
          })}
        </Card>
      ) : null}

      {result.possible_solutions.filter((s) => !s.related_benefit_code?.trim()).length >
      0 ? (
        <Card>
          <Text style={styles.section}>Możliwe ścieżki / rozwiązania</Text>
          <Text style={styles.body}>
            Pochodzą z silnika reguł backendu — nie są gwarancją świadczenia.
          </Text>
          {result.possible_solutions
            .filter((s) => !s.related_benefit_code?.trim())
            .map((solution, index) => (
              <View key={`${solution.type}-${index}`} style={styles.solution}>
                <Badge label={solution.type} tone="warning" />
                <Text style={styles.body}>{solution.description}</Text>
                {solution.legal_basis ? (
                  <Text style={styles.meta}>Podstawa: {solution.legal_basis}</Text>
                ) : null}
              </View>
            ))}
        </Card>
      ) : null}

      {result.plan ? (
        <Card>
          <View style={styles.row}>
            <Text style={styles.section}>
              {mode === 'conditional_plan' ? 'Wariant warunkowy planu' : 'Plan działania'}
            </Text>
            {mode === 'conditional_plan' ? (
              <Badge label="Warunkowy" tone="warning" />
            ) : (
              <Badge label="Na podstawie danych" tone="success" />
            )}
          </View>
          <Text style={mode === 'conditional_plan' || cautious ? styles.warning : styles.body}>
            Okres: {planDurationLabel(result.plan)} · Stawka: {result.plan.rate_percentage}%
            podstawy wymiaru (nie jest to kwota wypłaty w złotych)
            {cautious ? ' — wstępny scenariusz, wymaga potwierdzenia.' : '.'}
          </Text>
          <Text style={styles.meta}>Instytucja (tekst z API): {result.plan.institution}</Text>

          {result.plan.required_documents.length > 0 ? (
            <>
              <Text style={styles.subSection}>Wymagane dokumenty (z API)</Text>
              {result.plan.required_documents.map((doc) => (
                <View key={doc.code} style={styles.doc}>
                  <Text style={styles.bodyStrong}>{doc.name}</Text>
                  <Text style={styles.meta}>
                    Kod: {doc.code} · {doc.when}
                  </Text>
                </View>
              ))}
            </>
          ) : null}

          {result.plan.deadlines.length > 0 ? (
            <>
              <Text style={styles.subSection}>Terminy (opisy z API)</Text>
              {result.plan.deadlines.map((deadline) => (
                <Text key={deadline} style={styles.bullet}>
                  • {deadline}
                </Text>
              ))}
            </>
          ) : null}

          {result.plan.legal_basis.length > 0 ? (
            <>
              <Text style={styles.subSection}>Podstawy prawne planu</Text>
              {result.plan.legal_basis.map((basis) => (
                <Text key={basis} style={styles.meta}>
                  • {basis}
                </Text>
              ))}
            </>
          ) : null}
        </Card>
      ) : (
        <Card>
          <Text style={styles.section}>Plan działania</Text>
          <Text style={styles.body}>
            Backend nie zwrócił standardowego planu dla tej oceny (`plan: null`).
          </Text>
        </Card>
      )}

      <Card>
        <Text style={styles.meta}>
          Wersja reguł: {result.rules_version}. Źródło danych: {result.data_source}. To nie jest
          decyzja ZUS.
        </Text>
        <Button
          label="Moje świadczenia (hub)"
          variant="secondary"
          onPress={() => router.push('/benefits')}
        />
      </Card>
    </View>
  );
}

function badgeTone(
  mode: EligibilityPresentationMode,
): 'success' | 'warning' | 'danger' | 'neutral' | 'primary' {
  switch (mode) {
    case 'likely_eligible':
      return 'success';
    case 'conditional_plan':
      return 'warning';
    case 'alternative_path':
      return 'primary';
    case 'not_eligible':
      return 'neutral';
    case 'unknown':
      return 'danger';
  }
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  warningCard: {
    borderColor: colors.warning,
    backgroundColor: colors.warningSoft,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  title: { ...typography.h2, color: colors.text },
  headline: { ...typography.bodyStrong, color: colors.text, marginVertical: spacing.sm },
  next: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  section: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  subSection: {
    ...typography.bodyStrong,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  body: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs },
  bodyStrong: { ...typography.bodyStrong, color: colors.text },
  bullet: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xxs },
  meta: { ...typography.small, color: colors.textMuted, marginBottom: spacing.xs },
  warning: { ...typography.small, color: colors.warning, marginBottom: spacing.xs },
  solution: { gap: spacing.xs, marginBottom: spacing.md },
  doc: { marginBottom: spacing.sm },
});
