import { StyleSheet, Text, View } from 'react-native';

import { LEGAL_DISCLAIMER_SHORT } from '@/features/calculator/calculatorPresentation';
import { colors, radii, spacing, typography } from '@/theme';

type Variant = 'default' | 'compact' | 'verification';

const COPY: Record<Variant, string> = {
  default: LEGAL_DISCLAIMER_SHORT,
  compact: LEGAL_DISCLAIMER_SHORT,
  verification:
    'Ten wynik wymaga indywidualnej weryfikacji. eBobo jest projektem demonstracyjnym Hackathon 2026 — nie oficjalną aplikacją ZUS. Informacje nie stanowią decyzji o przyznaniu świadczenia.',
};

/** Dyskretny disclaimer prawny — bez modalu. */
export function LegalDisclaimer({
  variant = 'default',
}: {
  variant?: Variant;
}) {
  return (
    <View
      style={[styles.wrap, variant === 'verification' && styles.verification]}
      accessibilityRole="text"
    >
      <Text style={styles.text}>{COPY[variant]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  verification: {
    borderColor: colors.warning,
    backgroundColor: colors.warningSoft,
  },
  text: {
    ...typography.small,
    color: colors.textMuted,
  },
});
