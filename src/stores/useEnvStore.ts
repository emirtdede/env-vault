import { create } from "zustand";
import { EnvDocument } from "../types";
import { envApi } from "../lib/tauri/env-api";

interface EnvStoreState {
  documents: EnvDocument[];
  selectedDocId: string | null;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  fetchDocuments: (projectId: string) => Promise<void>;
  selectDocument: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  createDocument: (projectId: string, filename: string, rawText: string) => Promise<EnvDocument>;
  updateDocument: (id: string, rawText: string) => Promise<EnvDocument>;
  renameDocument: (id: string, newFilename: string) => Promise<EnvDocument>;
  deleteDocument: (id: string) => Promise<void>;
  deleteDocumentsBatch: (ids: string[]) => Promise<void>;
  clearDocuments: () => void;
  clearError: () => void;
}

export const useEnvStore = create<EnvStoreState>((set) => ({
  documents: [],
  selectedDocId: null,
  searchQuery: "",
  isLoading: false,
  error: null,

  fetchDocuments: async (projectId: string) => {
    try {
      set({ isLoading: true, error: null });
      const documents = await envApi.listEnvDocuments(projectId);
      set({ documents, isLoading: false });
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Ortam dosyaları yüklenemedi.";
      set({ error: msg, isLoading: false });
    }
  },

  selectDocument: (id) => set({ selectedDocId: id }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  createDocument: async (projectId, filename, rawText) => {
    try {
      set({ isLoading: true, error: null });
      const doc = await envApi.createEnvDocument(projectId, filename, rawText);
      set((state) => ({
        documents: [...state.documents, doc],
        selectedDocId: doc.id,
        isLoading: false,
      }));
      return doc;
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Ortam dosyası oluşturulamadı.";
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  updateDocument: async (id, rawText) => {
    try {
      set({ isLoading: true, error: null });
      const updated = await envApi.updateEnvDocument(id, rawText);
      set((state) => ({
        documents: state.documents.map((d) => (d.id === id ? updated : d)),
        isLoading: false,
      }));
      return updated;
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Ortam dosyası kaydedilemedi.";
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  renameDocument: async (id, newFilename) => {
    try {
      set({ isLoading: true, error: null });
      const updated = await envApi.renameEnvDocument(id, newFilename);
      set((state) => ({
        documents: state.documents.map((d) => (d.id === id ? updated : d)),
        isLoading: false,
      }));
      return updated;
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Ortam dosyası yeniden adlandırılamadı.";
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  deleteDocument: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await envApi.deleteEnvDocument(id);
      set((state) => ({
        documents: state.documents.filter((d) => d.id !== id),
        selectedDocId: state.selectedDocId === id ? null : state.selectedDocId,
        isLoading: false,
      }));
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Ortam dosyası silinemedi.";
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  deleteDocumentsBatch: async (ids) => {
    if (ids.length === 0) return;
    try {
      set({ isLoading: true, error: null });
      await envApi.deleteEnvDocumentsBatch(ids);
      const idSet = new Set(ids);
      set((state) => ({
        documents: state.documents.filter((d) => !idSet.has(d.id)),
        selectedDocId: state.selectedDocId && idSet.has(state.selectedDocId) ? null : state.selectedDocId,
        isLoading: false,
      }));
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Ortam dosyaları silinemedi.";
      set({ error: msg, isLoading: false });
      throw err;
    }
  },


  clearDocuments: () => set({ documents: [], selectedDocId: null, error: null }),
  clearError: () => set({ error: null }),
}));
