//! Ships the dependency-free CLI and MCP server alongside the application.
//!
//! The script is embedded in the binary so the file on disk always matches the
//! running Env Vault version, even after an update.

use std::path::{Path, PathBuf};

use crate::error::{AppError, AppResult};

const CLI_SCRIPT: &str = include_str!("../../../cli/envvault.mjs");
const CLI_DIRECTORY: &str = "cli";
const CLI_FILE: &str = "envvault.mjs";

pub fn script_path(data_dir: &Path) -> PathBuf {
    data_dir.join(CLI_DIRECTORY).join(CLI_FILE)
}

/// Writes the CLI to the app data directory when it is missing or stale.
pub fn materialize(data_dir: &Path) -> AppResult<PathBuf> {
    let directory = data_dir.join(CLI_DIRECTORY);
    std::fs::create_dir_all(&directory)?;
    let target = directory.join(CLI_FILE);

    let up_to_date = std::fs::read_to_string(&target)
        .map(|existing| existing == CLI_SCRIPT)
        .unwrap_or(false);

    if !up_to_date {
        let temporary = directory.join(format!("{CLI_FILE}.tmp"));
        std::fs::write(&temporary, CLI_SCRIPT)?;
        if std::fs::rename(&temporary, &target).is_err() {
            let _ = std::fs::remove_file(&target);
            std::fs::rename(&temporary, &target)
                .map_err(|_| AppError::Custom("CLI_WRITE_FAILED".into()))?;
        }
    }

    Ok(target)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn writes_the_cli_and_is_idempotent() {
        let dir = tempfile::tempdir().expect("temp dir");
        let path = materialize(dir.path()).expect("materialize");
        assert!(path.is_file());
        let content = std::fs::read_to_string(&path).expect("read");
        assert!(content.contains("envvault"));
        assert!(content.contains("tools/call"));

        let again = materialize(dir.path()).expect("second materialize");
        assert_eq!(path, again);
    }

    #[test]
    fn script_path_stays_inside_the_data_directory() {
        let path = script_path(Path::new("root"));
        assert!(path.ends_with("cli/envvault.mjs") || path.ends_with("cli\\envvault.mjs"));
    }
}
