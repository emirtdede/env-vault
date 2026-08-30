use crate::error::AppResult;
use crate::settings::models::AppSettings;
use crate::settings::service::SettingsService;
use crate::vault::service::VaultService;
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub fn get_settings(settings_service: State<'_, Arc<SettingsService>>) -> AppSettings {
    settings_service.get_settings()
}

#[tauri::command]
pub fn update_settings(
    settings: AppSettings,
    settings_service: State<'_, Arc<SettingsService>>,
    vault_service: State<'_, Arc<VaultService>>,
) -> AppResult<()> {
    vault_service.set_auto_lock_duration(settings.auto_lock_minutes);
    settings_service.save_settings(&settings)
}
