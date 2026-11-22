use crate::crypto::{decrypt_aes_gcm, derive_key, encrypt_aes_gcm, generate_salt, KdfParams};
use crate::error::{AppError, AppResult};
use crate::metadata::models::VaultSnapshot;
use serde::{Deserialize, Serialize};

pub const BACKUP_MAGIC: &[u8; 4] = b"EVLT";
pub const CURRENT_BACKUP_VERSION: u32 = 1;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupContainer {
    pub magic: [u8; 4],
    pub format_version: u32,
    pub kdf_params: KdfParams,
    pub salt: Vec<u8>,
    pub created_at: String,
    pub encrypted_payload: Vec<u8>, // AES-256-GCM encrypted VaultSnapshot JSON
}

impl BackupContainer {
    pub fn create(snapshot: &VaultSnapshot, password: &str) -> AppResult<Vec<u8>> {
        let salt = generate_salt().to_vec();
        let kdf_params = KdfParams::default();
        let key = derive_key(password, &salt, &kdf_params)?;

        let snapshot_json =
            serde_json::to_vec(snapshot).map_err(|_| AppError::BackupCreateFailed)?;

        let encrypted_payload = encrypt_aes_gcm(&key, &snapshot_json)?;

        let container = BackupContainer {
            magic: *BACKUP_MAGIC,
            format_version: CURRENT_BACKUP_VERSION,
            kdf_params,
            salt,
            created_at: chrono::Utc::now().to_rfc3339(),
            encrypted_payload,
        };

        serde_json::to_vec_pretty(&container).map_err(|_| AppError::BackupCreateFailed)
    }

    pub fn read_snapshot(bytes: &[u8], password: &str) -> AppResult<(VaultSnapshot, String)> {
        let container: BackupContainer =
            serde_json::from_slice(bytes).map_err(|_| AppError::BackupInvalid)?;

        if &container.magic != BACKUP_MAGIC {
            return Err(AppError::BackupInvalid);
        }

        if container.format_version > CURRENT_BACKUP_VERSION {
            return Err(AppError::Custom(
                "This backup was created by a newer Env Vault version.".to_string(),
            ));
        }

        let key = derive_key(password, &container.salt, &container.kdf_params)?;
        let decrypted_bytes = decrypt_aes_gcm(&key, &container.encrypted_payload)
            .map_err(|_| AppError::BackupPasswordInvalid)?;

        let snapshot: VaultSnapshot =
            serde_json::from_slice(&decrypted_bytes).map_err(|_| AppError::BackupInvalid)?;

        Ok((snapshot, container.created_at))
    }
}
