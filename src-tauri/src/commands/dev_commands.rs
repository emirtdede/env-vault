use std::sync::Arc;

use tauri::State;

use crate::bridge::{BridgeInfo, BridgeState};
use crate::error::AppResult;
use crate::platform::terminal;
use crate::vault::service::VaultService;

#[tauri::command]
pub fn dev_bridge_info(bridge: State<'_, Arc<BridgeState>>) -> BridgeInfo {
    bridge.info()
}

#[tauri::command]
pub fn dev_bridge_start(
    bridge: State<'_, Arc<BridgeState>>,
    vault_service: State<'_, Arc<VaultService>>,
) -> AppResult<BridgeInfo> {
    bridge.start(vault_service.inner().clone())
}

#[tauri::command]
pub fn dev_bridge_stop(bridge: State<'_, Arc<BridgeState>>) -> BridgeInfo {
    bridge.stop();
    bridge.info()
}

#[tauri::command]
pub fn open_terminal(path: Option<String>) -> AppResult<()> {
    terminal::open_terminal(path.as_deref())
}

#[tauri::command]
pub fn dev_open_data_folder() -> AppResult<()> {
    let directory = crate::resolve_app_data_dir();
    std::fs::create_dir_all(&directory)?;
    crate::platform::open_path(&directory)
}
