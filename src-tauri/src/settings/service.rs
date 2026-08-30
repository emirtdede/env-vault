use crate::error::{AppError, AppResult};
use crate::settings::models::AppSettings;
use std::fs;
use std::path::{Path, PathBuf};

pub struct SettingsService {
    settings_path: PathBuf,
}

impl SettingsService {
    pub fn new(app_data_dir: &Path) -> Self {
        Self {
            settings_path: app_data_dir.join("settings.json"),
        }
    }

    pub fn get_settings(&self) -> AppSettings {
        if !self.settings_path.exists() {
            return AppSettings::default();
        }

        match fs::read_to_string(&self.settings_path) {
            Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
            Err(_) => AppSettings::default(),
        }
    }

    pub fn save_settings(&self, settings: &AppSettings) -> AppResult<()> {
        if let Some(parent) = self.settings_path.parent() {
            fs::create_dir_all(parent).map_err(|_| AppError::SettingsWriteFailed)?;
        }

        let json =
            serde_json::to_string_pretty(settings).map_err(|_| AppError::SettingsWriteFailed)?;

        fs::write(&self.settings_path, json).map_err(|_| AppError::SettingsWriteFailed)?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_settings_save_and_load() {
        let dir = tempdir().unwrap();
        let service = SettingsService::new(dir.path());

        let mut settings = service.get_settings();
        assert_eq!(settings.auto_lock_minutes, 15);

        settings.auto_lock_minutes = 30;
        service.save_settings(&settings).unwrap();

        let loaded = service.get_settings();
        assert_eq!(loaded.auto_lock_minutes, 30);
    }
}
