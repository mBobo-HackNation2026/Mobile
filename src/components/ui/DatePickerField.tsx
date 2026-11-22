import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout, radii, spacing, typography } from '@/theme';

const WEEKDAYS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

interface DatePickerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  /** Minimalna data (włącznie), ISO yyyy-MM-dd. */
  minimumDate?: string;
  /** Maksymalna data (włącznie), ISO yyyy-MM-dd. */
  maximumDate?: string;
}

/**
 * Pole daty z kalendarzem (modal) — WWW / iOS / Android.
 * Wartość w formacie RRRR-MM-DD.
 */
export function DatePickerField({
  label,
  value,
  onChange,
  placeholder = 'Wybierz datę',
  error,
  hint,
  minimumDate,
  maximumDate,
}: DatePickerFieldProps) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => {
    if (!value) return null;
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : null;
  }, [value]);

  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(selected ?? new Date()),
  );

  const openPicker = () => {
    setVisibleMonth(startOfMonth(selected ?? new Date()));
    setOpen(true);
  };

  const minBound = minimumDate ? parseISO(minimumDate) : null;
  const maxBound = maximumDate ? parseISO(maximumDate) : null;

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(visibleMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(visibleMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [visibleMonth]);

  const isDisabled = (day: Date) => {
    if (minBound && isValid(minBound) && day < startOfDayLocal(minBound)) return true;
    if (maxBound && isValid(maxBound) && day > startOfDayLocal(maxBound)) return true;
    return false;
  };

  const selectDay = (day: Date) => {
    if (isDisabled(day)) return;
    onChange(format(day, 'yyyy-MM-dd'));
    setOpen(false);
  };

  const displayValue = selected
    ? format(selected, 'd MMMM yyyy', { locale: pl })
    : '';

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={`${label}. ${displayValue || placeholder}`}
        style={({ pressed }) => [
          styles.field,
          error ? styles.fieldError : null,
          pressed && styles.fieldPressed,
        ]}
      >
        <Text
          style={[styles.fieldText, !displayValue && styles.fieldPlaceholder]}
          numberOfLines={1}
        >
          {displayValue || placeholder}
        </Text>
        <CalendarDays size={20} color={colors.primary} strokeWidth={2} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.hint}>{hint}</Text> : null}

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, spacing.lg) },
            ]}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{label}</Text>

            <View style={styles.monthNav}>
              <Pressable
                onPress={() => setVisibleMonth((m) => subMonths(m, 1))}
                style={styles.navBtn}
                accessibilityLabel="Poprzedni miesiąc"
              >
                <ChevronLeft size={22} color={colors.primaryHover} />
              </Pressable>
              <Text style={styles.monthLabel}>
                {format(visibleMonth, 'LLLL yyyy', { locale: pl })}
              </Text>
              <Pressable
                onPress={() => setVisibleMonth((m) => addMonths(m, 1))}
                style={styles.navBtn}
                accessibilityLabel="Następny miesiąc"
              >
                <ChevronRight size={22} color={colors.primaryHover} />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {WEEKDAYS.map((day) => (
                <Text key={day} style={styles.weekday}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {days.map((day) => {
                const inMonth = isSameMonth(day, visibleMonth);
                const selectedDay = selected ? isSameDay(day, selected) : false;
                const today = isSameDay(day, new Date());
                const disabled = isDisabled(day);

                return (
                  <Pressable
                    key={day.toISOString()}
                    onPress={() => selectDay(day)}
                    disabled={disabled}
                    style={[
                      styles.dayCell,
                      selectedDay && styles.daySelected,
                      today && !selectedDay && styles.dayToday,
                      disabled && styles.dayDisabled,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: selectedDay, disabled }}
                    accessibilityLabel={format(day, 'd MMMM yyyy', { locale: pl })}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        !inMonth && styles.dayOutside,
                        selectedDay && styles.dayTextSelected,
                        disabled && styles.dayTextDisabled,
                      ]}
                    >
                      {format(day, 'd')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.sheetActions}>
              <Pressable
                onPress={() => {
                  onChange('');
                  setOpen(false);
                }}
                style={styles.clearBtn}
              >
                <Text style={styles.clearText}>Wyczyść</Text>
              </Pressable>
              <Pressable onPress={() => setOpen(false)} style={styles.doneBtn}>
                <Text style={styles.doneText}>Zamknij</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function startOfDayLocal(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  label: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  field: {
    minHeight: layout.touchMin,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  fieldPressed: {
    opacity: 0.9,
    borderColor: colors.primary,
  },
  fieldError: {
    borderColor: colors.danger,
  },
  fieldText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  fieldPlaceholder: {
    color: colors.textMuted,
  },
  error: {
    ...typography.small,
    color: colors.danger,
  },
  hint: {
    ...typography.small,
    color: colors.textMuted,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
    ...Platform.select({
      web: {
        maxWidth: 480,
        width: '100%',
        alignSelf: 'center',
        borderBottomLeftRadius: radii.xl,
        borderBottomRightRadius: radii.xl,
        marginBottom: spacing.lg,
      },
      default: {},
    }),
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.xs,
  },
  sheetTitle: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  monthLabel: {
    ...typography.bodyStrong,
    color: colors.text,
    textTransform: 'capitalize',
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
  dayCell: {
    width: '14.2857%',
    aspectRatio: 1,
    maxHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
  },
  daySelected: {
    backgroundColor: colors.primary,
  },
  dayToday: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  dayDisabled: {
    opacity: 0.35,
  },
  dayText: {
    ...typography.body,
    color: colors.text,
  },
  dayOutside: {
    color: colors.textMuted,
  },
  dayTextSelected: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  dayTextDisabled: {
    color: colors.textMuted,
  },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  clearBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  clearText: {
    ...typography.bodyStrong,
    color: colors.textMuted,
  },
  doneBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
  },
  doneText: {
    ...typography.bodyStrong,
    color: colors.primaryHover,
  },
});
