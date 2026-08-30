import { create } from "zustand";
import { VaultState } from "../types";
import { vaultApi } from "../lib/tauri/vault-api";

interface VaultSessionStoreState {
  state: VaultState;
  isLoading: boolean;
  error: string | null;
  fetchState: () => Promise<VaultState>;
  initialize: (password: string) => Promise<void>;
  unlock: (password: string) => Promise<void>;
  lock: () => Promise<void>;
  changePassword: (currentPass: string, newPass: string) => Promise<void>;
  resetVault: () => Promise<void>;
  clearError: () => void;
}

export const useVaultSessionStore = create<VaultSessionStoreState>((set) => ({
  state: "uninitialized",
  isLoading: true,
  error: null,

  fetchState: async () => {
    try {
      set({ isLoading: true, error: null });
      const state = await vaultApi.getVaultState();
      set({ state, isLoading: false });
      return state;
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Vault durumu alınamadı.";
      set({ state: "error", error: msg, isLoading: false });
      return "error";
    }
  },

  initialize: async (password: string) => {
    try {
      set({ isLoading: true, error: null });
      await vaultApi.initializeVault(password);
      set({ state: "unlocked", isLoading: false });
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Vault oluşturulamadı.";
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  unlock: async (password: string) => {
    try {
      set({ isLoading: true, error: null });
      await vaultApi.unlockVault(password);
      set({ state: "unlocked", isLoading: false });
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Geçersiz ana parola.";
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  lock: async () => {
    try {
      await vaultApi.lockVault();
      set({ state: "locked", error: null });
    } catch {
      set({ state: "locked" });
    }
  },

  changePassword: async (currentPass: string, newPass: string) => {
    try {
      set({ isLoading: true, error: null });
      await vaultApi.changeMasterPassword(currentPass, newPass);
      set({ isLoading: false });
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Parola değiştirilemedi.";
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  resetVault: async () => {
    try {
      set({ isLoading: true, error: null });
      await vaultApi.resetVault();
      set({ state: "uninitialized", isLoading: false });
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Kasa sıfırlanamadı.";
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
