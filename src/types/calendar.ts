export type DeadlineKind =
  | 'benefit_submission'
  | 'document'
  | 'employer'
  | 'follow_up'
  | 'custom';

export interface BenefitDeadline {
  id: string;
  title: string;
  /** Ostatni dzień na złożenie / do kiedy obowiązuje okno. */
  submitBy: string;
  windowStart: string | null;
  kind: DeadlineKind;
  benefitId: string | null;
  description: string;
  office: string | null;
  officialUrl: string | null;
  relatedChecklistId: string | null;
  isDemo: true;
}

export interface CalendarNote {
  id: string;
  date: string;
  text: string;
  linkedDeadlineId: string | null;
  updatedAt: string;
}

export interface ReminderSettings {
  enabled: boolean;
  /** Ile dni przed terminem wysłać przypomnienie. */
  daysBefore: number[];
  permissionStatus: 'unknown' | 'granted' | 'denied' | 'unavailable';
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: true,
  daysBefore: [7, 3, 1],
  permissionStatus: 'unknown',
};
