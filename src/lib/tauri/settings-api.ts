import { invoke } from "@tauri-apps/api/core";
import { AppSettings } from "../../types";

export const settingsApi = {
  getSettings: async (): Promise<AppSettings> => {
    return await invoke<AppSettings>("get_settings");
  },

  updateSettings: async (settings: AppSettings): Promise<void> => {
    await invoke("update_settings", { settings });
  },
};
