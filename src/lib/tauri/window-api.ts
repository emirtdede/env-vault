import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

export const windowApi = {
  hideToTray: async (): Promise<void> => {
    try {
      await invoke("hide_to_tray");
    } catch {
      try {
        const win = getCurrentWindow();
        await win.hide();
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn("Hide to tray fallback error:", err);
        }
      }
    }
  },

  showFromTray: async (): Promise<void> => {
    try {
      await invoke("show_from_tray");
    } catch {
      try {
        const win = getCurrentWindow();
        await win.show();
        await win.unminimize();
        await win.setFocus();
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn("Show from tray fallback error:", err);
        }
      }
    }
  },

  closeOrExit: async (): Promise<void> => {
    try {
      await invoke("exit_application");
    } catch {
      try {
        const win = getCurrentWindow();
        await win.close();
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn("Close application fallback error:", err);
        }
      }
    }
  },
};

