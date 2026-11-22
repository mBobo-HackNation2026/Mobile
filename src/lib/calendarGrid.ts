import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  formatISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { pl } from 'date-fns/locale';

export function buildMonthCells(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function toDateKey(date: Date): string {
  return formatISO(date, { representation: 'date' });
}

export const WEEKDAY_LABELS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'] as const;

export function monthTitlePl(month: Date): string {
  return month.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
}

export { pl };
