import { isSameMonth, isToday } from 'date-fns';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { buildMonthCells, toDateKey, WEEKDAY_LABELS } from '@/lib/calendarGrid';
import { colors, layout, radii, spacing, typography } from '@/theme';

interface MonthGridProps {
  month: Date;
  selectedDate: string | null;
  datesWithDeadlines: Set<string>;
  datesWithNotes: Set<string>;
  onSelectDate: (dateKey: string) => void;
}

export function MonthGrid({
  month,
  selectedDate,
  datesWithDeadlines,
  datesWithNotes,
  onSelectDate,
}: MonthGridProps) {
  const cells = buildMonthCells(month);

  return (
    <View style={styles.wrap}>
      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((label) => (
          <Text key={label} style={styles.weekday}>
            {label}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((day) => {
          const key = toDateKey(day);
          const inMonth = isSameMonth(day, month);
          const selected = selectedDate === key;
          const today = isToday(day);
          const hasDeadline = datesWithDeadlines.has(key);
          const hasNote = datesWithNotes.has(key);

          return (
            <Pressable
              key={key}
              onPress={() => onSelectDate(key)}
              accessibilityRole="button"
              accessibilityLabel={`${key}${hasDeadline ? ', termin świadczenia' : ''}${hasNote ? ', notatka' : ''}`}
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.cell,
                !inMonth && styles.cellOutside,
                selected && styles.cellSelected,
                pressed && styles.cellPressed,
              ]}
            >
              <Text
                style={[
                  styles.dayNumber,
                  !inMonth && styles.dayOutside,
                  selected && styles.daySelected,
                  today && !selected && styles.dayToday,
                ]}
              >
                {day.getDate()}
              </Text>
              <View style={styles.dots}>
                {hasDeadline ? <View style={[styles.dot, styles.dotDeadline]} /> : null}
                {hasNote ? <View style={[styles.dot, styles.dotNote]} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    ...typography.caption,
    color: colors.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    minHeight: layout.touchMin + 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  cellOutside: {
    opacity: 0.45,
  },
  cellSelected: {
    backgroundColor: colors.primarySoft,
  },
  cellPressed: {
    opacity: 0.85,
  },
  dayNumber: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  dayOutside: {
    color: colors.textMuted,
  },
  daySelected: {
    color: colors.primaryHover,
  },
  dayToday: {
    color: colors.primary,
  },
  dots: {
    flexDirection: 'row',
    gap: 3,
    minHeight: 6,
    marginTop: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotDeadline: {
    backgroundColor: colors.warning,
  },
  dotNote: {
    backgroundColor: colors.primary,
  },
});
