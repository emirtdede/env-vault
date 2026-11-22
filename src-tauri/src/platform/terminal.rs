//! Opens a terminal window at a validated directory.

use std::path::PathBuf;

use crate::error::{AppError, AppResult};

/// Opens the preferred terminal emulator at `target`.
///
/// Only absolute directories are accepted, so the command cannot be used to
/// inject arbitrary shell commands from a compromised renderer.
pub fn open_terminal(target: Option<&str>) -> AppResult<()> {
    let directory = resolve_directory(target)?;

    #[cfg(windows)]
    {
        // Windows Terminal is the best experience when installed.
        if std::process::Command::new("wt.exe")
            .arg("-d")
            .arg(&directory)
            .spawn()
            .is_ok()
        {
            return Ok(());
        }

        let escaped = escape_powershell_literal(&directory.to_string_lossy());
        let powershell = std::process::Command::new("powershell.exe")
            .args(["-NoLogo", "-NoExit", "-Command"])
            .arg(format!("Set-Location -LiteralPath '{escaped}'"))
            .spawn();
        if powershell.is_ok() {
            return Ok(());
        }

        std::process::Command::new("cmd.exe")
            .arg("/K")
            .current_dir(&directory)
            .spawn()
            .map_err(|_| AppError::Custom("TERMINAL_OPEN_FAILED".into()))?;
        return Ok(());
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg("-a")
            .arg("Terminal")
            .arg(&directory)
            .spawn()
            .map_err(|_| AppError::Custom("TERMINAL_OPEN_FAILED".into()))?;
        return Ok(());
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        std::process::Command::new("x-terminal-emulator")
            .current_dir(&directory)
            .spawn()
            .map_err(|_| AppError::Custom("TERMINAL_OPEN_FAILED".into()))?;
        Ok(())
    }
}

fn resolve_directory(target: Option<&str>) -> AppResult<PathBuf> {
    let directory = match target.map(str::trim) {
        Some(value) if !value.is_empty() => PathBuf::from(value),
        _ => dirs::data_local_dir()
            .ok_or_else(|| AppError::Custom("TERMINAL_PATH_INVALID".into()))?
            .join("EnvVault"),
    };

    if !directory.is_absolute() {
        return Err(AppError::Custom("TERMINAL_PATH_INVALID".into()));
    }
    if !directory.exists() {
        std::fs::create_dir_all(&directory)?;
    }
    if !directory.is_dir() {
        return Err(AppError::Custom("TERMINAL_PATH_INVALID".into()));
    }
    Ok(directory)
}

fn escape_powershell_literal(value: &str) -> String {
    value.replace('\'', "''")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn escapes_single_quotes_for_powershell() {
        assert_eq!(escape_powershell_literal("C:\\Temp"), "C:\\Temp");
        assert_eq!(escape_powershell_literal("C:\\O'Brien"), "C:\\O''Brien");
    }

    #[test]
    fn rejects_relative_paths() {
        assert!(resolve_directory(Some("relative/folder")).is_err());
    }

    #[test]
    fn rejects_files() {
        let dir = tempfile::tempdir().expect("temp dir");
        let file = dir.path().join("note.txt");
        std::fs::write(&file, b"x").expect("write");
        assert!(resolve_directory(Some(&file.to_string_lossy())).is_err());
    }

    #[test]
    fn accepts_existing_directories() {
        let dir = tempfile::tempdir().expect("temp dir");
        let resolved = resolve_directory(Some(&dir.path().to_string_lossy())).expect("resolve");
        assert_eq!(resolved, dir.path());
    }
}
