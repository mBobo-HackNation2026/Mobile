import { create } from 'zustand';

import type { DocumentAnalyzeResult, DocumentField } from '@/services/api/types';

interface DocumentsState {
  lastFileName: string | null;
  analysis: DocumentAnalyzeResult | null;
  /** Pola po korekcie użytkownika (key → value). */
  correctedFields: Record<string, string>;
  confirmed: boolean;
  setAnalysis: (fileName: string, analysis: DocumentAnalyzeResult) => void;
  setFieldValue: (key: string, value: string) => void;
  confirmCorrections: () => void;
  clearDocuments: () => void;
  getMergedFields: () => DocumentField[];
}

export const useDocumentsStore = create<DocumentsState>((set, get) => ({
  lastFileName: null,
  analysis: null,
  correctedFields: {},
  confirmed: false,
  setAnalysis: (fileName, analysis) =>
    set({
      lastFileName: fileName,
      analysis,
      correctedFields: Object.fromEntries(
        analysis.fields.map((field) => [field.key, field.value ?? '']),
      ),
      confirmed: false,
    }),
  setFieldValue: (key, value) =>
    set((state) => ({
      correctedFields: { ...state.correctedFields, [key]: value },
      confirmed: false,
    })),
  confirmCorrections: () => set({ confirmed: true }),
  clearDocuments: () =>
    set({
      lastFileName: null,
      analysis: null,
      correctedFields: {},
      confirmed: false,
    }),
  getMergedFields: () => {
    const { analysis, correctedFields } = get();
    if (!analysis) return [];
    return analysis.fields.map((field) => ({
      ...field,
      value: correctedFields[field.key] ?? field.value,
    }));
  },
}));
