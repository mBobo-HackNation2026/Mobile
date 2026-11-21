import { router, type Href } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radii, spacing, typography } from '@/theme';

interface BackButtonProps {
  label?: string;
  /** Gdy jest tytuł ekranu — sam chevron, etykieta tylko dla a11y. */
  iconOnly?: boolean;
  /** Gdy nie ma historii — np. wejście z deep linka. */
  fallbackHref?: Href;
}

export function BackButton({
  label = 'Wróć',
  iconOnly = false,
  fallbackHref = '/home',
}: BackButtonProps) {
  const onPress = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(fallbackHref);
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [
        styles.button,
        iconOnly && styles.buttonIcon,
        pressed && styles.pressed,
      ]}
    >
      <ChevronLeft size={20} color={colors.primaryHover} strokeWidth={2.2} />
      {iconOnly ? null : <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 40,
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
    marginLeft: -spacing.xs,
    borderRadius: radii.sm,
  },
  buttonIcon: {
    width: 36,
    height: 36,
    minHeight: 36,
    marginLeft: 0,
    paddingVertical: 0,
    paddingRight: 0,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
  label: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
});
