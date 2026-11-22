use crate::error::{AppError, AppResult};

const WINDOWS_RESERVED_NAMES: &[&str] = &[
    "CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8",
    "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
];

/// Validates an env filename.
/// Must start with `.env` (or be `.env`), must not contain path traversal (`..`, `/`, `\`),
/// and must not be a Windows reserved name.
pub fn validate_env_filename(filename: &str) -> AppResult<()> {
    let trimmed = filename.trim();
    if trimmed.is_empty() {
        return Err(AppError::InvalidEnvFile);
    }

    if trimmed.contains('/') || trimmed.contains('\\') || trimmed.contains("..") {
        return Err(AppError::Custom(
            "File names cannot contain path separators or traversal characters.".to_string(),
        ));
    }

    if !trimmed.starts_with(".env") {
        return Err(AppError::Custom(
            "Environment file name must start with '.env'.".to_string(),
        ));
    }

    let upper = trimmed.to_uppercase();
    for reserved in WINDOWS_RESERVED_NAMES {
        if upper == *reserved || upper.starts_with(&format!("{}.", reserved)) {
            return Err(AppError::Custom(format!(
                "'{}' is a reserved Windows file name.",
                trimmed
            )));
        }
    }

    Ok(())
}

/// Discovers variable keys from raw .env text for UI preview badges and cards.
/// Never executes shell commands, never expands variables, and never injects into environment.
pub fn extract_env_keys(raw_text: &str) -> Vec<String> {
    let mut keys = Vec::new();

    for line in raw_text.lines() {
        let trimmed = line.trim();

        // Skip comments and blank lines
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }

        // Handle `export KEY=VALUE` prefix if present
        let content = if trimmed.starts_with("export ") {
            trimmed.trim_start_matches("export ").trim()
        } else {
            trimmed
        };

        if let Some((key_part, _)) = content.split_once('=') {
            let key = key_part.trim();
            if !key.is_empty() && is_valid_identifier(key) && !keys.contains(&key.to_string()) {
                keys.push(key.to_string());
            }
        }
    }

    keys
}

fn is_valid_identifier(s: &str) -> bool {
    s.chars()
        .all(|c| c.is_alphanumeric() || c == '_' || c == '.' || c == '-')
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_filename() {
        assert!(validate_env_filename(".env").is_ok());
        assert!(validate_env_filename(".env.local").is_ok());
        assert!(validate_env_filename(".env.production").is_ok());
        assert!(validate_env_filename(".env.staging.backend").is_ok());

        assert!(validate_env_filename("config.txt").is_err());
        assert!(validate_env_filename("../.env").is_err());
        assert!(validate_env_filename("sub/.env").is_err());
        assert!(validate_env_filename("sub\\.env").is_err());
    }

    #[test]
    fn test_extract_keys() {
        let raw = r#"
# Database Configuration
DATABASE_URL="postgres://user:pass@localhost:5432/main"
export API_KEY=secret_token_123

# Disabled
# OLD_SECRET=999

EMPTY_VAL=
PORT=3000
"#;
        let keys = extract_env_keys(raw);
        assert_eq!(keys, vec!["DATABASE_URL", "API_KEY", "EMPTY_VAL", "PORT"]);
    }
}
