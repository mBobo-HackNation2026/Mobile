import type { Href } from 'expo-router';
import { ReactNode } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/BackButton';
import { useAdaptiveLayout } from '@/hooks/useAdaptiveLayout';
import { colors, radii, spacing, typography } from '@/theme';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  backLabel?: string;
  backFallbackHref?: Href;
  /** Gdy brak tytułu — pokazujemy markę. */
  brandFallback?: string;
  trailing?: ReactNode;
  /**
   * Domyślnie true: kolor headera wchodzi pod notch / status bar
   * (wzorzec edge-to-edge chrome).
   */
  includeTopInset?: boolean;
}

/**
 * Sticky nagłówek — jedna powierzchnia z obszarem status bar / notch.
 */
export function AppHeader({
  title,
  subtitle,
  showBack = false,
  backLabel,
  backFallbackHref,
  brandFallback = 'eBobo',
  trailing,
  includeTopInset = true,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const { contentMaxWidth, isCompact } = useAdaptiveLayout();
  const isBrand = !title?.trim();
  const heading = title?.trim() || brandFallback;

  return (
    <View
      style={[
        styles.shell,
        includeTopInset && { paddingTop: Math.max(insets.top, spacing.xs) },
      ]}
    >
      <View
        style={[
          styles.inner,
          {
            maxWidth: contentMaxWidth,
            paddingHorizontal: isCompact ? spacing.md : spacing.lg,
          },
        ]}
      >
        <View style={styles.row}>
          {showBack ? (
            <BackButton
              label={backLabel}
              iconOnly
              fallbackHref={backFallbackHref}
            />
          ) : isBrand ? (
            <View style={styles.mark} accessibilityElementsHidden>
              <Text style={styles.markLetter}>e</Text>
            </View>
          ) : null}

          <View style={styles.copy}>
            <Text
              style={[styles.title, isBrand && styles.brandTitle]}
              numberOfLines={1}
            >
              {heading}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        {trailing}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: colors.header,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    zIndex: 20,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.28,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
      default: {},
    }),
  },
  inner: {
    width: '100%',
    alignSelf: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mark: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markLetter: {
    ...typography.bodyStrong,
    color: colors.textInverse,
    fontSize: 17,
    lineHeight: 20,
    fontWeight: '700',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  brandTitle: {
    ...typography.h1,
    color: colors.primaryHover,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...typography.small,
    color: colors.textMuted,
  },
});
