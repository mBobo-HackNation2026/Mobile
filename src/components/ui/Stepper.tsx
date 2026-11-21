import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/theme';

interface StepperProps {
  current: number;
  total: number;
  label?: string;
}

export function Stepper({ current, total, label }: StepperProps) {
  const progress = Math.min(current / total, 1);

  return (
    <View style={styles.wrap} accessibilityRole="progressbar">
      <View style={styles.row}>
        <Text style={styles.label}>
          {label ?? `Krok ${current} z ${total}`}
        </Text>
        <Text style={styles.pct}>{Math.round(progress * 100)}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...typography.small,
    color: colors.textSecondary,
  },
  pct: {
    ...typography.caption,
    color: colors.textMuted,
  },
  track: {
    height: 8,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radii.full,
  },
});
