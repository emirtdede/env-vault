use std::sync::Arc;

use tauri::{AppHandle, Manager, State};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

use crate::error::{AppError, AppResult};
use crate::platform::system::{self, SystemInfo};
use crate::settings::models::AppSettings;
use crate::settings::service::SettingsService;
use crate::vault::service::VaultService;

pub const DEFAULT_SHORTCUT: &str = "CmdOrCtrl+Alt+N";

#[tauri::command]
pub fn get_system_info(vault_service: State<'_, Arc<VaultService>>) -> SystemInfo {
    let state = match vault_service.get_state() {
        crate::vault::session::VaultSessionState::Unlocked => "unlocked",
        crate::vault::session::VaultSessionState::Locked => "locked",
        crate::vault::session::VaultSessionState::Uninitialized => "uninitialized",
        _ => "error",
    };
    system::system_info(state)
}

#[tauri::command]
pub fn set_start_with_windows(
    enabled: bool,
    start_minimized: bool,
    settings_service: State<'_, Arc<SettingsService>>,
    vault_service: State<'_, Arc<VaultService>>,
) -> AppResult<AppSettings> {
    system::set_startup(enabled, start_minimized)?;
    let mut settings = settings_service.get_settings();
    settings.start_with_windows = enabled;
    settings.start_minimized = start_minimized;
    settings_service.save_settings(&settings)?;
    vault_service.set_auto_lock_duration(settings.auto_lock_minutes);
    Ok(settings)
}

#[tauri::command]
pub fn apply_app_icon(
    theme: String,
    app: AppHandle,
    settings_service: State<'_, Arc<SettingsService>>,
) -> AppResult<AppSettings> {
    let app_data = crate::resolve_app_data_dir();
    let png_path = system::materialize_icon(&app_data, &theme)?;
    let bytes = std::fs::read(&png_path)?;
    let image = tauri::image::Image::from_bytes(&bytes)
        .map_err(|_| AppError::Custom("ICON_LOAD_FAILED".into()))?;

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_icon(image.clone());
    }
    if let Some(tray) = app.tray_by_id("main-tray") {
        let _ = tray.set_icon(Some(image));
    }
    let _ = system::update_shortcut_icon(&app_data, &theme);
    let _ = system::apply_jump_list(&app_data, &theme);

    let mut settings = settings_service.get_settings();
    settings.icon_theme = match theme.as_str() {
        "porcelain" => crate::settings::models::IconTheme::Porcelain,
        "contrast" => crate::settings::models::IconTheme::Contrast,
        "cyan" => crate::settings::models::IconTheme::Cyan,
        _ => crate::settings::models::IconTheme::Obsidian,
    };
    settings_service.save_settings(&settings)?;
    Ok(settings)
}

#[tauri::command]
pub fn set_global_shortcut(
    enabled: bool,
    shortcut: Option<String>,
    app: AppHandle,
    settings_service: State<'_, Arc<SettingsService>>,
) -> AppResult<AppSettings> {
    let accelerator = shortcut.unwrap_or_else(|| DEFAULT_SHORTCUT.to_string());
    let manager = app.global_shortcut();

    let _ = manager.unregister_all();
    if enabled {
        let parsed: Shortcut = accelerator
            .parse()
            .map_err(|_| AppError::Custom("SHORTCUT_INVALID".into()))?;
        manager
            .register(parsed)
            .map_err(|_| AppError::Custom("SHORTCUT_REGISTER_FAILED".into()))?;
    }

    let mut settings = settings_service.get_settings();
    settings.global_shortcut_enabled = enabled;
    settings_service.save_settings(&settings)?;
    Ok(settings)
}

#[tauri::command]
pub fn send_test_notification(title: String, body: String, app: AppHandle) -> AppResult<()> {
    use tauri_plugin_notification::NotificationExt;
    app.notification()
        .builder()
        .title(title)
        .body(body)
        .show()
        .map_err(|_| AppError::Custom("NOTIFICATION_FAILED".into()))
}

#[tauri::command]
pub fn sync_setting_side_effects(settings: AppSettings, app: AppHandle) -> AppResult<()> {
    // Startup registration is idempotent and keeps the registry aligned with
    // the persisted preference after every settings write.
    if let Err(error) = system::set_startup(settings.start_with_windows, settings.start_minimized) {
        if settings.start_with_windows {
            return Err(error);
        }
    }

    let manager = app.global_shortcut();
    let _ = manager.unregister_all();
    if settings.global_shortcut_enabled {
        if let Ok(parsed) = DEFAULT_SHORTCUT.parse::<Shortcut>() {
            let _ = manager.register(parsed);
        }
    }
    Ok(())
}

#[tauri::command]
pub fn show_main_window(app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}
