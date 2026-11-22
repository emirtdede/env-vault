use crate::error::{AppError, AppResult};
use tauri::{AppHandle, WebviewWindow};

#[tauri::command]
pub fn hide_to_tray(window: WebviewWindow) -> AppResult<()> {
    window.hide().map_err(|e| AppError::Custom(e.to_string()))?;
    Ok(())
}

#[tauri::command]
pub fn show_from_tray(window: WebviewWindow) -> AppResult<()> {
    window.show().map_err(|e| AppError::Custom(e.to_string()))?;
    window.unminimize().map_err(|e| AppError::Custom(e.to_string()))?;
    window.set_focus().map_err(|e| AppError::Custom(e.to_string()))?;
    Ok(())
}

#[tauri::command]
pub fn exit_application(app: AppHandle) {
    app.exit(0);
}

#[tauri::command]
pub fn open_external_url(url: String) -> AppResult<()> {
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return Err(AppError::Custom("Invalid or unsupported URL protocol".to_string()));
    }

    #[cfg(windows)]
    {
        use windows::core::{HSTRING, PCWSTR};
        use windows::Win32::UI::Shell::ShellExecuteW;
        use windows::Win32::UI::WindowsAndMessaging::SHOW_WINDOW_CMD;

        let op = HSTRING::from("open");
        let target = HSTRING::from(&url);

        unsafe {
            let res = ShellExecuteW(
                None,
                PCWSTR(op.as_ptr()),
                PCWSTR(target.as_ptr()),
                PCWSTR::null(),
                PCWSTR::null(),
                SHOW_WINDOW_CMD(1), // SW_SHOWNORMAL
            );
            if (res.0 as isize) <= 32 {
                return Err(AppError::Custom("The system browser could not be launched".to_string()));
            }
        }
    }

    #[cfg(not(windows))]
    {
        let _ = std::process::Command::new("xdg-open").arg(&url).spawn()
            .or_else(|_| std::process::Command::new("open").arg(&url).spawn())
            .map_err(|e| AppError::Custom(e.to_string()))?;
    }

    Ok(())
}
