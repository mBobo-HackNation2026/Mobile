import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/theme';

interface DemoBannerProps {
  message?: string;
}

export function DemoBanner({
  message = 'Dane przykładowe — bez połączenia z kontem ZUS.',
}: DemoBannerProps) {
  return (
    <View style={styles.banner} accessibilityLabel={message}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.demoSoft,
    borderColor: colors.demo,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: {
    ...typography.small,
    color: colors.demo,
  },
});
