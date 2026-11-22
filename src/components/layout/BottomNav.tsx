import { Link, usePathname } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { mainNavItems } from '@/components/layout/navItems';
import { colors, radii, spacing, typography } from '@/theme';

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
                  styles.itemInner,
                  active && styles.itemInnerActive,
                  active && isBenefits && styles.itemInnerBenefits,
                ]}
              >
                <View
                  style={[
                    styles.iconWrap,
                    active && styles.iconWrapActive,
                    active && isBenefits && styles.iconWrapBenefits,
                  ]}
                >
                  <Icon
                    size={20}
                    color={
                      active
                        ? isBenefits
                          ? colors.textInverse
                          : colors.primary
                        : colors.textMuted
                    }
                    strokeWidth={active ? 2.4 : 2}
                  />
                </View>
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
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 520,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xxs,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
      default: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
    }),
  },
  item: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.lg,
    minWidth: 56,
    minHeight: 48,
  },
  itemInnerActive: {
    backgroundColor: colors.primarySoft,
  },
  itemInnerBenefits: {
    backgroundColor: colors.primarySoft,
  },
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
  },
  iconWrapActive: {
    backgroundColor: colors.surface,
  },
  iconWrapBenefits: {
    backgroundColor: colors.primary,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 0.1,
  },
  labelActive: {
    color: colors.primaryHover,
    fontWeight: '700',
  },
  labelBenefits: {
    color: colors.primaryHover,
  },
});
