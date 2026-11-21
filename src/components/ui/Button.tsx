import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors, layout, radii, spacing, typography } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityHint?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  fullWidth = false,
  accessibilityHint,
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.label, labelStyles[variant]]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.touchMin,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fullWidth: {
    alignSelf: 'stretch',
    width: '100%',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ translateY: 1 }],
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    ...typography.button,
  },
});

const variantStyles = StyleSheet.create<Record<Variant, ViewStyle>>({
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
});

const labelStyles = StyleSheet.create({
  primary: { color: colors.textInverse },
  secondary: { color: colors.text },
  ghost: { color: colors.primary },
  danger: { color: colors.danger },
});
