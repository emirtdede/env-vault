use crate::error::AppResult;
use crate::export::service::{BatchExportReport, ExportReport, ExportService};
use crate::settings::models::CollisionPolicy;
use crate::vault::service::VaultService;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub fn export_env_document(
    env_id: String,
    target_path: Option<String>,
    default_directory: Option<String>,
    collision: CollisionPolicy,
    export_service: State<'_, Arc<ExportService>>,
) -> AppResult<ExportReport> {
    if let Some(target) = target_path {
        let path = PathBuf::from(target);
        export_service.export_to_path(&env_id, &path, collision)
    } else if let Some(def_dir) = default_directory {
        let path = PathBuf::from(def_dir);
        export_service.export_to_default_directory(&env_id, &path, collision)
    } else {
        Err(crate::error::AppError::ExportPathInvalid)
    }
}

#[tauri::command]
pub fn export_multiple_env_documents(
    env_ids: Vec<String>,
    target_directory: String,
    collision: CollisionPolicy,
    export_service: State<'_, Arc<ExportService>>,
) -> AppResult<BatchExportReport> {
    let dir = PathBuf::from(target_directory);
    export_service.export_multiple_to_directory(&env_ids, &dir, collision)
}

#[tauri::command]
pub fn export_project_env_documents(
    project_id: String,
    target_directory: String,
    collision: CollisionPolicy,
    export_service: State<'_, Arc<ExportService>>,
) -> AppResult<BatchExportReport> {
    let dir = PathBuf::from(target_directory);
    export_service.export_project_to_directory(&project_id, &dir, collision)
}

#[tauri::command]
pub fn export_all_projects(
    target_directory: String,
    collision: CollisionPolicy,
    export_service: State<'_, Arc<ExportService>>,
) -> AppResult<BatchExportReport> {
    let dir = PathBuf::from(target_directory);
    export_service.export_all_projects_to_directory(&dir, collision)
}

#[tauri::command]
pub fn export_merged_project_env(
    project_id: String,
    target_path: String,
    export_service: State<'_, Arc<ExportService>>,
) -> AppResult<ExportReport> {
    let path = PathBuf::from(target_path);
    export_service.export_merged_project_env(&project_id, &path)
}

#[tauri::command]
pub fn start_virtual_file_drag(
    env_id: String,
    vault_service: State<'_, Arc<VaultService>>,
) -> AppResult<()> {
    crate::platform::windows::ole_drag::start_virtual_file_drag(
        vault_service.inner().clone(),
        env_id,
    )
}
