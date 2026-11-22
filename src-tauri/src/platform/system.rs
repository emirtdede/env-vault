use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::Command;

use crate::error::{AppError, AppResult};

const RUN_KEY: &str = r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run";
const RUN_VALUE: &str = "EnvVault";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemInfo {
    pub app_version: String,
    pub os: String,
    pub arch: String,
    pub locale: String,
    pub vault_state: String,
}

pub fn system_info(vault_state: &str) -> SystemInfo {
    SystemInfo {
        app_version: env!("CARGO_PKG_VERSION").to_string(),
        os: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        locale: std::env::var("LANG")
            .or_else(|_| std::env::var("LC_ALL"))
            .unwrap_or_else(|_| "system".to_string()),
        vault_state: vault_state.to_string(),
    }
}

// --- startup ---------------------------------------------------------------

pub fn set_startup(enabled: bool, start_minimized: bool) -> AppResult<()> {
    #[cfg(windows)]
    {
        if enabled {
            let exe = std::env::current_exe()?;
            let value = if start_minimized {
                format!("\"{}\" --minimized", exe.display())
            } else {
                format!("\"{}\"", exe.display())
            };
            // `output` captures stdout and stderr so a missing key or a policy
            // block never prints a console error line on startup.
            let output = Command::new("reg")
                .args(["add", RUN_KEY, "/v", RUN_VALUE, "/t", "REG_SZ", "/d", &value, "/f"])
                .output()?;
            if !output.status.success() {
                return Err(AppError::Custom("STARTUP_REGISTRATION_FAILED".into()));
            }
        } else {
            // Removing a value that does not exist is an expected, silent no-op.
            let _ = Command::new("reg")
                .args(["delete", RUN_KEY, "/v", RUN_VALUE, "/f"])
                .output();
        }
        return Ok(());
    }

    #[cfg(not(windows))]
    {
        let _ = (enabled, start_minimized);
        Err(AppError::PlatformUnsupported)
    }
}

// --- icon packs ------------------------------------------------------------

pub const ICON_THEMES: [&str; 4] = ["obsidian", "porcelain", "contrast", "cyan"];

pub fn icon_bytes(theme: &str, extension: &str) -> AppResult<&'static [u8]> {
    let data = match (theme, extension) {
        ("obsidian", "png") => include_bytes!("../../assets/icons/icon-obsidian.png").as_slice(),
        ("obsidian", "ico") => include_bytes!("../../assets/icons/icon-obsidian.ico").as_slice(),
        ("porcelain", "png") => include_bytes!("../../assets/icons/icon-porcelain.png").as_slice(),
        ("porcelain", "ico") => include_bytes!("../../assets/icons/icon-porcelain.ico").as_slice(),
        ("contrast", "png") => include_bytes!("../../assets/icons/icon-contrast.png").as_slice(),
        ("contrast", "ico") => include_bytes!("../../assets/icons/icon-contrast.ico").as_slice(),
        ("cyan", "png") => include_bytes!("../../assets/icons/icon-cyan.png").as_slice(),
        ("cyan", "ico") => include_bytes!("../../assets/icons/icon-cyan.ico").as_slice(),
        _ => return Err(AppError::Custom("ICON_THEME_INVALID".into())),
    };
    Ok(data)
}

/// Materialises the selected icon pack in the application data directory and
/// returns the PNG path so the window and tray can be updated at runtime.
pub fn materialize_icon(app_data_dir: &Path, theme: &str) -> AppResult<PathBuf> {
    let dir = app_data_dir.join("icons");
    std::fs::create_dir_all(&dir)?;
    let png_path = dir.join(format!("icon-{theme}.png"));
    let ico_path = dir.join(format!("icon-{theme}.ico"));
    std::fs::write(&png_path, icon_bytes(theme, "png")?)?;
    std::fs::write(&ico_path, icon_bytes(theme, "ico")?)?;
    Ok(png_path)
}

pub fn update_shortcut_icon(app_data_dir: &Path, theme: &str) -> AppResult<()> {
    let icons_dir = app_data_dir.join("icons");
    let ico_path = icons_dir.join(format!("icon-{theme}.ico"));
    if !ico_path.exists() {
        std::fs::create_dir_all(&icons_dir)?;
        std::fs::write(&ico_path, icon_bytes(theme, "ico")?)?;
    }

    #[cfg(windows)]
    {
        let script_path = app_data_dir.join("update-shortcut-icon.ps1");
        let escaped = ico_path.to_string_lossy().replace('\'', "''");
        let script = format!(
            "$ErrorActionPreference = 'SilentlyContinue'\n\
             $icon = '{escaped}'\n\
             $targets = @(\n\
             (Join-Path ([Environment]::GetFolderPath('Desktop')) 'Env Vault.lnk'),\n\
             (Join-Path ([Environment]::GetFolderPath('Programs')) 'Env Vault.lnk'),\n\
             (Join-Path ([Environment]::GetFolderPath('Programs')) 'Vellium\\Env Vault.lnk')\n\
             )\n\
             foreach ($target in $targets) {{\n\
             if (Test-Path $target) {{\n\
             $shell = New-Object -ComObject WScript.Shell\n\
             $shortcut = $shell.CreateShortcut($target)\n\
             $shortcut.IconLocation = \"$icon,0\"\n\
             $shortcut.Save()\n\
             }}\n\
             }}\n"
        );
        std::fs::write(&script_path, script)?;
        let status = Command::new("powershell")
            .args([
                "-NoProfile",
                "-NonInteractive",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                &script_path.to_string_lossy(),
            ])
            .status();
        let _ = std::fs::remove_file(&script_path);
        if let Ok(status) = status {
            if !status.success() {
                return Err(AppError::Custom("SHORTCUT_ICON_FAILED".into()));
            }
        }
        return Ok(());
    }

    #[cfg(not(windows))]
    {
        let _ = (app_data_dir, theme);
        Ok(())
    }
}

