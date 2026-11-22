import { invoke } from "@tauri-apps/api/core";

export interface BridgeInfo {
  running: boolean;
  port: number | null;
  endpoint: string | null;
  cliPath: string;
  dataDir: string;
}

export const devApi = {
  bridgeInfo: (): Promise<BridgeInfo> => invoke("dev_bridge_info"),
  startBridge: (): Promise<BridgeInfo> => invoke("dev_bridge_start"),
  stopBridge: (): Promise<BridgeInfo> => invoke("dev_bridge_stop"),
  openTerminal: (path?: string | null): Promise<void> =>
    invoke("open_terminal", { path: path ?? null }),
  openDataFolder: (): Promise<void> => invoke("dev_open_data_folder"),
};
