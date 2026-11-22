import { format, parseISO, isValid } from 'date-fns';
import { pl } from 'date-fns/locale';

export function formatDatePl(value: string | null | undefined): string {
  if (!value) return 'Brak daty';
  const date = parseISO(value);
  if (!isValid(date)) return value;
  return format(date, 'd MMMM yyyy', { locale: pl });
}

export function formatShortDatePl(value: string | null | undefined): string {
  if (!value) return '—';
  const date = parseISO(value);
  if (!isValid(date)) return value;
  return format(date, 'dd.MM.yyyy', { locale: pl });
}
