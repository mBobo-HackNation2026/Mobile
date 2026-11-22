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
   * (edge-to-edge chrome — M3 / Android / iOS).
   */
  includeTopInset?: boolean;
  /** 0–1: postęp przewijania treści (pasek pod tytułem). */
  scrollProgress?: number;
}

/**
 * Sticky nagłówek: notch + tytuł + pasek progresu scrolla.
 */
export function AppHeader({
  title,
  // subtitle — opisy w tytule tymczasowo wyłączone
  // subtitle,
  showBack = false,
  backLabel,
  backFallbackHref,
  brandFallback = 'eBobo',
  trailing,
  includeTopInset = true,
  scrollProgress = 0,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const { contentMaxWidth, isCompact } = useAdaptiveLayout();
  const isBrand = !title?.trim();
  const heading = title?.trim() || brandFallback;
  const progress = Math.min(1, Math.max(0, scrollProgress));

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
              <View style={styles.markGlow} />
              <Text style={styles.markLetter}>e</Text>
            </View>
          ) : (
            <View style={styles.pageAccent} accessibilityElementsHidden />
          )}

          <View style={styles.copy}>
            <Text
              style={[styles.title, isBrand && styles.brandTitle]}
              numberOfLines={1}
            >
              {heading}
            </Text>
            {/* Opisy w tytule — tymczasowo wyłączone
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
            */}
          </View>
        </View>
        {trailing}
      </View>

      <View
        style={styles.progressTrack}
        pointerEvents="none"
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: 100,
          now: Math.round(progress * 100),
        }}
      >
        <View
          style={[
            styles.progressFill,
            { width: `${Math.round(progress * 1000) / 10}%` },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: colors.header,
    zIndex: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
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
  pageAccent: {
    width: 3,
    alignSelf: 'stretch',
    minHeight: 28,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    opacity: 0.85,
  },
  mark: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  markGlow: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.highlight,
    opacity: 0.22,
    borderTopRightRadius: radii.full,
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
  // subtitle: {
  //   ...typography.small,
  //   color: colors.textMuted,
  // },
  progressTrack: {
    height: 2,
    width: '100%',
    backgroundColor: colors.primarySoft,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
});
