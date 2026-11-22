import { invoke } from "@tauri-apps/api/core";
import { AppSettings, AppIconTheme, SystemInfo } from "../../types";

export const systemApi = {
  info: () => invoke<SystemInfo>("get_system_info"),
  setStartWithWindows: (enabled: boolean, startMinimized: boolean) =>
    invoke<AppSettings>("set_start_with_windows", { enabled, startMinimized }),
  applyIcon: (theme: AppIconTheme) => invoke<AppSettings>("apply_app_icon", { theme }),
  setGlobalShortcut: (enabled: boolean, shortcut?: string | null) =>
    invoke<AppSettings>("set_global_shortcut", { enabled, shortcut: shortcut ?? null }),
  sendTestNotification: (title: string, body: string) =>
    invoke<void>("send_test_notification", { title, body }),
  syncSideEffects: (settings: AppSettings) =>
    invoke<void>("sync_setting_side_effects", { settings }),
  revealPath: (path: string) => invoke<void>("reveal_path", { path }),
};
