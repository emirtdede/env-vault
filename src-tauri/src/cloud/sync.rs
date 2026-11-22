use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use crate::error::{AppError, AppResult};
use crate::settings::models::AppSettings;
use crate::settings::service::SettingsService;
use crate::vault::repository::{EncryptedFileRepository, VaultRepository, VAULT_FILE_NAME};
use crate::vault::service::VaultService;

pub const CLOUD_DIR_NAME: &str = "EnvVault";
pub const SYNC_FILE_NAME: &str = "env-vault-cloud-sync.json";
pub const PREVIOUS_FILE_NAME: &str = "env-vault-cloud-previous.json";
pub const BACKUP_PREFIX: &str = "env-vault-cloud-backup-";
pub const MAX_BACKUP_DAYS: usize = 15;
pub const SNAPSHOT_FORMAT_VERSION: u32 = 1;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CloudConfig {
    pub provider: String,
    pub folder: Option<String>,
    pub auto_sync: bool,
    pub last_sync: Option<String>,
}

impl Default for CloudConfig {
    fn default() -> Self {
        Self {
            provider: "none".to_string(),
            folder: None,
            auto_sync: true,
            last_sync: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CloudProvider {
    pub id: String,
    pub path: String,
    pub available: bool,
    pub is_default: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SnapshotSummary {
    pub projects: usize,
    pub documents: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CloudStatus {
    pub provider: String,
    pub folder: Option<String>,
    pub cloud_dir: Option<String>,
    pub connected: bool,
    pub auto_sync: bool,
    pub last_sync: Option<String>,
    pub backup_files: usize,
    pub summary: Option<SnapshotSummary>,
    pub provider_available: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RestoreProposal {
    pub found: bool,
    pub cloud_dir: String,
    pub exported_at: Option<String>,
    pub summary: Option<SnapshotSummary>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SnapshotVault {
    file_name: String,
    base64: String,
    bytes: usize,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SnapshotFile {
    app: String,
    format_version: u32,
    version: String,
    provider: String,
    exported_at: String,
    settings: AppSettings,
    summary: SnapshotSummary,
    vault: Option<SnapshotVault>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncOutcome {
    pub written: bool,
    pub skipped_empty: bool,
    pub exported_at: String,
    pub backup_files: usize,
    pub summary: SnapshotSummary,
}

pub struct CloudService {
    app_data_dir: PathBuf,
    config_path: PathBuf,
    vault_service: Arc<VaultService>,
    settings_service: Arc<SettingsService>,
}

impl CloudService {
    pub fn new(
        app_data_dir: PathBuf,
        vault_service: Arc<VaultService>,
        settings_service: Arc<SettingsService>,
    ) -> Self {
        let config_path = app_data_dir.join("cloud-sync.json");
        Self {
            app_data_dir,
            config_path,
            vault_service,
            settings_service,
        }
    }

    // --- configuration -----------------------------------------------------

    pub fn config(&self) -> CloudConfig {
        if !self.config_path.exists() {
            return CloudConfig::default();
        }
        fs::read_to_string(&self.config_path)
            .ok()
            .and_then(|raw| serde_json::from_str(&raw).ok())
            .unwrap_or_default()
    }

    fn save_config(&self, config: &CloudConfig) -> AppResult<()> {
        if let Some(parent) = self.config_path.parent() {
            fs::create_dir_all(parent)?;
        }
        let json = serde_json::to_string_pretty(config)
            .map_err(|_| AppError::SettingsWriteFailed)?;
        atomic_write(&self.app_data_dir, &self.config_path, json.as_bytes())
    }

    // --- provider detection ------------------------------------------------

    pub fn providers(&self) -> Vec<CloudProvider> {
        let mut result = Vec::new();
        let mut push = |id: &str, path: Option<PathBuf>| {
            if let Some(path) = path {
                let available = path.exists();
                if available {
                    result.push(CloudProvider {
                        id: id.to_string(),
                        path: path.to_string_lossy().to_string(),
                        available,
                        is_default: result.is_empty(),
                    });
                }
            }
        };

        push("onedrive", detect_onedrive());
        push("google-drive", detect_google_drive());
        push("dropbox", detect_dropbox());
        push("icloud", detect_icloud());
        push("yandex", detect_yandex());
        push("nextcloud", detect_nextcloud());
        result
    }

    pub fn default_folder(&self) -> PathBuf {
        self.app_data_dir.join("cloud-backup")
    }

    fn cloud_dir(config: &CloudConfig) -> PathBuf {
        let base = config
            .folder
            .as_ref()
            .map(PathBuf::from)
            .unwrap_or_default();
        if base.file_name().map(|name| name == CLOUD_DIR_NAME).unwrap_or(false) {
            base
        } else {
            base.join(CLOUD_DIR_NAME)
        }
    }

    fn active_cloud_dir(&self) -> Option<PathBuf> {
        let config = self.config();
        if config.folder.is_none() {
            return None;
        }
        Some(Self::cloud_dir(&config))
    }

    // --- public operations -------------------------------------------------

    pub fn status(&self) -> CloudStatus {
        let config = self.config();
        let providers = self.providers();
        let cloud_dir = self.active_cloud_dir();
        let connected = config.folder.is_some() && cloud_dir.is_some();
        let provider_available = providers
            .iter()
            .any(|provider| provider.id == config.provider);

        let snapshot = cloud_dir
            .as_ref()
            .and_then(|dir| read_snapshot(dir).ok());

        CloudStatus {
            provider: config.provider.clone(),
            folder: config.folder.clone(),
            cloud_dir: cloud_dir.as_ref().map(|dir| dir.to_string_lossy().to_string()),
            connected,
            auto_sync: config.auto_sync,
            last_sync: config.last_sync.clone(),
            backup_files: cloud_dir
                .as_ref()
                .map(|dir| backup_files(dir).len())
                .unwrap_or(0),
            summary: snapshot.as_ref().map(|snapshot| SnapshotSummary {
                projects: snapshot.summary.projects,
                documents: snapshot.summary.documents,
            }),
            provider_available,
        }
    }

    pub fn connect(&self, provider: &str, folder: Option<String>) -> AppResult<CloudStatus> {
        let base = match folder {
            Some(path) if !path.trim().is_empty() => validate_folder(Path::new(&path))?,
            _ => {
                let detected = match provider {
                    "onedrive" => detect_onedrive(),
                    "google-drive" => detect_google_drive(),
                    "dropbox" => detect_dropbox(),
                    "icloud" => detect_icloud(),
                    "yandex" => detect_yandex(),
                    "nextcloud" => detect_nextcloud(),
                    _ => None,
                };
                detected.ok_or_else(|| AppError::Custom("CLOUD_PROVIDER_UNAVAILABLE".into()))?
            }
        };

        let mut config = self.config();
        config.provider = provider.to_string();
        config.folder = Some(base.to_string_lossy().to_string());
        let cloud_dir = Self::cloud_dir(&config);
        fs::create_dir_all(&cloud_dir)?;

        // Format / clean install recovery: never overwrite a filled cloud copy
        // with an empty local vault.
        let cloud_snapshot = read_snapshot(&cloud_dir).ok();
        let local_initialized = EncryptedFileRepository::new(self.app_data_dir.clone()).is_initialized();

        if !local_initialized {
            if let Some(snapshot) = cloud_snapshot.filter(|snapshot| snapshot.summary.projects > 0) {
                self.restore_snapshot(&snapshot)?;
            }
        } else {
            self.save_config(&config)?;
            let _ = self.sync_now_with(&mut config)?;
            return Ok(self.status());
        }

        self.save_config(&config)?;
        Ok(self.status())
    }

    pub fn disconnect(&self) -> AppResult<CloudStatus> {
        let mut config = self.config();
        config.provider = "none".into();
        config.folder = None;
        config.last_sync = None;
        self.save_config(&config)?;
        Ok(self.status())
    }

    pub fn set_auto_sync(&self, enabled: bool) -> AppResult<CloudStatus> {
        let mut config = self.config();
        config.auto_sync = enabled;
        self.save_config(&config)?;
        Ok(self.status())
    }

    pub fn set_folder(&self, folder: String) -> AppResult<CloudStatus> {
        let base = validate_folder(Path::new(&folder))?;
        let mut config = self.config();
        config.folder = Some(base.to_string_lossy().to_string());
        if config.provider == "none" {
            config.provider = "custom".into();
        }
        let cloud_dir = Self::cloud_dir(&config);
        fs::create_dir_all(&cloud_dir)?;
        self.save_config(&config)?;
        Ok(self.status())
    }

    pub fn sync_now(&self) -> AppResult<SyncOutcome> {
        let mut config = self.config();
        if config.folder.is_none() {
            return Err(AppError::Custom("CLOUD_NOT_CONFIGURED".into()));
        }
        self.sync_now_with(&mut config)
    }

    fn sync_now_with(&self, config: &mut CloudConfig) -> AppResult<SyncOutcome> {
        let cloud_dir = Self::cloud_dir(config);
        fs::create_dir_all(&cloud_dir)?;

        let existing = read_snapshot(&cloud_dir).ok();
        let local_initialized = EncryptedFileRepository::new(self.app_data_dir.clone()).is_initialized();
        if !local_initialized {
            if let Some(snapshot) = existing.as_ref() {
                if snapshot.summary.projects > 0 {
                    return Ok(SyncOutcome {
                        written: false,
                        skipped_empty: true,
                        exported_at: snapshot.exported_at.clone(),
                        backup_files: backup_files(&cloud_dir).len(),
                        summary: SnapshotSummary {
                            projects: 0,
                            documents: 0,
                        },
                    });
                }
            }
            return Err(AppError::Custom("VAULT_NOT_INITIALIZED".into()));
        }

        let (projects, documents) = self
            .vault_service
            .snapshot_summary()
            .unwrap_or((usize::MAX, usize::MAX));

        // Empty-data guard: a freshly formatted machine must never erase a
        // filled cloud snapshot.
        if projects == 0 && documents == 0 {
            if let Some(snapshot) = existing.as_ref() {
                if snapshot.summary.projects > 0 {
                    return Ok(SyncOutcome {
                        written: false,
                        skipped_empty: true,
                        exported_at: snapshot.exported_at.clone(),
                        backup_files: backup_files(&cloud_dir).len(),
                        summary: snapshot.summary.clone(),
                    });
                }
            }
        }

        let vault_path = self.app_data_dir.join(VAULT_FILE_NAME);
        let vault = if vault_path.exists() {
            let bytes = fs::read(&vault_path)?;
            Some(SnapshotVault {
                file_name: VAULT_FILE_NAME.to_string(),
                base64: base64_encode(&bytes),
                bytes: bytes.len(),
            })
        } else {
            None
        };

        let settings = self.settings_service.get_settings();
        let exported_at = chrono::Utc::now().to_rfc3339();
        let summary = if projects == usize::MAX {
            existing
                .as_ref()
                .map(|snapshot| snapshot.summary.clone())
                .unwrap_or(SnapshotSummary {
                    projects: 0,
                    documents: 0,
                })
        } else {
            SnapshotSummary {
                projects,
                documents,
            }
        };

        let snapshot = SnapshotFile {
            app: "Env Vault".into(),
            format_version: SNAPSHOT_FORMAT_VERSION,
            version: env!("CARGO_PKG_VERSION").to_string(),
            provider: config.provider.clone(),
            exported_at: exported_at.clone(),
            settings,
            summary: summary.clone(),
            vault,
        };

        let payload = serde_json::to_vec_pretty(&snapshot)
            .map_err(|_| AppError::Custom("CLOUD_SERIALIZE_FAILED".into()))?;

        // Rotate: current becomes previous before the new write.
        let current_path = cloud_dir.join(SYNC_FILE_NAME);
        if current_path.exists() {
            if let Ok(valid) = read_snapshot(&cloud_dir) {
                if let Ok(bytes) = serde_json::to_vec_pretty(&valid) {
                    atomic_write(&cloud_dir, &cloud_dir.join(PREVIOUS_FILE_NAME), &bytes)?;
                }
            }
        }

        atomic_write(&cloud_dir, &current_path, &payload)?;

        let day = chrono::Local::now().format("%Y-%m-%d").to_string();
        let backup_path = cloud_dir.join(format!("{BACKUP_PREFIX}{day}.json"));
        atomic_write(&cloud_dir, &backup_path, &payload)?;
        prune_backups(&cloud_dir, MAX_BACKUP_DAYS);

        config.last_sync = Some(exported_at.clone());
        self.save_config(config)?;

        Ok(SyncOutcome {
            written: true,
            skipped_empty: false,
            exported_at,
            backup_files: backup_files(&cloud_dir).len(),
            summary,
        })
    }

    pub fn restore(&self) -> AppResult<CloudStatus> {
        let cloud_dir = self
            .active_cloud_dir()
            .ok_or_else(|| AppError::Custom("CLOUD_NOT_CONFIGURED".into()))?;
        let snapshot = read_snapshot(&cloud_dir)?;
        self.restore_snapshot(&snapshot)?;
        Ok(self.status())
    }

    fn restore_snapshot(&self, snapshot: &SnapshotFile) -> AppResult<()> {
        if let Some(vault) = &snapshot.vault {
            let bytes = base64_decode(&vault.base64)
                .ok_or_else(|| AppError::Custom("CLOUD_SNAPSHOT_INVALID".into()))?;
            let target = self.app_data_dir.join(VAULT_FILE_NAME);
            if target.exists() {
                let local_backup = self
                    .app_data_dir
                    .join(format!("vault-before-restore-{}.evault", chrono::Utc::now().timestamp()));
                let _ = fs::copy(&target, local_backup);
            }
            atomic_write(&self.app_data_dir, &target, &bytes)?;
        }

        // Restore preferences but never let cloud credentials point at a stale folder.
        let mut settings = snapshot.settings.clone();
        let current = self.settings_service.get_settings();
        settings.language = if settings.language.trim().is_empty() {
            current.language
        } else {
            settings.language
        };
        let mut config = self.config();
        config.last_sync = Some(chrono::Utc::now().to_rfc3339());
        self.settings_service.save_settings(&settings)?;
        self.save_config(&config)?;
        Ok(())
    }

    pub fn detect_restore(&self) -> RestoreProposal {
        let _config = self.config();
        let cloud_dir = match Self::active_cloud_dir_for(&_config) {
            Some(dir) => dir,
            None => {
                let fallback = Self::default_cloud_dir(&self.default_folder());
                fallback
            }
        };
        let snapshot = read_snapshot(&cloud_dir).ok();
        let local_initialized = EncryptedFileRepository::new(self.app_data_dir.clone()).is_initialized();
        let found = !local_initialized
            && snapshot
                .as_ref()
                .map(|item| item.vault.is_some())
                .unwrap_or(false);

        RestoreProposal {
            found,
            cloud_dir: cloud_dir.to_string_lossy().to_string(),
            exported_at: snapshot.map(|item| item.exported_at),
            summary: read_snapshot(&cloud_dir).ok().map(|item| item.summary),
        }
    }

    fn active_cloud_dir_for(config: &CloudConfig) -> Option<PathBuf> {
        config.folder.as_ref().map(|_| Self::cloud_dir(config))
    }

    fn default_cloud_dir(base: &Path) -> PathBuf {
        base.join(CLOUD_DIR_NAME)
    }

    pub fn open_folder(&self) -> AppResult<String> {
        let dir = match self.active_cloud_dir() {
            Some(dir) => dir,
            None => Self::default_cloud_dir(&self.default_folder()),
        };
        fs::create_dir_all(&dir)?;
        let validated = validate_folder(&dir)?;
        crate::platform::open_path(&validated)?;
        Ok(validated.to_string_lossy().to_string())
    }
}

// --- helpers ---------------------------------------------------------------

fn home_dir() -> Option<PathBuf> {
    std::env::var_os("USERPROFILE")
        .map(PathBuf::from)
        .or_else(|| dirs::home_dir())
}

fn detect_onedrive() -> Option<PathBuf> {
    for key in ["OneDriveConsumer", "OneDrive", "OneDriveCommercial"] {
        if let Some(value) = std::env::var_os(key) {
            let path = PathBuf::from(value);
            if path.is_dir() {
                return Some(path);
            }
        }
    }
    home_dir().map(|home| home.join("OneDrive")).filter(|path| path.is_dir())
}

fn detect_google_drive() -> Option<PathBuf> {
    let home = home_dir()?;
    ["Google Drive", "GoogleDrive", "My Drive"]
        .iter()
        .map(|name| home.join(name))
        .find(|path| path.is_dir())
}

fn detect_dropbox() -> Option<PathBuf> {
    if let Some(value) = std::env::var_os("Dropbox") {
        let path = PathBuf::from(value);
        if path.is_dir() {
            return Some(path);
        }
    }
    home_dir().map(|home| home.join("Dropbox")).filter(|path| path.is_dir())
}

fn detect_icloud() -> Option<PathBuf> {
    if let Some(value) = std::env::var_os("iCloudDrive") {
        let path = PathBuf::from(value);
        if path.is_dir() {
            return Some(path);
        }
    }
    home_dir().map(|home| home.join("iCloudDrive")).filter(|path| path.is_dir())
}

fn detect_yandex() -> Option<PathBuf> {
    home_dir()
        .map(|home| home.join("Yandex.Disk"))
        .filter(|path| path.is_dir())
}

fn detect_nextcloud() -> Option<PathBuf> {
    if let Some(value) = std::env::var_os("Nextcloud") {
        let path = PathBuf::from(value);
        if path.is_dir() {
            return Some(path);
        }
    }
    home_dir().map(|home| home.join("Nextcloud")).filter(|path| path.is_dir())
}

fn validate_folder(path: &Path) -> AppResult<PathBuf> {
    if path.as_os_str().is_empty() {
        return Err(AppError::Custom("CLOUD_FOLDER_INVALID".into()));
    }
    fs::create_dir_all(path)?;
    let canonical = fs::canonicalize(path)?;
    if canonical.to_string_lossy().contains("..") {
        return Err(AppError::Custom("CLOUD_FOLDER_INVALID".into()));
    }
    Ok(canonical)
}

fn backup_files(dir: &Path) -> Vec<PathBuf> {
    let mut entries: Vec<PathBuf> = fs::read_dir(dir)
        .map(|read| {
            read.filter_map(|entry| entry.ok())
                .map(|entry| entry.path())
                .filter(|path| {
                    path.file_name()
                        .and_then(|name| name.to_str())
                        .map(|name| name.starts_with(BACKUP_PREFIX) && name.ends_with(".json"))
                        .unwrap_or(false)
                })
                .collect()
        })
        .unwrap_or_default();
    entries.sort();
    entries
}

fn prune_backups(dir: &Path, keep: usize) {
    let entries = backup_files(dir);
    if entries.len() <= keep {
        return;
    }
    for path in &entries[..entries.len() - keep] {
        let _ = fs::remove_file(path);
    }
}

fn read_snapshot(dir: &Path) -> AppResult<SnapshotFile> {
    let mut candidates = vec![dir.join(SYNC_FILE_NAME), dir.join(PREVIOUS_FILE_NAME)];

    let mut backups = backup_files(dir);
    backups.reverse();
    candidates.extend(backups);

    for candidate in candidates {
        if !candidate.exists() {
            continue;
        }
        let Ok(raw) = fs::read_to_string(&candidate) else {
            continue;
        };
        if let Ok(snapshot) = serde_json::from_str::<SnapshotFile>(&raw) {
            if snapshot.format_version <= SNAPSHOT_FORMAT_VERSION && snapshot.app == "Env Vault" {
                return Ok(snapshot);
            }
        }
    }
    Err(AppError::Custom("CLOUD_SNAPSHOT_MISSING".into()))
}

fn atomic_write(dir: &Path, target: &Path, bytes: &[u8]) -> AppResult<()> {
    fs::create_dir_all(dir)?;
    let temp = dir.join(format!(".tmp-{}", std::process::id()));
    fs::write(&temp, bytes)?;

    for attempt in 0..4 {
        if replace_file(&temp, target).is_ok() {
            return Ok(());
        }
        match fs::copy(&temp, target) {
            Ok(_) => {
                let _ = fs::remove_file(&temp);
                return Ok(());
            }
            Err(_) if attempt < 3 => {
                std::thread::sleep(std::time::Duration::from_millis(120 * (attempt + 1) as u64));
            }
            Err(error) => {
                let _ = fs::remove_file(&temp);
                return Err(AppError::Custom(format!("CLOUD_WRITE_FAILED: {}", error.kind())));
            }
        }
    }
    let _ = fs::remove_file(&temp);
    Err(AppError::Custom("CLOUD_WRITE_FAILED".into()))
}

#[cfg(windows)]
fn replace_file(source: &Path, target: &Path) -> std::io::Result<()> {
    use std::os::windows::ffi::OsStrExt;
    use windows::core::PCWSTR;
    use windows::Win32::Storage::FileSystem::{MoveFileExW, MOVEFILE_REPLACE_EXISTING};

    let source_wide: Vec<u16> = source.as_os_str().encode_wide().chain(std::iter::once(0)).collect();
    let target_wide: Vec<u16> = target.as_os_str().encode_wide().chain(std::iter::once(0)).collect();
    unsafe {
        MoveFileExW(
            PCWSTR(source_wide.as_ptr()),
            PCWSTR(target_wide.as_ptr()),
            MOVEFILE_REPLACE_EXISTING,
        )
        .map_err(|error| std::io::Error::other(error.message()))
    }
}

#[cfg(not(windows))]
fn replace_file(source: &Path, target: &Path) -> std::io::Result<()> {
    fs::rename(source, target)
}

const BASE64_ALPHABET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

fn base64_encode(input: &[u8]) -> String {
    let mut output = String::with_capacity((input.len() + 2) / 3 * 4);
    for chunk in input.chunks(3) {
        let b = [
            chunk[0],
            *chunk.get(1).unwrap_or(&0),
            *chunk.get(2).unwrap_or(&0),
        ];
        output.push(BASE64_ALPHABET[(b[0] >> 2) as usize] as char);
        output.push(BASE64_ALPHABET[(((b[0] & 0b11) << 4) | (b[1] >> 4)) as usize] as char);
        if chunk.len() > 1 {
            output.push(BASE64_ALPHABET[(((b[1] & 0b1111) << 2) | (b[2] >> 6)) as usize] as char);
        } else {
            output.push('=');
        }
        if chunk.len() > 2 {
            output.push(BASE64_ALPHABET[(b[2] & 0b111111) as usize] as char);
        } else {
            output.push('=');
        }
    }
    output
}

fn base64_decode(input: &str) -> Option<Vec<u8>> {
    let cleaned: Vec<u8> = input.bytes().filter(|byte| !byte.is_ascii_whitespace()).collect();
    if cleaned.len() % 4 != 0 {
        return None;
    }
    let mut output = Vec::with_capacity(cleaned.len() / 4 * 3);
    for chunk in cleaned.chunks(4) {
        let mut values = [0u16; 4];
        for (index, byte) in chunk.iter().enumerate() {
            values[index] = match byte {
                b'=' => 0,
                _ => BASE64_ALPHABET.iter().position(|item| item == byte)? as u16,
            };
        }
        output.push(((values[0] << 2) | (values[1] >> 4)) as u8);
        if chunk[2] != b'=' {
            output.push(((values[1] << 4) | (values[2] >> 2)) as u8);
        }
        if chunk[3] != b'=' {
            output.push(((values[2] << 6) | values[3]) as u8);
        }
    }
    Some(output)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::vault::repository::EncryptedFileRepository;

    fn fixture() -> (tempfile::TempDir, Arc<VaultService>, Arc<SettingsService>, CloudService) {
        let dir = tempfile::tempdir().unwrap();
        let repo = Arc::new(EncryptedFileRepository::new(dir.path().to_path_buf()));
        let vault = Arc::new(VaultService::new(repo));
        let settings = Arc::new(SettingsService::new(dir.path()));
        let cloud = CloudService::new(dir.path().to_path_buf(), vault.clone(), settings.clone());
        (dir, vault, settings, cloud)
    }

    #[test]
    fn test_base64_roundtrip() {
        for size in 0..40 {
            let data: Vec<u8> = (0..size).map(|value| value as u8).collect();
            let encoded = base64_encode(&data);
            assert_eq!(base64_decode(&encoded).unwrap(), data);
        }
    }

    #[test]
    fn test_sync_rotation_and_pruning() {
        let (dir, vault, _settings, cloud) = fixture();
        vault.initialize_vault("CloudPass123!").unwrap();
        let project = vault.create_project("Alpha", None, None).unwrap();
        vault
            .create_env_document(&project.id, ".env", "KEY=value\n")
            .unwrap();

        let cloud_base = dir.path().join("cloud");
        fs::create_dir_all(&cloud_base).unwrap();
        let status = cloud
            .connect("custom", Some(cloud_base.to_string_lossy().to_string()))
            .unwrap();
        assert!(status.connected);

        let cloud_dir = cloud_base.join(CLOUD_DIR_NAME);
        assert!(cloud_dir.join(SYNC_FILE_NAME).exists());

        // Simulate 20 daily backups, then keep only the newest 15.
        for day in 1..=20 {
            let path = cloud_dir.join(format!("{BACKUP_PREFIX}2024-01-{day:02}.json"));
            fs::write(&path, "{\"stale\":true}").unwrap();
        }
        cloud.sync_now().unwrap();
        assert!(backup_files(&cloud_dir).len() <= MAX_BACKUP_DAYS);
    }

    #[test]
    fn test_corrupt_sync_falls_back_to_previous() {
        let (dir, vault, _settings, cloud) = fixture();
        vault.initialize_vault("CloudPass123!").unwrap();
        let project = vault.create_project("Beta", None, None).unwrap();
        vault.create_env_document(&project.id, ".env", "A=1\n").unwrap();

        let cloud_base = dir.path().join("cloud");
        fs::create_dir_all(&cloud_base).unwrap();
        cloud
            .connect("custom", Some(cloud_base.to_string_lossy().to_string()))
            .unwrap();
        cloud.sync_now().unwrap();

        let cloud_dir = cloud_base.join(CLOUD_DIR_NAME);
        assert!(cloud_dir.join(PREVIOUS_FILE_NAME).exists());
        fs::write(cloud_dir.join(SYNC_FILE_NAME), "{ broken json").unwrap();

        let snapshot = read_snapshot(&cloud_dir).unwrap();
        assert_eq!(snapshot.summary.projects, 1);
    }

    #[test]
    fn test_empty_local_does_not_overwrite_filled_cloud() {
        let (dir, vault, _settings, cloud) = fixture();
        vault.initialize_vault("CloudPass123!").unwrap();
        let project = vault.create_project("Gamma", None, None).unwrap();
        vault.create_env_document(&project.id, ".env", "B=2\n").unwrap();

        let cloud_base = dir.path().join("cloud");
        fs::create_dir_all(&cloud_base).unwrap();
        cloud
            .connect("custom", Some(cloud_base.to_string_lossy().to_string()))
            .unwrap();
        cloud.sync_now().unwrap();
        let cloud_dir = cloud_base.join(CLOUD_DIR_NAME);

        // A locked vault must not erase the cloud snapshot either.
        vault.lock_vault();
        let outcome = cloud.sync_now().unwrap();
        assert!(!outcome.skipped_empty);
        let before = fs::read_to_string(cloud_dir.join(SYNC_FILE_NAME)).unwrap();

        // Remove the local vault entirely: sync must not delete the cloud copy.
        fs::remove_file(dir.path().join(VAULT_FILE_NAME)).unwrap();
        let outcome = cloud.sync_now().unwrap();
        assert!(outcome.skipped_empty);
        let after = fs::read_to_string(cloud_dir.join(SYNC_FILE_NAME)).unwrap();
        assert_eq!(before, after);
    }
}
