pub mod ai;
pub mod backup;
pub mod bridge;
pub mod cloud;
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
use crate::bridge::BridgeState;
use crate::cloud::sync::CloudService;
use crate::commands::*;
use crate::export::service::ExportService;
use crate::import::service::ImportService;
use crate::platform::system;
use crate::settings::service::SettingsService;
use crate::vault::repository::EncryptedFileRepository;
use crate::vault::service::VaultService;

use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Emitter, Manager, RunEvent, WindowEvent};

pub fn resolve_app_data_dir() -> PathBuf {
    dirs::data_local_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("EnvVault")
}

fn launched_minimized() -> bool {
    std::env::args().any(|arg| arg == "--minimized")
}

/// Routes jump list and shortcut arguments into the running shell.
fn dispatch_launch_args(app: &tauri::AppHandle, args: &[String]) {
    for arg in args {
        match arg.as_str() {
            "--settings" => {
                let _ = app.emit("navigate-settings", ());
            }
            "--new-project" => {
                let _ = app.emit("navigate-new-project", ());
            }
            "--lock" => {
                let vault = app.state::<Arc<VaultService>>();
                vault.lock_vault();
                let _ = app.emit("lock-vault", ());
            }
            _ => {}
        }
    }
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
    let cloud_service = Arc::new(CloudService::new(
        app_data_dir.clone(),
        vault_service.clone(),
        settings_service.clone(),
    ));
    let bridge_state = Arc::new(BridgeState::new(app_data_dir.clone()));
    let bridge_for_setup = bridge_state.clone();
    let vault_for_bridge = vault_service.clone();

    // Synchronize auto lock duration from stored settings
    let initial_settings = settings_service.get_settings();
    vault_service.set_auto_lock_duration(initial_settings.auto_lock_minutes);

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    if event.state == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(),
        )
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
            dispatch_launch_args(app, &args);
        }))
        .manage(vault_service)
        .manage(import_service)
        .manage(export_service)
        .manage(backup_service)
        .manage(settings_service)
        .manage(cloud_service)
        .manage(bridge_state)
        .setup(move |app| {
            let show_i = MenuItem::with_id(app, "show", "Show Env Vault", true, None::<&str>)?;
            let settings_i = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
            let lock_i = MenuItem::with_id(app, "lock", "Lock Vault", true, None::<&str>)?;
            let sync_i = MenuItem::with_id(app, "sync", "Sync Now", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(
                app,
                &[&show_i, &settings_i, &lock_i, &sync_i, &quit_i],
            )?;

            let mut builder = TrayIconBuilder::with_id("main-tray")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .tooltip("Env Vault");

            if let Some(icon) = app.default_window_icon() {
                builder = builder.icon(icon.clone());
            }

            let _tray = builder
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                    }
                    "settings" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                        let _ = app.emit("navigate-settings", ());
                    }
                    "lock" => {
                        let vault_service = app.state::<Arc<VaultService>>();
                        vault_service.lock_vault();
                        let _ = app.emit("lock-vault", ());
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                    }
                    "sync" => {
                        let cloud = app.state::<Arc<CloudService>>();
                        let _ = cloud.sync_now();
                    }
                    "quit" => {
                        let cloud = app.state::<Arc<CloudService>>();
                        let _ = cloud.sync_now();
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| match event {
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
                })
                .build(app)?;

            // Apply the persisted icon pack on first paint.
            let app_data = resolve_app_data_dir();
            let theme = match initial_settings.icon_theme {
                crate::settings::models::IconTheme::Porcelain => "porcelain",
                crate::settings::models::IconTheme::Contrast => "contrast",
                crate::settings::models::IconTheme::Cyan => "cyan",
                _ => "obsidian",
            };
            if let Ok(path) = system::materialize_icon(&app_data, theme) {
                if let Ok(bytes) = std::fs::read(path) {
                    if let Ok(image) = tauri::image::Image::from_bytes(&bytes) {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.set_icon(image.clone());
                        }
                        if let Some(tray) = app.tray_by_id("main-tray") {
                            let _ = tray.set_icon(Some(image));
                        }
                    }
                }
            }

            if initial_settings.start_with_windows || initial_settings.global_shortcut_enabled {
                let _ = system::set_startup(
                    initial_settings.start_with_windows,
                    initial_settings.start_minimized,
                );
            }

            if initial_settings.global_shortcut_enabled {
                use tauri_plugin_global_shortcut::GlobalShortcutExt;
                if let Ok(shortcut) = crate::commands::system_commands::DEFAULT_SHORTCUT
                    .parse::<tauri_plugin_global_shortcut::Shortcut>()
                {
                    let _ = app.global_shortcut().register(shortcut);
                }
            }

            if launched_minimized() {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.hide();
                }
            }

            let _ = system::apply_jump_list(&app_data, theme);
            let startup_args: Vec<String> = std::env::args().collect();
            dispatch_launch_args(app.handle(), &startup_args);

            // The CLI is embedded so the on-disk copy always matches this build.
            let _ = crate::bridge::cli::materialize(&app_data);
            if initial_settings.dev_bridge_enabled {
                let _ = bridge_for_setup.start(vault_for_bridge.clone());
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                let settings_service = window.state::<Arc<SettingsService>>();
                let settings = settings_service.get_settings();
                match settings.close_action {
                    crate::settings::models::CloseAction::MinimizeToTray => {
                        api.prevent_close();
                        let _ = window.hide();
                    }
                    crate::settings::models::CloseAction::Ask => {
                        // Let the shell decide, so Alt+F4 follows the same rules
                        // as the custom close button.
                        api.prevent_close();
                        let _ = window.emit("close-requested", ());
                    }
                    crate::settings::models::CloseAction::CloseApp => {}
                }
            }
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
            delete_env_documents_batch,
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
            sync_setting_side_effects,
            // Window Commands
            hide_to_tray,
            show_from_tray,
            exit_application,
            open_external_url,
            // System Commands
            get_system_info,
            set_start_with_windows,
            apply_app_icon,
            set_global_shortcut,
            send_test_notification,
            show_main_window,
            // Cloud Commands
            cloud_status,
            cloud_providers,
            cloud_connect,
            cloud_disconnect,
            cloud_set_auto_sync,
            cloud_set_folder,
            cloud_sync_now,
            cloud_restore,
            cloud_detect_restore,
            cloud_open_folder,
            // Developer Commands
            dev_bridge_info,
            dev_bridge_start,
            dev_bridge_stop,
            open_terminal,
            dev_open_data_folder,
            // Local AI + webhooks
            ai_status,
            ai_generate,
            ai_pull,
            ai_delete,
            webhook_send,
        ])
        .build(tauri::generate_context!())
        .expect("Env Vault failed to start")
        .run(|app, event| {
            if let RunEvent::ExitRequested { .. } | RunEvent::Exit = event {
                let cloud = app.state::<Arc<CloudService>>();
                let _ = cloud.sync_now();
                let bridge = app.state::<Arc<BridgeState>>();
                bridge.stop();
            }
        });
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
