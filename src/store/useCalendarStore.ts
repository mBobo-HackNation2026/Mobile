import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  DEFAULT_REMINDER_SETTINGS,
  type CalendarNote,
  type ReminderSettings,
} from '@/types/calendar';

interface CalendarState {
  notes: CalendarNote[];
  reminderSettings: ReminderSettings;
  selectedDate: string | null;
  setSelectedDate: (date: string | null) => void;
  upsertNote: (input: {
    date: string;
    text: string;
    linkedDeadlineId?: string | null;
    id?: string;
  }) => void;
  deleteNote: (id: string) => void;
  setReminderSettings: (patch: Partial<ReminderSettings>) => void;
  clearCalendarData: () => void;
}

function createId(): string {
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      notes: [],
      reminderSettings: DEFAULT_REMINDER_SETTINGS,
      selectedDate: null,
      setSelectedDate: (date) => set({ selectedDate: date }),
      upsertNote: ({ date, text, linkedDeadlineId = null, id }) =>
        set((state) => {
          const trimmed = text.trim();
          if (!trimmed && id) {
            return { notes: state.notes.filter((note) => note.id !== id) };
          }
          if (!trimmed) return state;

          const updatedAt = new Date().toISOString();
          if (id) {
            return {
              notes: state.notes.map((note) =>
                note.id === id
                  ? { ...note, text: trimmed, linkedDeadlineId, updatedAt }
                  : note,
              ),
            };
          }

          return {
            notes: [
              ...state.notes,
              {
                id: createId(),
                date,
                text: trimmed,
                linkedDeadlineId,
                updatedAt,
              },
            ],
          };
        }),
      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
        })),
      setReminderSettings: (patch) =>
        set((state) => ({
          reminderSettings: { ...state.reminderSettings, ...patch },
        })),
      clearCalendarData: () =>
        set({
          notes: [],
          reminderSettings: DEFAULT_REMINDER_SETTINGS,
          selectedDate: null,
        }),
    }),
    {
      name: 'moj-plan-rodzica-calendar',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        notes: state.notes,
        reminderSettings: state.reminderSettings,
      }),
    },
  ),
);
