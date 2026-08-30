use std::fs::File;
use std::io::{Read, Write};
use std::path::PathBuf;
use tempfile::NamedTempFile;

use crate::crypto::cipher::{decrypt_aes_gcm, encrypt_aes_gcm};
use crate::crypto::kdf::KdfParams;
use crate::error::{AppError, AppResult};
use crate::metadata::models::VaultSnapshot;

pub const VAULT_FILE_NAME: &str = "vault.evault";
pub const VAULT_MAGIC: &[u8; 4] = b"EVLT";
pub const VAULT_FORMAT_VERSION: u32 = 1;

pub trait VaultRepository: Send + Sync {
    fn is_initialized(&self) -> bool;
    fn get_salt_and_params(&self) -> AppResult<(Vec<u8>, KdfParams)>;
    fn initialize(
        &self,
        master_key: &[u8; 32],
        params: KdfParams,
        salt: &[u8; 32],
    ) -> AppResult<()>;
    fn load_snapshot(&self, derived_key: &[u8; 32]) -> AppResult<VaultSnapshot>;
    fn save_snapshot(&self, derived_key: &[u8; 32], snapshot: &VaultSnapshot) -> AppResult<()>;
    fn rewrap_snapshot(
        &self,
        old_key: &[u8; 32],
        new_key: &[u8; 32],
        new_params: KdfParams,
        new_salt: &[u8; 32],
    ) -> AppResult<()>;
    fn delete_vault_file(&self) -> AppResult<()>;
}

pub struct EncryptedFileRepository {
    storage_dir: PathBuf,
}

impl EncryptedFileRepository {
    pub fn new(storage_dir: PathBuf) -> Self {
        Self { storage_dir }
    }

    fn vault_path(&self) -> PathBuf {
        self.storage_dir.join(VAULT_FILE_NAME)
    }

    fn read_metadata(&self) -> AppResult<(KdfParams, [u8; 32])> {
        let path = self.vault_path();
        if !path.exists() {
            return Err(AppError::VaultNotInitialized);
        }

        let mut file = File::open(&path)?;
        let mut magic = [0u8; 4];
        file.read_exact(&mut magic)?;
        if &magic != VAULT_MAGIC {
            return Err(AppError::VaultCorrupted);
        }

        let mut version_bytes = [0u8; 4];
        file.read_exact(&mut version_bytes)?;

        let mut kdf_params_len_bytes = [0u8; 4];
        file.read_exact(&mut kdf_params_len_bytes)?;
        let kdf_params_len = u32::from_be_bytes(kdf_params_len_bytes) as usize;

        let mut kdf_params_buf = vec![0u8; kdf_params_len];
        file.read_exact(&mut kdf_params_buf)?;
        let kdf_params: KdfParams =
            serde_json::from_slice(&kdf_params_buf).map_err(|_| AppError::VaultCorrupted)?;

        let mut salt = [0u8; 32];
        file.read_exact(&mut salt)?;

        Ok((kdf_params, salt))
    }

    fn write_container(
        &self,
        snapshot: &VaultSnapshot,
        derived_key: &[u8; 32],
        kdf_params: &KdfParams,
        salt: &[u8; 32],
    ) -> AppResult<()> {
        std::fs::create_dir_all(&self.storage_dir)?;

        let plaintext = serde_json::to_vec(snapshot)?;
        let ciphertext = encrypt_aes_gcm(derived_key, &plaintext)?;

        let kdf_params_json = serde_json::to_vec(kdf_params)?;
        let kdf_params_len = (kdf_params_json.len() as u32).to_be_bytes();

        let mut temp_file = NamedTempFile::new_in(&self.storage_dir)?;

        temp_file.write_all(VAULT_MAGIC)?;
        temp_file.write_all(&VAULT_FORMAT_VERSION.to_be_bytes())?;
        temp_file.write_all(&kdf_params_len)?;
        temp_file.write_all(&kdf_params_json)?;
        temp_file.write_all(salt)?;
        temp_file.write_all(&ciphertext)?;
        temp_file.flush()?;

        let dest = self.vault_path();
        temp_file
            .persist(&dest)
            .map_err(|e| AppError::Custom(format!("Vault dosyası kaydedilemedi: {e}")))?;

        Ok(())
    }
}

impl VaultRepository for EncryptedFileRepository {
    fn is_initialized(&self) -> bool {
        self.vault_path().exists()
    }

    fn get_salt_and_params(&self) -> AppResult<(Vec<u8>, KdfParams)> {
        let (params, salt) = self.read_metadata()?;
        Ok((salt.to_vec(), params))
    }

    fn initialize(
        &self,
        master_key: &[u8; 32],
        params: KdfParams,
        salt: &[u8; 32],
    ) -> AppResult<()> {
        let empty_snapshot = VaultSnapshot {
            schema_version: 1,
            kdf_params: params.clone(),
            salt: salt.to_vec(),
            projects: Vec::new(),
            env_documents: Vec::new(),
            secrets: std::collections::HashMap::new(),
        };

        self.write_container(&empty_snapshot, master_key, &params, salt)
    }

    fn load_snapshot(&self, derived_key: &[u8; 32]) -> AppResult<VaultSnapshot> {
        let path = self.vault_path();
        if !path.exists() {
            return Err(AppError::VaultNotInitialized);
        }

        let mut file = File::open(&path)?;
        let mut magic = [0u8; 4];
        file.read_exact(&mut magic)?;
        if &magic != VAULT_MAGIC {
            return Err(AppError::VaultCorrupted);
        }

        let mut version_bytes = [0u8; 4];
        file.read_exact(&mut version_bytes)?;

        let mut kdf_params_len_bytes = [0u8; 4];
        file.read_exact(&mut kdf_params_len_bytes)?;
        let kdf_params_len = u32::from_be_bytes(kdf_params_len_bytes) as usize;

        let mut kdf_params_buf = vec![0u8; kdf_params_len];
        file.read_exact(&mut kdf_params_buf)?;

        let mut salt = [0u8; 32];
        file.read_exact(&mut salt)?;

        let mut ciphertext = Vec::new();
        file.read_to_end(&mut ciphertext)?;

        let plaintext = decrypt_aes_gcm(derived_key, &ciphertext)?;
        let snapshot: VaultSnapshot =
            serde_json::from_slice(&plaintext).map_err(|_| AppError::VaultCorrupted)?;

        Ok(snapshot)
    }

    fn save_snapshot(&self, derived_key: &[u8; 32], snapshot: &VaultSnapshot) -> AppResult<()> {
        let (params, salt) = self.read_metadata()?;
        self.write_container(snapshot, derived_key, &params, &salt)
    }

    fn rewrap_snapshot(
        &self,
        old_key: &[u8; 32],
        new_key: &[u8; 32],
        new_params: KdfParams,
        new_salt: &[u8; 32],
    ) -> AppResult<()> {
        let snapshot = self.load_snapshot(old_key)?;
        self.write_container(&snapshot, new_key, &new_params, new_salt)
    }

    fn delete_vault_file(&self) -> AppResult<()> {
        let path = self.vault_path();
        if path.exists() {
            std::fs::remove_file(path)?;
        }
        Ok(())
    }
}
