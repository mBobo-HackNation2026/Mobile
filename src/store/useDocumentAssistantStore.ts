import { create } from 'zustand';

import type { ApplicationDocumentStatus } from '@/types/extensions';

interface DocumentAssistantState {
  /** Lokalne oznaczenia użytkownika: documentId → status. */
  overrides: Record<string, ApplicationDocumentStatus>;
  setDocumentStatus: (id: string, status: ApplicationDocumentStatus) => void;
  clearOverrides: () => void;
}

export const useDocumentAssistantStore = create<DocumentAssistantState>((set) => ({
  overrides: {},
  setDocumentStatus: (id, status) =>
    set((state) => ({
      overrides: { ...state.overrides, [id]: status },
    })),
  clearOverrides: () => set({ overrides: {} }),
}));
