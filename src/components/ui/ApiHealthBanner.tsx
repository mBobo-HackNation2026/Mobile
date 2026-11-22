import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { checkApiHealth, getApiMode } from '@/services/api';
import { colors, radii, spacing, typography } from '@/theme';

/**
 * Status dostępności usługi FastAPI (health).
 * Osobne od błędów konkretnych operacji (eligibility/calculate) — te mają własne komunikaty i „Spróbuj ponownie”.
 */
export function ApiHealthBanner() {
  const mode = getApiMode();
  const query = useQuery({
    queryKey: ['api-health'],
    queryFn: checkApiHealth,
    enabled: mode === 'rest',
    staleTime: 30_000,
    retry: 1,
  });

  if (mode !== 'rest') {
    return (
      <View style={[styles.banner, styles.mock]} accessibilityRole="text">
        <Text style={styles.text}>
          Tryb demonstracyjny — przykładowe wyniki lokalne. To nie jest ocena z silnika ZUS.
        </Text>
      </View>
    );
  }

  if (query.isLoading) {
    return (
      <View style={[styles.banner, styles.pending]} accessibilityRole="text">
        <Text style={styles.text}>Sprawdzam, czy silnik świadczeń odpowiada…</Text>
      </View>
    );
  }

  if (query.isError || !query.data?.ok) {
    return (
      <View style={[styles.banner, styles.error]} accessibilityRole="alert">
        <Text style={styles.textStrong}>Silnik świadczeń jest teraz niedostępny</Text>
        <Text style={styles.text}>
          Nie możemy teraz ocenić uprawnień ani policzyć kwot. Lokalny plan i nawigacja
          działają — bez przykładowych kwot zamiast wyniku.
        </Text>
        <Button
          label="Spróbuj ponownie"
          variant="secondary"
          onPress={() => void query.refetch()}
        />
      </View>
    );
  }

  /** Stan OK — dyskretny, bez zajmującego banneru (Etap 9 UX). */
  return null;
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  ok: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  pending: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  error: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  mock: {
    backgroundColor: colors.demoSoft,
    borderColor: colors.demo,
  },
  text: {
    ...typography.small,
    color: colors.textSecondary,
  },
  textStrong: {
    ...typography.bodyStrong,
    color: colors.text,
  },
});
