use std::path::Path;

use crate::error::{AppError, AppResult};

#[cfg(windows)]
pub mod windows;

pub mod system;

/// Opens a filesystem path with the operating system's default handler.
/// Only absolute, existing paths are accepted so a compromised frontend cannot
/// turn this command into an arbitrary command execution primitive.
pub fn open_path(path: &Path) -> AppResult<()> {
    if !path.is_absolute() || !path.exists() {
        return Err(AppError::Custom("OPEN_PATH_INVALID".into()));
    }

    #[cfg(windows)]
    {
        use ::windows::core::{HSTRING, PCWSTR};
        use ::windows::Win32::UI::Shell::ShellExecuteW;
        use ::windows::Win32::UI::WindowsAndMessaging::SHOW_WINDOW_CMD;

        let operation = HSTRING::from("open");
        let target = HSTRING::from(path.as_os_str());
        unsafe {
            let result = ShellExecuteW(
                None,
                PCWSTR(operation.as_ptr()),
                PCWSTR(target.as_ptr()),
                PCWSTR::null(),
                PCWSTR::null(),
                SHOW_WINDOW_CMD(1),
            );
            if (result.0 as isize) <= 32 {
                return Err(AppError::Custom("OPEN_PATH_FAILED".into()));
            }
        }
        return Ok(());
    }

    #[cfg(not(windows))]
    {
        std::process::Command::new("xdg-open")
            .arg(path)
            .spawn()
            .map_err(|_| AppError::Custom("OPEN_PATH_FAILED".into()))?;
        Ok(())
    }
}
