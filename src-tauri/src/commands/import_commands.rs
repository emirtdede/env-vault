use crate::error::AppResult;
use crate::import::service::{BatchImportReport, ImportResult, ImportService};
use crate::settings::models::CollisionPolicy;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub fn import_env_file(
    project_id: String,
    file_path: String,
    collision: CollisionPolicy,
    import_service: State<'_, Arc<ImportService>>,
) -> AppResult<ImportResult> {
    let path = PathBuf::from(file_path);
    import_service.import_file_from_path(&project_id, &path, collision)
}

#[tauri::command]
pub fn import_env_files(
    project_id: String,
    file_paths: Vec<String>,
    collision: CollisionPolicy,
    import_service: State<'_, Arc<ImportService>>,
) -> AppResult<BatchImportReport> {
    let paths: Vec<PathBuf> = file_paths.into_iter().map(PathBuf::from).collect();
    Ok(import_service.import_files_from_paths(&project_id, &paths, collision))
}

#[tauri::command]
pub fn import_directory_env_files(
    project_id: String,
    directory_path: String,
    recursive: bool,
    collision: CollisionPolicy,
    import_service: State<'_, Arc<ImportService>>,
) -> AppResult<BatchImportReport> {
    let dir = PathBuf::from(directory_path);
    import_service.import_directory_env_files(&project_id, &dir, recursive, collision)
}

#[derive(serde::Deserialize)]
pub struct RawEnvEntry {
    pub filename: String,
    pub content: String,
}

#[tauri::command]
pub fn import_batch_raw_documents(
    project_id: String,
    entries: Vec<RawEnvEntry>,
    collision: CollisionPolicy,
    import_service: State<'_, Arc<ImportService>>,
) -> AppResult<BatchImportReport> {
    let docs = entries.into_iter().map(|e| (e.filename, e.content)).collect();
    import_service.import_batch_raw_documents(&project_id, docs, collision)
}
