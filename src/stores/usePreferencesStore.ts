import { create } from "zustand";
import { AppSettings, Language, ThemeType } from "../types";

interface PreferencesState extends AppSettings {
  setTheme: (theme: ThemeType) => void;
  setLanguage: (language: Language) => void;
  setAutoLockMinutes: (minutes: AppSettings["autoLockMinutes"]) => void;
  setAutoUnlockWithWindows: (enabled: boolean) => void;
  setAutoHideSecrets: (enabled: boolean) => void;
  setClearClipboardSeconds: (seconds: number) => void;
  setAskExportLocation: (enabled: boolean) => void;
  setDefaultExportDirectory: (directory: string | null) => void;
  setExportCollisionPolicy: (policy: AppSettings["exportCollisionPolicy"]) => void;
  setCloseAction: (action: AppSettings["closeAction"]) => void;
  setReduceMotion: (enabled: boolean) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
}

export const defaultSettings: AppSettings = {
  theme: "siyah",
  language: "tr",
  autoLockMinutes: 15,
  autoUnlockWithWindows: false,
  autoHideSecrets: true,
  clearClipboardSeconds: 30,
  askExportLocation: true,
  defaultExportDirectory: null,
  exportCollisionPolicy: "ask",
  closeAction: "ask",
  reduceMotion: false,
};

export const usePreferencesStore = create<PreferencesState>((set) => ({
  ...defaultSettings,
  setTheme: (theme) => set({ theme }),
  setLanguage: (language) => set({ language }),
  setAutoLockMinutes: (autoLockMinutes) => set({ autoLockMinutes }),
  setAutoUnlockWithWindows: (autoUnlockWithWindows) => set({ autoUnlockWithWindows }),
  setAutoHideSecrets: (autoHideSecrets) => set({ autoHideSecrets }),
  setClearClipboardSeconds: (clearClipboardSeconds) => set({ clearClipboardSeconds }),
  setAskExportLocation: (askExportLocation) => set({ askExportLocation }),
  setDefaultExportDirectory: (defaultExportDirectory) => set({ defaultExportDirectory }),
  setExportCollisionPolicy: (exportCollisionPolicy) => set({ exportCollisionPolicy }),
  setCloseAction: (closeAction) => set({ closeAction }),
  setReduceMotion: (reduceMotion) => set({ reduceMotion }),
  updateSettings: (settings) => set((state) => ({ ...state, ...settings })),
}));
