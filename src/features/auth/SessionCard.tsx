import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { apiErrorMessage } from '@/lib/apiErrorMessage';
import { useAuthStore } from '@/store/useAuthStore';
import { colors, spacing, typography } from '@/theme';

/** Sesja anonimowa / mObywatel DEMO — nie jest prawdziwym logowaniem urzędowym. */
export function SessionCard() {
  const queryClient = useQueryClient();
  const phase = useAuthStore((s) => s.phase);
  const status = useAuthStore((s) => s.status);
  const profile = useAuthStore((s) => s.profile);
  const userId = useAuthStore((s) => s.userId);
  const isLoggingIn = useAuthStore((s) => s.isLoggingIn);
  const bootstrapError = useAuthStore((s) => s.bootstrapError);
  const sessionExpiredNotice = useAuthStore((s) => s.sessionExpiredNotice);
  const loginMobywatel = useAuthStore((s) => s.loginMobywatel);
  const startNewAnonymousSession = useAuthStore((s) => s.startNewAnonymousSession);
  const clearSessionExpiredNotice = useAuthStore((s) => s.clearSessionExpiredNotice);
  const [loginError, setLoginError] = useState<string | null>(null);

  const onLogin = async () => {
    setLoginError(null);
    try {
      await loginMobywatel();
      await queryClient.invalidateQueries();
    } catch (error) {
      setLoginError(apiErrorMessage(error, 'Nie udało się wykonać logowania DEMO.'));
    }
  };

  return (
    <Card>
      <View style={styles.row}>
        <Badge label="Sesja API" tone="primary" />
        <Badge
          label={
            status === 'authenticated'
              ? 'mObywatel DEMO'
              : status === 'anonymous'
                ? 'Anonimowa'
                : phase === 'bootstrapping'
                  ? 'Inicjalizacja…'
                  : 'Brak sesji'
          }
          tone={status === 'authenticated' ? 'demo' : 'neutral'}
        />
      </View>

      <Text style={styles.title}>Konto demonstracyjne</Text>
      <Text style={styles.body}>
        To symulacja sesji eBobo — nie jest potwierdzeniem tożsamości urzędowej ani połączeniem
        z prawdziwym mObywatel.
      </Text>

      {sessionExpiredNotice ? (
        <Text style={styles.warning}>{sessionExpiredNotice}</Text>
      ) : null}
      {bootstrapError ? (
        <Text style={styles.meta}>
          Sesja opcjonalna: {bootstrapError}. Ankieta i ocena uprawnień działają bez niej.
        </Text>
      ) : null}
      {loginError ? <Text style={styles.warning}>{loginError}</Text> : null}

      {profile || userId ? (
        <View style={styles.block}>
          <Row label="Status" value={status ?? '—'} />
          <Row label="User ID" value={maskId(userId)} />
          {status === 'authenticated' ? (
            <>
              <Row
                label="Imię i nazwisko"
                value={
                  [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
                  '—'
                }
              />
              <Row label="PESEL (mock)" value={maskPesel(profile?.pesel)} />
              <Badge label="Dane mockowane" tone="demo" />
            </>
          ) : (
            <Text style={styles.meta}>
              Profil anonimowy — dane osobowe nie są wymagane do ankiety i silnika uprawnień.
            </Text>
          )}
        </View>
      ) : null}

      <View style={styles.actions}>
        {status !== 'authenticated' ? (
          <Button
            label={isLoggingIn ? 'Logowanie DEMO…' : 'Połącz przez mObywatel — DEMO'}
            onPress={() => void onLogin()}
            disabled={isLoggingIn || phase === 'bootstrapping'}
          />
        ) : (
          <Text style={styles.meta}>
            Zalogowano demonstracyjnie. Token zastąpiono; ten sam user_id powinien pozostać.
          </Text>
        )}
        {!status || sessionExpiredNotice ? (
          <Button
            label="Nowa sesja anonimowa"
            variant="secondary"
            onPress={() => {
              clearSessionExpiredNotice();
              void startNewAnonymousSession().catch((error) => {
                setLoginError(
                  apiErrorMessage(error, 'Nie udało się utworzyć nowej sesji.'),
                );
              });
            }}
          />
        ) : null}
      </View>
    </Card>
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
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  title: { ...typography.h3, color: colors.text, marginBottom: spacing.xs },
  body: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  meta: { ...typography.small, color: colors.textMuted, marginBottom: spacing.xs },
  warning: { ...typography.small, color: colors.warning, marginBottom: spacing.sm },
  block: { gap: spacing.xs, marginBottom: spacing.sm },
  kv: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  label: { ...typography.small, color: colors.textMuted },
  value: { ...typography.bodyStrong, color: colors.text, flexShrink: 1, textAlign: 'right' },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
