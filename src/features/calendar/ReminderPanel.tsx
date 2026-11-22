import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  describeReminderSupport,
  ensureReminderPermissions,
  syncDeadlineReminders,
} from '@/services/notifications/scheduleReminders';
import { useCalendarStore } from '@/store/useCalendarStore';
import { colors, radii, spacing, typography } from '@/theme';
import type { BenefitDeadline } from '@/types/calendar';

const DAY_OPTIONS = [14, 7, 3, 1] as const;

interface ReminderPanelProps {
  deadlines: BenefitDeadline[];
}

export function ReminderPanel({ deadlines }: ReminderPanelProps) {
  const reminderSettings = useCalendarStore((s) => s.reminderSettings);
  const setReminderSettings = useCalendarStore((s) => s.setReminderSettings);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const toggleDay = (day: number) => {
    const exists = reminderSettings.daysBefore.includes(day);
    const next = exists
      ? reminderSettings.daysBefore.filter((d) => d !== day)
      : [...reminderSettings.daysBefore, day].sort((a, b) => b - a);
    setReminderSettings({ daysBefore: next });
  };

  const enableAndSync = async () => {
    setBusy(true);
    setStatusMessage('');
    try {
      const permission = await ensureReminderPermissions();
      setReminderSettings({ permissionStatus: permission, enabled: permission === 'granted' });

      if (permission !== 'granted') {
        setStatusMessage(
          permission === 'unavailable'
            ? 'Powiadomienia niedostępne w tej przeglądarce.'
            : 'Brak zgody na powiadomienia — włącz je w ustawieniach systemu / przeglądarki.',
        );
        return;
      }

      const result = await syncDeadlineReminders(deadlines, {
        ...reminderSettings,
        enabled: true,
        permissionStatus: permission,
      });
      setStatusMessage(
        `Zaplanowano ${result.scheduled} przypomnień. Pominięto ${result.skippedPast} (data już minęła).`,
      );
    } catch {
      setStatusMessage('Nie udało się zaplanować przypomnień. Spróbuj ponownie.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>Przypomnienia o terminach</Text>
        <Badge
          label={reminderSettings.enabled ? 'Włączone' : 'Wyłączone'}
          tone={reminderSettings.enabled ? 'success' : 'neutral'}
        />
      </View>
      <Text style={styles.body}>{describeReminderSupport()}</Text>
      <Text style={styles.label}>Przypomnij mi na:</Text>
      <View style={styles.chips}>
        {DAY_OPTIONS.map((day) => {
          const selected = reminderSettings.daysBefore.includes(day);
          return (
            <Pressable
              key={day}
              onPress={() => toggleDay(day)}
              style={[styles.chip, selected && styles.chipSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {day} dni przed
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Button
        label={busy ? 'Planowanie…' : 'Włącz i zaplanuj powiadomienia'}
        onPress={enableAndSync}
        disabled={busy || reminderSettings.daysBefore.length === 0}
      />
      <Button
        label="Wyłącz przypomnienia"
        variant="ghost"
        onPress={() => {
          setReminderSettings({ enabled: false });
          void syncDeadlineReminders(deadlines, {
            ...reminderSettings,
            enabled: false,
          });
          setStatusMessage('Przypomnienia wyłączone.');
        }}
      />
      {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
  },
  body: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodyStrong,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  chip: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.primaryHover,
    fontWeight: '600',
  },
  status: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
