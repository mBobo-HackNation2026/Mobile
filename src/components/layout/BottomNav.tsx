import { Link, usePathname } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { mainNavItems } from '@/components/layout/navItems';
import { colors, layout, radii, spacing, typography } from '@/theme';

/**
 * Premium Bottom Navigation (Etap 18).
 * Świadczenia = centrum; aktywny stan = miękka pastylka (bez FAB).
 */
export function BottomNav() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrap,
        { paddingBottom: Math.max(insets.bottom, spacing.sm) },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.bar} accessibilityRole="tablist">
        {mainNavItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const isBenefits = item.href === '/benefits';

          return (
            <Link
              key={item.href}
              href={item.href}
              style={styles.item}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
            >
              <View
                style={[
                  styles.pill,
                  active && styles.pillActive,
                  active && isBenefits && styles.pillBenefits,
                ]}
              >
                <Icon
                  size={isBenefits && active ? 21 : 20}
                  color={
                    active
                      ? isBenefits
                        ? colors.primaryHover
                        : colors.primary
                      : colors.textMuted
                  }
                  strokeWidth={active ? 2.35 : 1.9}
                />
                <Text
                  style={[
                    styles.label,
                    active && styles.labelActive,
                    active && isBenefits && styles.labelBenefits,
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </View>
            </Link>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: layout.navMaxWidth,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xxs + 2,
    paddingHorizontal: spacing.xxs,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
      default: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
    }),
  },
  item: {
    flex: 1,
    minHeight: layout.touchMin + 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: spacing.xxs + 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.lg,
    minWidth: 58,
    minHeight: 48,
  },
  pillActive: {
    backgroundColor: colors.primarySoft,
  },
  pillBenefits: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: 'rgba(26, 107, 102, 0.18)',
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 0.1,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  labelBenefits: {
    color: colors.primaryHover,
  },
});
