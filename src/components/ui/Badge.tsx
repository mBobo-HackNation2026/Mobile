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
    paddingVertical: spacing.xxs + 1,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  label: {
    ...typography.caption,
  },
});

const toneStyles = StyleSheet.create({
  neutral: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  primary: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primarySoft,
  },
  success: {
    backgroundColor: colors.successSoft,
    borderColor: colors.successSoft,
  },
  warning: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warningSoft,
  },
  danger: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.dangerSoft,
  },
  demo: {
    backgroundColor: colors.demoSoft,
    borderColor: colors.demoSoft,
  },
});

const labelToneStyles = StyleSheet.create({
  neutral: { color: colors.textSecondary },
  primary: { color: colors.primaryHover },
  success: { color: colors.success },
  warning: { color: colors.warning },
  danger: { color: colors.danger },
  demo: { color: colors.demo },
});
