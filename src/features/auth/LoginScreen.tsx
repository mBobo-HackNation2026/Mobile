import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
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
import { apiErrorMessage } from '@/lib/apiErrorMessage';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserJourneyStore } from '@/store/useUserJourneyStore';
import { colors, radii, spacing, typography } from '@/theme';

function continueAfterAuth() {
  router.replace('/home');
}

/**
 * Wejście do aplikacji — gość (sesja anonimowa) lub mObywatel DEMO (brief v3).
 */
export function LoginScreen() {
  const { isExpanded } = useAdaptiveLayout();
  const queryClient = useQueryClient();
  const onboardingCompleted = useUserJourneyStore((s) => s.profile.onboardingCompleted);
  const phase = useAuthStore((s) => s.phase);
  const status = useAuthStore((s) => s.status);
  const bootstrapError = useAuthStore((s) => s.bootstrapError);
  const sessionExpiredNotice = useAuthStore((s) => s.sessionExpiredNotice);
  const isLoggingIn = useAuthStore((s) => s.isLoggingIn);
  const isEnteringAsGuest = useAuthStore((s) => s.isEnteringAsGuest);
  const enterAsGuest = useAuthStore((s) => s.enterAsGuest);
  const loginMobywatel = useAuthStore((s) => s.loginMobywatel);
  const startNewAnonymousSession = useAuthStore((s) => s.startNewAnonymousSession);
  const clearSessionExpiredNotice = useAuthStore((s) => s.clearSessionExpiredNotice);

  const [actionError, setActionError] = useState<string | null>(null);
  const busy = isLoggingIn || isEnteringAsGuest || phase === 'bootstrapping';

  const onGuest = async () => {
    setActionError(null);
    try {
      await enterAsGuest();
      await queryClient.invalidateQueries();
      continueAfterAuth();
    } catch (error) {
      setActionError(apiErrorMessage(error, 'Nie udało się wejść jako gość.'));
      // i tak wpuszczamy — silnik działa bez sesji
      continueAfterAuth();
    }
  };

  const onMobywatel = async () => {
    setActionError(null);
    try {
      await loginMobywatel();
      await queryClient.invalidateQueries();
      router.replace('/auth/connected');
    } catch (error) {
      setActionError(
        apiErrorMessage(
          error,
          'Logowanie DEMO nieudane. Możesz kontynuować jako gość — ankieta działa bez konta.',
        ),
      );
    }
  };

  const onRenewSession = async () => {
    setActionError(null);
    clearSessionExpiredNotice();
    try {
      await startNewAnonymousSession();
    } catch (error) {
      setActionError(apiErrorMessage(error, 'Nie utworzono nowej sesji anonimowej.'));
    }
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
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.content, isExpanded && styles.contentWide]}>
              <View style={styles.brandBlock}>
                <Badge label="HackNation 2026 · Demo" tone="demo" />
                <Text style={styles.brand}>eBobo</Text>
                <Text style={styles.headline}>Zaloguj się, żeby kontynuować</Text>
                <Text style={styles.lead}>
                  Wejdź jako gość (sesja anonimowa) albo połącz demonstracyjnie przez mObywatel.
                  To nie jest prawdziwe logowanie urzędowe.
                </Text>
              </View>

              {phase === 'bootstrapping' ? (
                <View style={styles.panel}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.note}>Przygotowuję sesję…</Text>
                </View>
              ) : null}

              {sessionExpiredNotice ? (
                <View style={[styles.panel, styles.warningPanel]}>
                  <Badge label="Sesja wygasła" tone="warning" />
                  <Text style={styles.body}>{sessionExpiredNotice}</Text>
                  <Button
                    label="Nowa sesja anonimowa"
                    variant="secondary"
                    onPress={() => void onRenewSession()}
                    disabled={busy}
                    fullWidth
                  />
                </View>
              ) : null}

              <View style={styles.panel}>
                <Text style={styles.panelTitle}>Wejście do aplikacji</Text>

                {status ? (
                  <Text style={styles.meta}>
                    Aktualna sesja API:{' '}
                    {status === 'authenticated' ? 'mObywatel DEMO' : 'anonimowa'}
                  </Text>
                ) : null}

                <Button
                  label={isEnteringAsGuest ? 'Wchodzę jako gość…' : 'Kontynuuj jako gość'}
                  onPress={() => void onGuest()}
                  disabled={busy}
                  fullWidth
                />

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>lub</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Button
                  label={
                    isLoggingIn ? 'Logowanie DEMO…' : 'Połącz przez mObywatel — DEMO'
                  }
                  variant="secondary"
                  onPress={() => void onMobywatel()}
                  disabled={busy}
                  fullWidth
                  accessibilityHint="Symulowane logowanie FastAPI — nie łączy z prawdziwym mObywatel"
                />

                {actionError ? <Text style={styles.warning}>{actionError}</Text> : null}
                {bootstrapError ? (
                  <Text style={styles.meta}>
                    Uwaga sesji: {bootstrapError}. Możesz iść dalej jako gość.
                  </Text>
                ) : null}

                <Text style={styles.note}>
                  Ankieta i ocena uprawnień działają także bez sesji. Awaria API nie blokuje
                  wejścia gościa.
                </Text>
              </View>

              {onboardingCompleted ? (
                <Text style={styles.resume}>
                  Masz lokalny szkic ankiety — po wejściu wrócisz do Moich świadczeń.
                </Text>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.backgroundWarm,
  },
  flex: {
    flex: 1,
  },
  root: {
    flex: 1,
    backgroundColor: colors.backgroundWarm,
  },
  atmosphere: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 320,
    height: 320,
    borderRadius: 320,
    backgroundColor: colors.primarySoft,
    opacity: 0.85,
  },
  atmosphereWide: {
    width: 520,
    height: 520,
    right: -40,
    top: -120,
  },
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
    gap: spacing.lg,
  },
  contentWide: {
    maxWidth: 520,
  },
  brandBlock: {
    gap: spacing.md,
  },
  brand: {
    ...typography.display,
    color: colors.primaryHover,
  },
  headline: {
    ...typography.h1,
    color: colors.text,
  },
  lead: {
    ...typography.body,
    color: colors.textSecondary,
  },
  panel: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  warningPanel: {
    borderColor: colors.warning,
    backgroundColor: colors.warningSoft,
  },
  panelTitle: {
    ...typography.h3,
    color: colors.text,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  note: {
    ...typography.small,
    color: colors.textMuted,
  },
  meta: {
    ...typography.small,
    color: colors.textMuted,
  },
  warning: {
    ...typography.small,
    color: colors.warning,
  },
  resume: {
    ...typography.small,
    color: colors.textSecondary,
  },
});
