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
import type { EligibilityCheckResult } from '@/services/api/eligibilityCheckSchemas';
import { colors, spacing, typography } from '@/theme';

interface EligibilityResultViewProps {
  result: EligibilityCheckResult;
  pregnancyNote?: boolean;
  onRetry?: () => void;
  onFillMissing?: () => void;
}

export function EligibilityResultView({
  result,
  pregnancyNote = false,
  onRetry,
  onFillMissing,
}: EligibilityResultViewProps) {
  const mode = getEligibilityPresentation(result);
  const tone = badgeTone(mode);

  return (
    <View style={styles.wrap}>
      <Card>
        <View style={styles.row}>
          <Badge label={eligibilityBadgeLabel(mode)} tone={tone} />
          <Badge label={`Reguły v${result.rules_version}`} tone="neutral" />
          <Badge label={result.data_source} tone="demo" />
        </View>
        <Text style={styles.title}>{result.benefit_name}</Text>
        <Text style={styles.meta}>Kod: {result.benefit_code}</Text>
        <Text style={styles.headline}>{eligibilityHeadline(mode)}</Text>
        {pregnancyNote ? (
          <Text style={styles.warning}>
            Jesteś na etapie ciąży — ubezpieczenie w dniu porodu nie jest jeszcze
            historycznie potwierdzonym faktem. Traktuj wynik jako wstępny scenariusz.
          </Text>
        ) : null}
        <Text style={styles.next}>
          Następny krok:{' '}
          {mode === 'conditional_plan'
            ? 'Uzupełnij brakujące informacje'
            : mode === 'alternative_path'
              ? 'Sprawdź możliwe rozwiązania i potwierdź warunki'
              : mode === 'likely_eligible'
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

      {result.possible_solutions.length > 0 ? (
        <Card>
          <Text style={styles.section}>Możliwe ścieżki / rozwiązania</Text>
          <Text style={styles.body}>
            Pochodzą z silnika reguł backendu — nie są gwarancją świadczenia.
          </Text>
          {result.possible_solutions.map((solution, index) => (
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
          {mode === 'conditional_plan' ? (
            <Text style={styles.warning}>
              To potencjalny scenariusz (np. {result.plan.weeks} tygodni,{' '}
              {result.plan.rate_percentage}% podstawy) — nie potwierdzone uprawnienie i nie
              kwota w PLN.
            </Text>
          ) : (
            <Text style={styles.body}>
              Okres: {result.plan.weeks} tygodni · Stawka: {result.plan.rate_percentage}%
              podstawy wymiaru (nie jest to kwota wypłaty w złotych).
            </Text>
          )}
          <Text style={styles.meta}>Instytucja (tekst z API): {result.plan.institution}</Text>

          {result.plan.required_documents.length > 0 ? (
            <>
              <Text style={styles.subSection}>
                {mode === 'conditional_plan'
                  ? 'Dokumenty w wariancie warunkowym (nie checklista obowiązków)'
                  : 'Wymagane dokumenty (z API)'}
              </Text>
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
            Backend nie zwrócił standardowego planu urlopu macierzyńskiego dla tej oceny
            (`plan: null`).
          </Text>
        </Card>
      )}

      {result.warnings.length > 0 ? (
        <Card>
          <Text style={styles.section}>Ostrzeżenia</Text>
          <Text style={styles.body}>
            Treści informacyjne z API — nie sterują logiką i nie oznaczają automatycznie braku
            prawa do świadczenia.
          </Text>
          {result.warnings.map((warning) => (
            <Text key={warning} style={styles.warning}>
              • {warning}
            </Text>
          ))}
        </Card>
      ) : null}

      <Card>
        <Text style={styles.meta}>
          Wersja reguł: {result.rules_version}. Źródło danych: {result.data_source}. To nie jest
          decyzja ZUS.
        </Text>
        <Button
          label="Moje świadczenia (hub / mocki)"
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
