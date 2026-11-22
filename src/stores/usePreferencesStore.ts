import { create } from "zustand";
import { AppSettings, Language } from "../types";

interface PreferencesState extends AppSettings {
  updateSettings: (settings: Partial<AppSettings>) => void;
}

function detectSystemLanguage(catalog: readonly string[]): Language {
  if (typeof navigator === "undefined") return "en";
  const candidates = [
    ...(navigator.languages ?? []),
    navigator.language,
  ].filter(Boolean) as string[];

  for (const raw of candidates) {
    const normalized = raw.toLowerCase().replace("_", "-");
    if (catalog.includes(normalized)) return normalized;
    const base = normalized.split("-")[0] ?? normalized;
    if (catalog.includes(base)) return base;
    if (base === "nb" && catalog.includes("no")) return "no";
    if (base === "zh" && catalog.includes("zh")) return "zh";
  }
  return "en";
}

export const defaultSettings: AppSettings = {
  theme: "siyah",
  language: "en",
  autoLockMinutes: 15,
  autoUnlockWithWindows: false,
  autoHideSecrets: true,
  clearClipboardSeconds: 30,
  askExportLocation: true,
  defaultExportDirectory: null,
  exportCollisionPolicy: "ask",
  closeAction: "ask",
  reduceMotion: false,
  customAccent: "#0A84FF",
  followSystemTheme: false,
  iconTheme: "obsidian",
  uiScale: 100,
  startWithWindows: false,
  startMinimized: false,
  globalShortcutEnabled: true,
  notificationsEnabled: true,
  notificationSound: true,
  autoSyncEnabled: true,
  onboardingCompleted: false,
  devBridgeEnabled: false,
  sidebarCollapsed: false,
  aiEnabled: false,
  aiModel: "llama3.2",
  webhookEnabled: false,
  webhookUrl: "",
  webhookToken: "",
};

export { detectSystemLanguage };

/** Extracts only the serialisable preference fields from the store state. */
export function toSettingsPayload(state: AppSettings): AppSettings {
  return {
    theme: state.theme,
    language: state.language,
    autoLockMinutes: state.autoLockMinutes,
    autoUnlockWithWindows: state.autoUnlockWithWindows,
    autoHideSecrets: state.autoHideSecrets,
    clearClipboardSeconds: state.clearClipboardSeconds,
    askExportLocation: state.askExportLocation,
    defaultExportDirectory: state.defaultExportDirectory,
    exportCollisionPolicy: state.exportCollisionPolicy,
    closeAction: state.closeAction,
    reduceMotion: state.reduceMotion,
    customAccent: state.customAccent,
    followSystemTheme: state.followSystemTheme,
    iconTheme: state.iconTheme,
    uiScale: state.uiScale,
    startWithWindows: state.startWithWindows,
    startMinimized: state.startMinimized,
    globalShortcutEnabled: state.globalShortcutEnabled,
    notificationsEnabled: state.notificationsEnabled,
    notificationSound: state.notificationSound,
    autoSyncEnabled: state.autoSyncEnabled,
    onboardingCompleted: state.onboardingCompleted,
    devBridgeEnabled: state.devBridgeEnabled,
    sidebarCollapsed: state.sidebarCollapsed,
    aiEnabled: state.aiEnabled,
    aiModel: state.aiModel,
    webhookEnabled: state.webhookEnabled,
    webhookUrl: state.webhookUrl,
    webhookToken: state.webhookToken,
  };
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  ...defaultSettings,
  updateSettings: (settings) => set((state) => ({ ...state, ...settings })),
}));
