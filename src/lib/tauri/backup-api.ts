import { invoke } from "@tauri-apps/api/core";
import { BackupPreview } from "../../types";

export const backupApi = {
  createBackup: async (destinationPath: string, password: string): Promise<void> => {
    await invoke("create_backup", { destinationPath, password });
  },

  inspectBackup: async (backupPath: string, password: string): Promise<BackupPreview> => {
    return await invoke<BackupPreview>("inspect_backup", { backupPath, password });
  },

  restoreBackup: async (
    backupPath: string,
    password: string,
    mode: "merge" | "replace"
  ): Promise<void> => {
    await invoke("restore_backup", { backupPath, password, mode });
  },
};
