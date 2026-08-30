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
