import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { Screen } from '@/components/ui/Screen';
import { formatDatePl } from '@/lib/format';
import { useCalendarStore } from '@/store/useCalendarStore';
import { useDocumentAssistantStore } from '@/store/useDocumentAssistantStore';
import { useDocumentsStore } from '@/store/useDocumentsStore';
import { useUserJourneyStore } from '@/store/useUserJourneyStore';
import { colors, spacing, typography } from '@/theme';
import {
  EMPLOYMENT_LABELS,
  INSURANCE_LABELS,
  ROLE_LABELS,
  STAGE_LABELS,
} from '@/types/journey';

export default function ProfileScreen() {
  const profile = useUserJourneyStore((s) => s.profile);
  const resetDemo = useUserJourneyStore((s) => s.resetDemo);
  const clearCalendarData = useCalendarStore((s) => s.clearCalendarData);
  const clearDocuments = useDocumentsStore((s) => s.clearDocuments);
  const clearDocAssistant = useDocumentAssistantStore((s) => s.clearOverrides);

  return (
    <Screen>
      <DemoBanner />
      <View style={styles.header}>
        <Text style={styles.title}>Profil i scenariusz</Text>
        <Text style={styles.subtitle}>
          Edytuj ankietę albo zrestartuj demo. Zmiany od razu wpływają na plan i kalkulator.
        </Text>
      </View>

      <Card>
        {profile.onboardingCompleted ? (
          <>
            <Row
              label="Etap"
              value={profile.stage ? STAGE_LABELS[profile.stage] : '—'}
            />
            <Row label="Rola" value={profile.role ? ROLE_LABELS[profile.role] : '—'} />
            <Row label="Data" value={formatDatePl(profile.eventDate)} />
            <Row
              label="Zatrudnienie"
              value={
                profile.employmentType ? EMPLOYMENT_LABELS[profile.employmentType] : '—'
              }
            />
            <Row
              label="Ubezpieczenie"
              value={
                profile.insuranceStatus ? INSURANCE_LABELS[profile.insuranceStatus] : '—'
              }
            />
            <Row
              label="Drugi rodzic"
              value={
                profile.hasSecondParent == null
                  ? '—'
                  : profile.hasSecondParent
                    ? 'Tak'
                    : 'Nie'
              }
            />
            <Row
              label="Dzieci"
              value={profile.childrenCount == null ? '—' : String(profile.childrenCount)}
            />
          </>
        ) : (
          <Text style={styles.empty}>Ankieta jeszcze nieukończona.</Text>
        )}
      </Card>

      <View style={styles.actions}>
        <Button label="Ponów ocenę świadczeń" onPress={() => router.push('/benefits')} />
        <Button label="Edytuj ankietę" variant="secondary" onPress={() => router.push('/onboarding')} />
        <Button label="Dane ZUS (symulacja)" variant="secondary" onPress={() => router.push('/zus')} />
        <Button label="Scenariusze demo" variant="secondary" onPress={() => router.push('/demo')} />
        <Button label="Kalendarz" variant="secondary" onPress={() => router.push('/calendar')} />
        <Button
          label="Restart demo"
          variant="danger"
          onPress={() => {
            resetDemo();
            clearCalendarData();
            clearDocuments();
            clearDocAssistant();
            router.replace('/');
          }}
        />
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: { ...typography.small, color: colors.textMuted },
  value: { ...typography.bodyStrong, color: colors.text, flexShrink: 1, textAlign: 'right' },
  empty: { ...typography.body, color: colors.textSecondary },
  actions: { gap: spacing.sm, alignItems: 'flex-start' },
});
