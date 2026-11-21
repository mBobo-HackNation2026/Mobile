import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { formatDatePl } from '@/lib/format';
import { colors, radii, spacing, typography } from '@/theme';
import type { BenefitDeadline, CalendarNote } from '@/types/calendar';

const KIND_LABEL: Record<BenefitDeadline['kind'], string> = {
  benefit_submission: 'Złożenie świadczenia',
  document: 'Dokument',
  employer: 'Pracodawca',
  follow_up: 'Follow-up',
  custom: 'Własny',
};

interface DayPanelProps {
  date: string;
  deadlines: BenefitDeadline[];
  notes: CalendarNote[];
  draftNote: string;
  onChangeDraft: (value: string) => void;
  onSaveNote: () => void;
  onDeleteNote: (id: string) => void;
}

export function DayPanel({
  date,
  deadlines,
  notes,
  draftNote,
  onChangeDraft,
  onSaveNote,
  onDeleteNote,
}: DayPanelProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{formatDatePl(date)}</Text>

      <Card>
        <Text style={styles.section}>Terminy złożenia</Text>
        {deadlines.length === 0 ? (
          <Text style={styles.muted}>Brak terminów świadczeń w tym dniu.</Text>
        ) : (
          deadlines.map((deadline) => (
            <View key={deadline.id} style={styles.deadline}>
              <Badge label={KIND_LABEL[deadline.kind]} tone="warning" />
              <Text style={styles.deadlineTitle}>{deadline.title}</Text>
              <Text style={styles.body}>{deadline.description}</Text>
              {deadline.windowStart ? (
                <Text style={styles.meta}>
                  Okno od {formatDatePl(deadline.windowStart)} do{' '}
                  {formatDatePl(deadline.submitBy)}
                </Text>
              ) : (
                <Text style={styles.meta}>Do kiedy: {formatDatePl(deadline.submitBy)}</Text>
              )}
              {deadline.office ? (
                <Text style={styles.meta}>Gdzie: {deadline.office}</Text>
              ) : null}
              {deadline.officialUrl ? (
                <Pressable onPress={() => Linking.openURL(deadline.officialUrl!)}>
                  <Text style={styles.link}>Źródło oficjalne →</Text>
                </Pressable>
              ) : null}
              <Badge label="Demo / weryfikuj" tone="demo" />
            </View>
          ))
        )}
      </Card>

      <Card>
        <Text style={styles.section}>Twoje notatki</Text>
        {notes.map((note) => (
          <View key={note.id} style={styles.note}>
            <Text style={styles.body}>{note.text}</Text>
            <Pressable
              onPress={() => onDeleteNote(note.id)}
              accessibilityRole="button"
              accessibilityLabel="Usuń notatkę"
              style={styles.deleteBtn}
            >
              <Text style={styles.deleteText}>Usuń</Text>
            </Pressable>
          </View>
        ))}
        <TextField
          label="Nowa notatka"
          value={draftNote}
          onChangeText={onChangeDraft}
          placeholder="Np. zadzwonić do HR, zabrać skan ZAM…"
        />
        <Button label="Zapisz notatkę" onPress={onSaveNote} disabled={!draftNote.trim()} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  section: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  deadline: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  deadlineTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
  },
  meta: {
    ...typography.small,
    color: colors.textMuted,
  },
  muted: {
    ...typography.body,
    color: colors.textMuted,
  },
  link: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  note: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  deleteBtn: {
    alignSelf: 'flex-start',
    minHeight: 36,
    justifyContent: 'center',
  },
  deleteText: {
    ...typography.small,
    color: colors.danger,
  },
});