#[cfg(windows)]
pub fn apply_jump_list(app_data_dir: &Path, theme: &str) -> AppResult<()> {
    use windows::core::{Interface, GUID, HSTRING, PROPVARIANT};
    use windows::Win32::System::Com::{
        CoCreateInstance, CoInitializeEx, CLSCTX_INPROC_SERVER, COINIT_APARTMENTTHREADED,
    };
    use windows::Win32::UI::Shell::Common::{IObjectArray, IObjectCollection};
    use windows::Win32::UI::Shell::PropertiesSystem::{IPropertyStore, PROPERTYKEY};
    use windows::Win32::UI::Shell::{ICustomDestinationList, IShellLinkW};

    // CLSIDs used by the Windows jump list API. The windows crate does not
    // generate these constants for the features we build against.
    const CLSID_DESTINATION_LIST: GUID = GUID::from_u128(0x77f10cf0_3db5_4966_b520_b7c54fd35ed6);
    const CLSID_ENUMERABLE_OBJECT_COLLECTION: GUID =
        GUID::from_u128(0x2d3468c1_36a7_43b6_ac24_d3f02fd9607a);
    const CLSID_SHELL_LINK: GUID = GUID::from_u128(0x00021401_0000_0000_c000_000000000046);
    const PKEY_TITLE: PROPERTYKEY = PROPERTYKEY {
        fmtid: GUID::from_u128(0xf29f85e0_4ff9_1068_ab91_08002b27b3d9),
        pid: 2,
    };

    let exe = std::env::current_exe()?;
    let exe = HSTRING::from(exe.to_string_lossy().to_string());
    let icons_dir = app_data_dir.join("icons");
    let ico_path = icons_dir.join(format!("icon-{theme}.ico"));
    if !ico_path.exists() {
        std::fs::create_dir_all(&icons_dir)?;
        std::fs::write(&ico_path, icon_bytes(theme, "ico")?)?;
    }
    let icon = HSTRING::from(ico_path.to_string_lossy().to_string());

    let tasks: [(&str, &str); 4] = [
        ("Open Env Vault", "--focus"),
        ("New Project", "--new-project"),
        ("Settings", "--settings"),
        ("Lock Vault", "--lock"),
    ];

    let result = (|| -> windows::core::Result<()> {
        unsafe {
            let _ = CoInitializeEx(None, COINIT_APARTMENTTHREADED);
            let list: ICustomDestinationList =
                CoCreateInstance(&CLSID_DESTINATION_LIST, None, CLSCTX_INPROC_SERVER)?;
            let collection: IObjectCollection = CoCreateInstance(
                &CLSID_ENUMERABLE_OBJECT_COLLECTION,
                None,
                CLSCTX_INPROC_SERVER,
            )?;

            for (title, arguments) in tasks {
                let link: IShellLinkW =
                    CoCreateInstance(&CLSID_SHELL_LINK, None, CLSCTX_INPROC_SERVER)?;
                link.SetPath(&exe)?;
                link.SetArguments(&HSTRING::from(arguments))?;
                link.SetIconLocation(&icon, 0)?;
                let property: IPropertyStore = link.cast()?;
                let value = PROPVARIANT::from(title);
                property.SetValue(&PKEY_TITLE, &value)?;
                property.Commit()?;
                collection.AddObject(&link)?;
            }

            let array: IObjectArray = collection.cast()?;
            let mut min_slots = 0u32;
            let _removed: IObjectArray = list.BeginList(&mut min_slots)?;
            list.AddUserTasks(&array)?;
            list.CommitList()?;
        }
        Ok(())
    })();

    result.map_err(|error| AppError::Custom(format!("JUMP_LIST_FAILED: {error}")))
}

#[cfg(not(windows))]
pub fn apply_jump_list(app_data_dir: &Path, theme: &str) -> AppResult<()> {
    let _ = (app_data_dir, theme);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_icon_assets_are_embedded() {
        for theme in ICON_THEMES {
            assert!(icon_bytes(theme, "png").unwrap().len() > 1000);
            assert!(icon_bytes(theme, "ico").unwrap().len() > 1000);
        }
        assert!(icon_bytes("unknown", "png").is_err());
    }

    #[test]
    fn test_system_info_reports_version() {
        let info = system_info("locked");
        assert_eq!(info.app_version, env!("CARGO_PKG_VERSION"));
        assert_eq!(info.vault_state, "locked");
    }
}
