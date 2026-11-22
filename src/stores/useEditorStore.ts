import { create } from "zustand";
import { envApi } from "../lib/tauri/env-api";
import { useEnvStore } from "./useEnvStore";

interface EditorStoreState {
  activeDocId: string | null;
  filename: string;
  rawContent: string;
  initialContent: string;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  isRevealed: boolean;
  error: string | null;
  openDocument: (id: string, filename: string) => Promise<void>;
  closeDocument: () => void;
  setContent: (content: string) => void;
  save: () => Promise<void>;
  toggleReveal: () => void;
  clearError: () => void;
}

export const useEditorStore = create<EditorStoreState>((set, get) => ({
  activeDocId: null,
  filename: "",
  rawContent: "",
  initialContent: "",
  isDirty: false,
  isLoading: false,
  isSaving: false,
  isRevealed: false,
  error: null,

  openDocument: async (id: string, filename: string) => {
    try {
      set({
        activeDocId: id,
        filename,
        isLoading: true,
        error: null,
        isDirty: false,
      });

      const payload = await envApi.readEnvDocument(id);
      set({
        rawContent: payload.rawText,
        initialContent: payload.rawText,
        isLoading: false,
        isDirty: false,
      });
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Environment file could not be read.";
      set({ error: msg, isLoading: false });
    }
  },

  closeDocument: () => {
    // Memory isolation: purge secret content immediately
    set({
      activeDocId: null,
      filename: "",
      rawContent: "",
      initialContent: "",
      isDirty: false,
      isLoading: false,
      isSaving: false,
      isRevealed: false,
      error: null,
    });
  },

  setContent: (content: string) => {
    const isDirty = content !== get().initialContent;
    set({ rawContent: content, isDirty });
  },

  save: async () => {
    const { activeDocId, rawContent } = get();
    if (!activeDocId) return;

    try {
      set({ isSaving: true, error: null });
      const updated = await envApi.updateEnvDocument(activeDocId, rawContent);
      
      // Update useEnvStore documents list so card details, byteLength, and keys are immediately fresh
      useEnvStore.setState((state) => ({
        documents: state.documents.map((d) => (d.id === activeDocId ? updated : d)),
      }));

      set({
        initialContent: rawContent,
        isDirty: false,
        isSaving: false,
      });
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Changes could not be saved.";
      set({ error: msg, isSaving: false });
      throw err;
    }
  },

  toggleReveal: () => set((state) => ({ isRevealed: !state.isRevealed })),
  clearError: () => set({ error: null }),
}));
