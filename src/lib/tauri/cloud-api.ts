import { invoke } from "@tauri-apps/api/core";
import {
  CloudProviderInfo,
  CloudRestoreProposal,
  CloudStatus,
  CloudSyncOutcome,
} from "../../types";

export const cloudApi = {
  status: () => invoke<CloudStatus>("cloud_status"),
  providers: () => invoke<CloudProviderInfo[]>("cloud_providers"),
  connect: (provider: string, folder?: string | null) =>
    invoke<CloudStatus>("cloud_connect", { provider, folder: folder ?? null }),
  disconnect: () => invoke<CloudStatus>("cloud_disconnect"),
  setAutoSync: (enabled: boolean) => invoke<CloudStatus>("cloud_set_auto_sync", { enabled }),
  setFolder: (folder: string) => invoke<CloudStatus>("cloud_set_folder", { folder }),
  syncNow: () => invoke<CloudSyncOutcome>("cloud_sync_now"),
  restore: () => invoke<CloudStatus>("cloud_restore"),
  detectRestore: () => invoke<CloudRestoreProposal>("cloud_detect_restore"),
  openFolder: () => invoke<string>("cloud_open_folder"),
};
