pub mod backup;
pub mod commands;
pub mod crypto;
pub mod env;
pub mod error;
pub mod export;
pub mod import;
pub mod metadata;
pub mod platform;
pub mod settings;
pub mod vault;

use std::path::PathBuf;
use std::sync::Arc;

use crate::backup::service::BackupService;
use crate::commands::*;
use crate::export::service::ExportService;
use crate::import::service::ImportService;
use crate::settings::service::SettingsService;
use crate::vault::repository::EncryptedFileRepository;
use crate::vault::service::VaultService;

use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::Manager;

pub fn resolve_app_data_dir() -> PathBuf {
    dirs::data_local_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("EnvVault")
}

pub fn run() {
    let app_data_dir = resolve_app_data_dir();
    let _ = std::fs::create_dir_all(&app_data_dir);
    let repo = Arc::new(EncryptedFileRepository::new(app_data_dir.clone()));
    let vault_service = Arc::new(VaultService::new(repo));
    let import_service = Arc::new(ImportService::new(vault_service.clone()));
    let export_service = Arc::new(ExportService::new(vault_service.clone()));
    let backup_service = Arc::new(BackupService::new(vault_service.clone()));
    let settings_service = Arc::new(SettingsService::new(&app_data_dir));

    // Synchronize auto lock duration from stored settings
    let initial_settings = settings_service.get_settings();
    vault_service.set_auto_lock_duration(initial_settings.auto_lock_minutes);

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .manage(vault_service)
        .manage(import_service)
        .manage(export_service)
        .manage(backup_service)
        .manage(settings_service)
        .setup(|app| {
            let show_i = MenuItem::with_id(app, "show", "Env Vault'ı Göster", true, None::<&str>)?;
            let lock_i = MenuItem::with_id(app, "lock", "Kasayı Kilitle", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Uygulamadan Çık", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &lock_i, &quit_i])?;

            let mut builder = TrayIconBuilder::new()
                .menu(&menu)
                .show_menu_on_left_click(false)
                .tooltip("Env Vault — Güvenli Ortam Kasası");

            if let Some(icon) = app.default_window_icon() {
                builder = builder.icon(icon.clone());
            }

            builder = builder.on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                    }
                    "lock" => {
                        let vault_service = app.state::<Arc<VaultService>>();
                        vault_service.lock_vault();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    match event {
                        TrayIconEvent::Click {
                            button: MouseButton::Left,
                            button_state: MouseButtonState::Up,
                            ..
                        }
                        | TrayIconEvent::DoubleClick {
                            button: MouseButton::Left,
                            ..
                        } => {
                            let app = tray.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                let is_visible = window.is_visible().unwrap_or(false);
                                let is_minimized = window.is_minimized().unwrap_or(false);
                                if is_visible && !is_minimized {
                                    let _ = window.hide();
                                } else {
                                    let _ = window.show();
                                    let _ = window.unminimize();
                                    let _ = window.set_focus();
                                }
                            }
                        }
                        _ => {}
                    }
                });

            if let Some(icon) = app.default_window_icon() {
                builder = builder.icon(icon.clone());
            }

            let _tray = builder.build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Vault Commands
            get_vault_state,
            initialize_vault,
            unlock_vault,
            lock_vault,
            change_master_password,
            reset_vault,
            // Project Commands
            list_projects,
            create_project,
            update_project,
            delete_project,
            // EnvDocument Commands
            list_env_documents,
            read_env_document,
            create_env_document,
            update_env_document,
            rename_env_document,
            delete_env_document,
            // Import Commands
            import_env_file,
            import_env_files,
            import_directory_env_files,
            import_batch_raw_documents,
            // Export Commands
            export_env_document,
            export_multiple_env_documents,
            export_project_env_documents,
            export_all_projects,
            export_merged_project_env,
            start_virtual_file_drag,
            // Backup Commands
            create_backup,
            inspect_backup,
            restore_backup,
            // Settings Commands
            get_settings,
            update_settings,
            // Window Commands
            hide_to_tray,
            show_from_tray,
            exit_application,
        ])
        .run(tauri::generate_context!())
        .expect("Env Vault başlatılırken beklenmeyen bir hata oluştu");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resolve_app_data_dir() {
        let path = resolve_app_data_dir();
        assert!(path.to_string_lossy().contains("EnvVault"));
    }
}
