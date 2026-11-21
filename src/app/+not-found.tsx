import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Nie znaleziono' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Tej strony nie ma</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Wróć na początek</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  link: {
    padding: spacing.sm,
  },
  linkText: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
});
