import { type Href, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/theme';

export type QuickAction = {
  label: string;
  href: Href;
  hint?: string;
};

/** Rząd szybkich przejść — spójny z dashboardem i sprawami. */
export function QuickActionRow({ actions }: { actions: QuickAction[] }) {
  return (
    <View style={styles.row}>
      {actions.map((action) => (
        <Pressable
          key={String(action.href)}
          onPress={() => router.push(action.href)}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
        >
          <Text style={styles.label}>{action.label}</Text>
          {action.hint ? <Text style={styles.hint}>{action.hint}</Text> : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexGrow: 1,
    flexBasis: 140,
    minHeight: 64,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 2,
  },
  pressed: {
    opacity: 0.9,
    backgroundColor: colors.primarySoft,
  },
  label: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
