import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { checkApiHealth, getApiMode } from '@/services/api';
import { colors, radii, spacing, typography } from '@/theme';

/** Widoczny status połączenia z FastAPI w trybie REST — bez ukrywania awarii. */
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
          Tryb mock — wyniki świadczeń i kwot są lokalnymi fixture’ami DEMO, nie FastAPI.
        </Text>
      </View>
    );
  }

  if (query.isLoading) {
    return (
      <View style={[styles.banner, styles.pending]} accessibilityRole="text">
        <Text style={styles.text}>Sprawdzam połączenie z silnikiem FastAPI…</Text>
      </View>
    );
  }

  if (query.isError || !query.data?.ok) {
    return (
      <View style={[styles.banner, styles.error]} accessibilityRole="alert">
        <Text style={styles.textStrong}>Brak połączenia z FastAPI</Text>
        <Text style={styles.text}>
          {query.data?.detail ??
            (query.error instanceof Error
              ? query.error.message
              : 'Ocena świadczeń i kalkulator wymagają działającego backendu. Sprawdź ngrok / API i spróbuj ponownie.')}
        </Text>
        <Button
          label="Sprawdź ponownie"
          variant="secondary"
          onPress={() => void query.refetch()}
        />
      </View>
    );
  }

  return (
    <View style={[styles.banner, styles.ok]} accessibilityRole="text">
      <Text style={styles.text}>Połączenie z FastAPI: OK ({query.data.detail})</Text>
    </View>
  );
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
