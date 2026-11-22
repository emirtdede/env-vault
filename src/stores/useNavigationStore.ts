import { create } from "zustand";

export type AppView = "vault" | "settings" | "docs" | "support" | "about";

export type SettingsSection =
  | "general"
  | "appearance"
  | "security"
  | "notifications"
  | "data"
  | "accessibility"
  | "docs"
  | "about";

interface NavigationState {
  view: AppView;
  settingsSection: SettingsSection;
  setView: (view: AppView) => void;
  openSettings: (section?: SettingsSection) => void;
  setSettingsSection: (section: SettingsSection) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  view: "vault",
  settingsSection: "general",
  setView: (view) => set({ view }),
  openSettings: (section = "general") =>
    set({ view: "settings", settingsSection: section }),
  setSettingsSection: (settingsSection) => set({ settingsSection }),
}));
