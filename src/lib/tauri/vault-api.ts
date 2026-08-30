import { invoke } from "@tauri-apps/api/core";
import { VaultState } from "../../types";

export const vaultApi = {
  getVaultState: async (): Promise<VaultState> => {
    return await invoke<VaultState>("get_vault_state");
  },

  initializeVault: async (password: string): Promise<void> => {
    await invoke("initialize_vault", { password });
  },

  unlockVault: async (password: string): Promise<void> => {
    await invoke("unlock_vault", { password });
  },

  lockVault: async (): Promise<void> => {
    await invoke("lock_vault");
  },

  changeMasterPassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await invoke("change_master_password", { currentPassword, newPassword });
  },

  resetVault: async (): Promise<void> => {
    await invoke("reset_vault");
  },
};
