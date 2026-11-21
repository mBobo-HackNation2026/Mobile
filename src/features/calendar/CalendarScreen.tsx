import { useQuery } from '@tanstack/react-query';
import { addMonths, formatISO, subMonths } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { DayPanel } from '@/features/calendar/DayPanel';
import { MonthGrid } from '@/features/calendar/MonthGrid';
import { ReminderPanel } from '@/features/calendar/ReminderPanel';
import { useAdaptiveLayout } from '@/hooks/useAdaptiveLayout';
import { monthTitlePl, toDateKey } from '@/lib/calendarGrid';
import { eligibilityService } from '@/services/api';
import { useCalendarStore } from '@/store/useCalendarStore';
import { useUserJourneyStore } from '@/store/useUserJourneyStore';
import { colors, spacing, typography } from '@/theme';
import { router } from 'expo-router';

export function CalendarScreen() {
  const profile = useUserJourneyStore((s) => s.profile);
  const notes = useCalendarStore((s) => s.notes);
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const setSelectedDate = useCalendarStore((s) => s.setSelectedDate);
  const upsertNote = useCalendarStore((s) => s.upsertNote);
  const deleteNote = useCalendarStore((s) => s.deleteNote);
  const { columns, isCompact } = useAdaptiveLayout();

  const [month, setMonth] = useState(() => new Date());
  const [draftNote, setDraftNote] = useState('');

  const query = useQuery({
    queryKey: ['eligibility', profile],
    queryFn: () => eligibilityService.evaluate(profile),
    enabled: profile.onboardingCompleted,
  });

  const deadlines = query.data?.deadlines ?? [];

  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(toDateKey(new Date()));
    }
  }, [selectedDate, setSelectedDate]);

  const datesWithDeadlines = useMemo(() => {
    const set = new Set<string>();
    for (const item of deadlines) {
      set.add(item.submitBy);
      if (item.windowStart) {
        // oznacz też start okna, żeby było widać początek
        set.add(item.windowStart);
      }
    }
    return set;
  }, [deadlines]);

  const datesWithNotes = useMemo(() => new Set(notes.map((note) => note.date)), [notes]);

  const dayDeadlines = useMemo(
    () =>
      deadlines.filter(
        (item) =>
          item.submitBy === selectedDate ||
          (item.windowStart != null &&
            selectedDate != null &&
            item.windowStart <= selectedDate &&
            item.submitBy >= selectedDate),
      ),
    [deadlines, selectedDate],
  );

  const dayNotes = useMemo(
    () => notes.filter((note) => note.date === selectedDate),
    [notes, selectedDate],
  );

  const upcoming = useMemo(
    () =>
      [...deadlines]
        .filter((item) => item.submitBy >= formatISO(new Date(), { representation: 'date' }))
        .sort((a, b) => a.submitBy.localeCompare(b.submitBy))
        .slice(0, 5),
    [deadlines],
  );

  if (!profile.onboardingCompleted) {
    return (
      <Screen>
        <EmptyState
          title="Kalendarz potrzebuje ankiety"
          description="Najpierw uzupełnij dane, żeby pokazać terminy złożenia świadczeń."
          actionLabel="Ankieta"
          onAction={() => router.push('/onboarding')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <DemoBanner message="Terminy są demonstracyjne — zawsze zweryfikuj je w oficjalnym źródle ZUS." />

      <View style={styles.header}>
        <Text style={styles.title}>Kalendarz terminów</Text>
        <Text style={styles.subtitle}>
          Do kiedy możesz złożyć wnioski, własne notatki i przypomnienia o zbliżającym się
          końcu okna.
        </Text>
      </View>

      <View style={styles.monthNav}>
        <Button
          label="Poprzedni"
          variant="secondary"
          onPress={() => setMonth((m) => subMonths(m, 1))}
        />
        <Text style={styles.monthLabel}>{monthTitlePl(month)}</Text>
        <Button
          label="Następny"
          variant="secondary"
          onPress={() => setMonth((m) => addMonths(m, 1))}
        />
      </View>

      <View style={[styles.layout, columns > 1 && styles.layoutRow]}>
        <View style={[styles.main, columns > 1 && styles.mainWide]}>
          <Card>
            <View style={styles.legend}>
              <Text style={styles.legendItem}>● termin / okno</Text>
              <Text style={[styles.legendItem, styles.legendNote]}>● notatka</Text>
            </View>
            <MonthGrid
              month={month}
              selectedDate={selectedDate}
              datesWithDeadlines={datesWithDeadlines}
              datesWithNotes={datesWithNotes}
              onSelectDate={(key) => {
                setSelectedDate(key);
                setDraftNote('');
              }}
            />
          </Card>

          {selectedDate ? (
            <DayPanel
              date={selectedDate}
              deadlines={dayDeadlines}
              notes={dayNotes}
              draftNote={draftNote}
              onChangeDraft={setDraftNote}
              onSaveNote={() => {
                upsertNote({ date: selectedDate, text: draftNote });
                setDraftNote('');
              }}
              onDeleteNote={deleteNote}
            />
          ) : null}
        </View>

        <View style={[styles.side, columns > 1 && styles.sideWide]}>
          <ReminderPanel deadlines={deadlines} />

          <Card>
            <Text style={styles.sideTitle}>Najbliższe terminy</Text>
            {query.isLoading ? (
              <Text style={styles.muted}>Ładowanie…</Text>
            ) : upcoming.length === 0 ? (
              <Text style={styles.muted}>Brak nadchodzących terminów w symulacji.</Text>
            ) : (
              upcoming.map((item) => (
                <View key={item.id} style={styles.upcomingRow}>
                  <Text style={styles.upcomingDate}>{item.submitBy}</Text>
                  <Text style={styles.upcomingTitle}>{item.title}</Text>
                  <Button
                    label="Pokaż dzień"
                    variant="ghost"
                    onPress={() => {
                      setSelectedDate(item.submitBy);
                      setMonth(new Date(item.submitBy));
                    }}
                    fullWidth={isCompact}
                  />
                </View>
              ))
            )}
          </Card>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary, maxWidth: 720 },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  monthLabel: {
    ...typography.h3,
    color: colors.text,
    textTransform: 'capitalize',
    flexShrink: 1,
    textAlign: 'center',
  },
  layout: { gap: spacing.lg },
  layoutRow: { flexDirection: 'row', alignItems: 'flex-start' },
  main: { gap: spacing.md, flex: 1, minWidth: 0 },
  mainWide: { flex: 1.5 },
  side: { gap: spacing.md },
  sideWide: { width: 340, maxWidth: '100%' },
  legend: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  legendItem: { ...typography.caption, color: colors.warning },
  legendNote: { color: colors.primary },
  sideTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  upcomingRow: {
    gap: spacing.xxs,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  upcomingDate: { ...typography.caption, color: colors.textMuted },
  upcomingTitle: { ...typography.bodyStrong, color: colors.text },
  muted: { ...typography.body, color: colors.textMuted },
});
