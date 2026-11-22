import { router } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAdaptiveLayout } from '@/hooks/useAdaptiveLayout';
import { resolvePostEntryHref } from '@/lib/appHome';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserJourneyStore } from '@/store/useUserJourneyStore';
import { colors, radii, spacing, typography } from '@/theme';

/**
 * Widok po udanym mObywatel DEMO — pokazuje mockowany profil, nie tożsamość urzędową.
 */
export function AuthConnectedScreen() {
  const { isExpanded } = useAdaptiveLayout();
  const profile = useAuthStore((s) => s.profile);
  const status = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.userId);
  const onboardingCompleted = useUserJourneyStore(
    (s) => s.profile.onboardingCompleted,
  );
  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    'Profil demonstracyjny';

  const continueNext = () => {
    router.replace(resolvePostEntryHref(onboardingCompleted));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.root}>
          <View style={[styles.atmosphere, isExpanded && styles.atmosphereWide]} />
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <Badge label="mObywatel — tylko DEMO" tone="demo" />
              <Text style={styles.brand}>eBobo</Text>
              <Text style={styles.headline}>Połączono demonstracyjnie</Text>
              <Text style={styles.lead}>
                Backend zaktualizował sesję do statusu authenticated. To mockowany profil —
                nie potwierdza prawdziwej tożsamości urzędowej.
              </Text>

              <View style={styles.panel}>
                <Text style={styles.panelTitle}>{displayName}</Text>
                <Row label="Status" value={status ?? '—'} />
                <Row label="User ID" value={maskId(userId)} />
                <Row label="PESEL (mock)" value={maskPesel(profile?.pesel)} />
                <Badge label="Dane mockowane z /auth/me" tone="demo" />
              </View>

              <Button label="Kontynuuj" onPress={continueNext} fullWidth />
              <Button
                label="Wróć do logowania"
                variant="ghost"
                onPress={() => router.replace('/')}
                fullWidth
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kv}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function maskId(id: string | null): string {
  if (!id) return '—';
  if (id.length <= 10) return id;
  return `${id.slice(0, 8)}…`;
}

function maskPesel(pesel: string | null | undefined): string {
  if (!pesel) return '—';
  if (pesel.length < 5) return '••••';
  return `${pesel.slice(0, 2)}••••••${pesel.slice(-2)}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundWarm },
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: colors.backgroundWarm },
  atmosphere: {
    position: 'absolute',
    top: -80,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 280,
    backgroundColor: colors.accentSoft,
    opacity: 0.9,
  },
  atmosphereWide: { width: 420, height: 420, left: -40 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    gap: spacing.md,
  },
  brand: { ...typography.display, color: colors.primaryHover },
  headline: { ...typography.h1, color: colors.text },
  lead: { ...typography.body, color: colors.textSecondary },
  panel: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  panelTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.xs },
  kv: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  label: { ...typography.small, color: colors.textMuted },
  value: {
    ...typography.bodyStrong,
    color: colors.text,
    flexShrink: 1,
    textAlign: 'right',
  },
});
