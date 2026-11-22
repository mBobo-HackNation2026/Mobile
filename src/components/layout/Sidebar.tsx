import { Link, usePathname } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { mainNavItems, secondaryNavItems } from '@/components/layout/navItems';
import { colors, layout, radii, spacing, typography } from '@/theme';

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.sidebar,
        collapsed ? styles.collapsed : styles.expanded,
        {
          paddingTop: Math.max(insets.top, spacing.lg),
          paddingBottom: Math.max(insets.bottom, spacing.lg),
        },
      ]}
    >
      <View style={[styles.brand, collapsed && styles.brandCollapsed]}>
        {!collapsed ? (
          <>
            <Text style={styles.brandTitle}>eBobo</Text>
            <Text style={styles.brandTagline}>Przewodnik świadczeń</Text>
          </>
        ) : (
          <View style={styles.brandMarkWrap}>
            <Text style={styles.brandMark}>eB</Text>
          </View>
        )}
      </View>

      <View style={styles.nav}>
        {!collapsed ? <Text style={styles.sectionLabel}>Menu</Text> : null}
        {mainNavItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={[
                styles.link,
                active && styles.linkActive,
                collapsed && styles.linkCollapsed,
              ]}
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
            >
              <View
                style={[
                  styles.linkInner,
                  collapsed && styles.linkInnerCollapsed,
                ]}
              >
                <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                  <Icon
                    size={20}
                    color={active ? colors.primary : colors.textSecondary}
                    strokeWidth={active ? 2.4 : 2}
                  />
                </View>
                {!collapsed ? (
                  <Text
                    style={[styles.linkLabel, active && styles.linkLabelActive]}
                  >
                    {item.label}
                  </Text>
                ) : null}
                {!collapsed && active ? <View style={styles.activeDot} /> : null}
              </View>
            </Link>
          );
        })}
      </View>

      {!collapsed ? (
        <View style={styles.secondary}>
          <Text style={styles.sectionLabel}>Więcej</Text>
          {secondaryNavItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={[styles.secondaryLink, active && styles.secondaryLinkActive]}
                accessibilityLabel={item.label}
              >
                <Text
                  style={[
                    styles.secondaryLabel,
                    active && styles.secondaryLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Link>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    gap: spacing.lg,
  },
  expanded: {
    width: layout.sidebarWidth,
    paddingHorizontal: spacing.md,
  },
  collapsed: {
    width: layout.sidebarWidthMedium,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  brand: {
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brandCollapsed: {
    alignItems: 'center',
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  brandTitle: {
    ...typography.h2,
    color: colors.primaryHover,
  },
  brandTagline: {
    ...typography.small,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  brandMarkWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMark: {
    ...typography.h3,
    color: colors.primary,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  nav: {
    gap: spacing.xxs,
    flexGrow: 1,
  },
  link: {
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    minHeight: layout.touchMin,
    justifyContent: 'center',
  },
  linkCollapsed: {
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },
  linkActive: {
    backgroundColor: colors.primarySoft,
  },
  linkInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  linkInnerCollapsed: {
    justifyContent: 'center',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  iconWrapActive: {
    backgroundColor: colors.surface,
  },
  linkLabel: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  linkLabelActive: {
    color: colors.primaryHover,
    fontWeight: '700',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
  },
  secondary: {
    gap: spacing.xxs,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  secondaryLink: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
  },
  secondaryLinkActive: {
    backgroundColor: colors.surfaceMuted,
  },
  secondaryLabel: {
    ...typography.small,
    color: colors.textSecondary,
  },
  secondaryLabelActive: {
    color: colors.primaryHover,
    fontWeight: '600',
  },
});
