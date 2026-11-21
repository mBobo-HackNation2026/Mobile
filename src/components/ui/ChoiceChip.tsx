import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, layout, radii, spacing, typography } from '@/theme';

interface ChoiceChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  description?: string;
}

export function ChoiceChip({ label, selected = false, onPress, description }: ChoiceChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
      {description ? (
        <Text style={[styles.description, selected && styles.descriptionSelected]}>
          {description}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.touchMin,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xxs,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  pressed: {
    opacity: 0.92,
  },
  label: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  labelSelected: {
    color: colors.primaryHover,
  },
  description: {
    ...typography.small,
    color: colors.textSecondary,
  },
  descriptionSelected: {
    color: colors.primaryHover,
  },
});
