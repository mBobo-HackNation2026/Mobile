import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/theme';

/** Wspólna sekcja ekranu — wzorzec z kalkulatora Etapu 5. */
export function AppSection({
  step,
  title,
  subtitle,
  children,
}: {
  step?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        {step ? (
          <View style={styles.stepBadge}>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ) : null}
        <View style={styles.titles}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  titles: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  subtitle: {
    ...typography.small,
    color: colors.textMuted,
  },
});
