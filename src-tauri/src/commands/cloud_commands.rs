use std::sync::Arc;

use tauri::State;

use crate::cloud::sync::{
    CloudProvider, CloudService, CloudStatus, RestoreProposal, SyncOutcome,
};
use crate::error::AppResult;

#[tauri::command]
pub fn cloud_status(cloud: State<'_, Arc<CloudService>>) -> CloudStatus {
    cloud.status()
}

#[tauri::command]
pub fn cloud_providers(cloud: State<'_, Arc<CloudService>>) -> Vec<CloudProvider> {
    cloud.providers()
}

#[tauri::command]
pub fn cloud_connect(
    provider: String,
    folder: Option<String>,
    cloud: State<'_, Arc<CloudService>>,
) -> AppResult<CloudStatus> {
    cloud.connect(&provider, folder)
}

#[tauri::command]
pub fn cloud_disconnect(cloud: State<'_, Arc<CloudService>>) -> AppResult<CloudStatus> {
    cloud.disconnect()
}

#[tauri::command]
pub fn cloud_set_auto_sync(
    enabled: bool,
    cloud: State<'_, Arc<CloudService>>,
) -> AppResult<CloudStatus> {
    cloud.set_auto_sync(enabled)
}

#[tauri::command]
pub fn cloud_set_folder(
    folder: String,
    cloud: State<'_, Arc<CloudService>>,
) -> AppResult<CloudStatus> {
    cloud.set_folder(folder)
}

#[tauri::command]
pub fn cloud_sync_now(cloud: State<'_, Arc<CloudService>>) -> AppResult<SyncOutcome> {
    cloud.sync_now()
}

#[tauri::command]
pub fn cloud_restore(cloud: State<'_, Arc<CloudService>>) -> AppResult<CloudStatus> {
    cloud.restore()
}

#[tauri::command]
pub fn cloud_detect_restore(cloud: State<'_, Arc<CloudService>>) -> RestoreProposal {
    cloud.detect_restore()
}

#[tauri::command]
pub fn cloud_open_folder(cloud: State<'_, Arc<CloudService>>) -> AppResult<String> {
    cloud.open_folder()
}
