use crate::error::AppResult;
use crate::vault::service::VaultService;
use crate::vault::session::VaultSessionState;
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub fn get_vault_state(vault_service: State<'_, Arc<VaultService>>) -> VaultSessionState {
    vault_service.get_state()
}

#[tauri::command]
pub fn initialize_vault(
    password: String,
    vault_service: State<'_, Arc<VaultService>>,
) -> AppResult<()> {
    vault_service.initialize_vault(&password)
}

#[tauri::command]
pub fn unlock_vault(
    password: String,
    vault_service: State<'_, Arc<VaultService>>,
) -> AppResult<()> {
    vault_service.unlock_vault(&password)
}

#[tauri::command]
pub fn lock_vault(vault_service: State<'_, Arc<VaultService>>) {
    vault_service.lock_vault();
}

#[tauri::command]
pub fn change_master_password(
    current_password: String,
    new_password: String,
    vault_service: State<'_, Arc<VaultService>>,
) -> AppResult<()> {
    vault_service.change_master_password(&current_password, &new_password)
}

#[tauri::command]
pub fn reset_vault(vault_service: State<'_, Arc<VaultService>>) -> AppResult<()> {
    vault_service.reset_vault()
}
