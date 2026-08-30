use crate::error::AppResult;
use crate::metadata::models::{EnvDocument, EnvSecretPayload};
use crate::vault::service::VaultService;
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub fn list_env_documents(
    project_id: String,
    vault_service: State<'_, Arc<VaultService>>,
) -> AppResult<Vec<EnvDocument>> {
    vault_service.list_env_documents(&project_id)
}

#[tauri::command]
pub fn read_env_document(
    env_id: String,
    vault_service: State<'_, Arc<VaultService>>,
) -> AppResult<EnvSecretPayload> {
    vault_service.read_env_document(&env_id)
}

#[tauri::command]
pub fn create_env_document(
    project_id: String,
    filename: String,
    raw_text: String,
    vault_service: State<'_, Arc<VaultService>>,
) -> AppResult<EnvDocument> {
    vault_service.create_env_document(&project_id, &filename, &raw_text)
}

#[tauri::command]
pub fn update_env_document(
    env_id: String,
    raw_text: String,
    vault_service: State<'_, Arc<VaultService>>,
) -> AppResult<EnvDocument> {
    vault_service.update_env_document(&env_id, &raw_text)
}

#[tauri::command]
pub fn rename_env_document(
    env_id: String,
    new_filename: String,
    vault_service: State<'_, Arc<VaultService>>,
) -> AppResult<EnvDocument> {
    vault_service.rename_env_document(&env_id, &new_filename)
}

#[tauri::command]
pub fn delete_env_document(
    env_id: String,
    vault_service: State<'_, Arc<VaultService>>,
) -> AppResult<()> {
    vault_service.delete_env_document(&env_id)
}
