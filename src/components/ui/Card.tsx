import { ReactNode } from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, radii, spacing } from '@/theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  padded?: boolean;
  /** Subtelne uniesienie — oszczędnie, nie pod każdą kartą. */
  elevated?: boolean;
}

export function Card({
  children,
  style,
  padded = true,
  elevated = false,
}: CardProps) {
  return (
    <View
      style={[
        styles.card,
        elevated && styles.elevated,
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  elevated: {
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
      default: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
    }),
  },
  padded: {
    padding: spacing.mdPlus,
  },
});
