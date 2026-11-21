import { addDays, parseISO, setHours, setMinutes, isBefore } from 'date-fns';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import type { BenefitDeadline, ReminderSettings } from '@/types/calendar';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export type PermissionResult = ReminderSettings['permissionStatus'];

export async function ensureReminderPermissions(): Promise<PermissionResult> {
  if (Platform.OS === 'web') {
    if (typeof Notification === 'undefined') return 'unavailable';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    const result = await Notification.requestPermission();
    return result === 'granted' ? 'granted' : 'denied';
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return 'granted';
  if (current.status === 'denied') return 'denied';

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted ? 'granted' : 'denied';
}

function reminderFireDate(submitBy: string, daysBefore: number): Date | null {
  try {
    const due = parseISO(submitBy);
    const day = addDays(due, -daysBefore);
    const atNine = setMinutes(setHours(day, 9), 0);
    if (isBefore(atNine, new Date())) return null;
    return atNine;
  } catch {
    return null;
  }
}

async function cancelManagedReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) => item.content.data?.source === 'moj-plan-rodzica')
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );
}

export async function syncDeadlineReminders(
  deadlines: BenefitDeadline[],
  settings: ReminderSettings,
): Promise<{ scheduled: number; skippedPast: number }> {
  if (!settings.enabled) {
    await cancelManagedReminders();
    return { scheduled: 0, skippedPast: 0 };
  }

  const permission = await ensureReminderPermissions();
  if (permission !== 'granted') {
    return { scheduled: 0, skippedPast: 0 };
  }

  if (Platform.OS === 'web') {
    return syncWebReminders(deadlines, settings);
  }

  await cancelManagedReminders();

  let scheduled = 0;
  let skippedPast = 0;

  for (const deadline of deadlines) {
    for (const daysBefore of settings.daysBefore) {
      const fireAt = reminderFireDate(deadline.submitBy, daysBefore);
      if (!fireAt) {
        skippedPast += 1;
        continue;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Zbliża się termin złożenia',
          body: `${deadline.title} — złóż do ${deadline.submitBy} (za ${daysBefore} dni).`,
          data: {
            source: 'moj-plan-rodzica',
            deadlineId: deadline.id,
            daysBefore,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fireAt,
        },
      });
      scheduled += 1;
    }
  }

  return { scheduled, skippedPast };
}

function syncWebReminders(
  deadlines: BenefitDeadline[],
  settings: ReminderSettings,
): { scheduled: number; skippedPast: number } {
  // Na web nie mamy niezawodnego schedulera w tle — pokazujemy powiadomienie
  // tylko dla terminów „na dziś / jutro”, gdy użytkownik ma otwartą aplikację.
  let scheduled = 0;
  let skippedPast = 0;
  const today = new Date();

  for (const deadline of deadlines) {
    for (const daysBefore of settings.daysBefore) {
      const fireAt = reminderFireDate(deadline.submitBy, daysBefore);
      if (!fireAt) {
        skippedPast += 1;
        continue;
      }
      const sameDay =
        fireAt.getFullYear() === today.getFullYear() &&
        fireAt.getMonth() === today.getMonth() &&
        fireAt.getDate() === today.getDate();
      if (!sameDay) continue;

      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Zbliża się termin złożenia', {
          body: `${deadline.title} — złóż do ${deadline.submitBy}.`,
          tag: `deadline-${deadline.id}-${daysBefore}`,
        });
        scheduled += 1;
      }
    }
  }

  return { scheduled, skippedPast };
}

export function describeReminderSupport(): string {
  if (Platform.OS === 'web') {
    return 'Na webie przypomnienia działają tylko przy otwartej aplikacji (powiadomienia przeglądarki). Pełne push w tle wymaga buildu natywnego.';
  }
  return 'Lokalne powiadomienia urządzenia. Zdalny push wymaga konfiguracji dev build / usług push.';
}
