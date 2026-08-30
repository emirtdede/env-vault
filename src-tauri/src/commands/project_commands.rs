use crate::error::AppResult;
use crate::metadata::models::Project;
use crate::vault::service::VaultService;
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub fn list_projects(vault_service: State<'_, Arc<VaultService>>) -> AppResult<Vec<Project>> {
    vault_service.list_projects()
}

#[tauri::command]
pub fn create_project(
    name: String,
    description: Option<String>,
    source_path: Option<String>,
    vault_service: State<'_, Arc<VaultService>>,
) -> AppResult<Project> {
    vault_service.create_project(&name, description, source_path)
}

#[tauri::command]
pub fn update_project(
    id: String,
    name: String,
    description: Option<String>,
    source_path: Option<String>,
    favorite: Option<bool>,
    vault_service: State<'_, Arc<VaultService>>,
) -> AppResult<Project> {
    vault_service.update_project(&id, &name, description, source_path, favorite)
}

#[tauri::command]
pub fn delete_project(id: String, vault_service: State<'_, Arc<VaultService>>) -> AppResult<()> {
    vault_service.delete_project(&id)
}
