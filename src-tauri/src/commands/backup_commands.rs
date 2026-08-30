use crate::backup::service::{BackupPreview, BackupService, RestoreMode};
use crate::error::AppResult;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub fn create_backup(
    destination_path: String,
    password: String,
    backup_service: State<'_, Arc<BackupService>>,
) -> AppResult<()> {
    let path = PathBuf::from(destination_path);
    backup_service.create_backup(&path, &password)
}

#[tauri::command]
pub fn inspect_backup(
    backup_path: String,
    password: String,
    backup_service: State<'_, Arc<BackupService>>,
) -> AppResult<BackupPreview> {
    let path = PathBuf::from(backup_path);
    backup_service.inspect_backup(&path, &password)
}

#[tauri::command]
pub fn restore_backup(
    backup_path: String,
    password: String,
    mode: RestoreMode,
    backup_service: State<'_, Arc<BackupService>>,
) -> AppResult<()> {
    let path = PathBuf::from(backup_path);
    backup_service.restore_backup(&path, &password, mode)
}
