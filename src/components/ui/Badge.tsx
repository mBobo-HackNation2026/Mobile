import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/theme';

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'demo';

interface BadgeProps {
  label: string;
  tone?: Tone;
}

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  return (
    <View style={[styles.base, toneStyles[tone]]} accessibilityLabel={label}>
      <Text style={[styles.label, labelToneStyles[tone]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.sm,
  },
  label: {
    ...typography.caption,
  },
});

const toneStyles = StyleSheet.create({
  neutral: { backgroundColor: colors.surfaceMuted },
  primary: { backgroundColor: colors.primarySoft },
  success: { backgroundColor: colors.accentSoft },
  warning: { backgroundColor: colors.warningSoft },
  danger: { backgroundColor: colors.dangerSoft },
  demo: { backgroundColor: colors.demoSoft },
});

const labelToneStyles = StyleSheet.create({
  neutral: { color: colors.textSecondary },
  primary: { color: colors.primary },
  success: { color: colors.accent },
  warning: { color: colors.warning },
  danger: { color: colors.danger },
  demo: { color: colors.demo },
});
