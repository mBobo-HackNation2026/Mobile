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
      <View style={styles.bar}>
        {mainNavItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={styles.item}
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
            >
              <View style={[styles.itemInner, active && styles.itemInnerActive]}>
                <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                  <Icon
                    size={20}
                    color={active ? colors.primary : colors.textMuted}
                    strokeWidth={active ? 2.4 : 2}
                  />
                </View>
                <Text
                  style={[styles.label, active && styles.labelActive]}
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
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xxs,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
      default: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 16,
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
    minWidth: 64,
  },
  itemInnerActive: {
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
});
