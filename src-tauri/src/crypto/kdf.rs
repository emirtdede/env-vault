use argon2::{Algorithm, Argon2, Params, Version};
use serde::{Deserialize, Serialize};

use crate::crypto::random::generate_salt;
use crate::error::{AppError, AppResult};

pub const ARGON2_MEMORY_KIB: u32 = 64 * 1024; // 64 MB
pub const ARGON2_ITERATIONS: u32 = 3;
pub const ARGON2_LANES: u32 = 4;
pub const DERIVED_KEY_LEN: usize = 32; // 256 bits

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KdfParams {
    pub memory_kib: u32,
    pub iterations: u32,
    pub lanes: u32,
    pub version: u32,
}

impl Default for KdfParams {
    fn default() -> Self {
        Self {
            memory_kib: ARGON2_MEMORY_KIB,
            iterations: ARGON2_ITERATIONS,
            lanes: ARGON2_LANES,
            version: 1,
        }
    }
}

pub fn derive_key(
    password: impl AsRef<[u8]>,
    salt: &[u8],
    params: &KdfParams,
) -> AppResult<[u8; DERIVED_KEY_LEN]> {
    let argon_params = Params::new(
        params.memory_kib,
        params.iterations,
        params.lanes,
        Some(DERIVED_KEY_LEN),
    )
    .map_err(|e| AppError::Custom(format!("Argon2 parametre hatası: {e}")))?;

    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, argon_params);
    let mut key = [0u8; DERIVED_KEY_LEN];

    argon2
        .hash_password_into(password.as_ref(), salt, &mut key)
        .map_err(|e| AppError::Custom(format!("Anahtar türetme hatası: {e}")))?;

    Ok(key)
}

pub fn generate_kdf_salt() -> [u8; 32] {
    generate_salt()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_derive_key_consistency() {
        let password = "MySecureMasterPassword123!";
        let salt = generate_kdf_salt();
        let params = KdfParams::default();

        let key1 = derive_key(password, &salt, &params).expect("Key 1 derivation failed");
        let key2 = derive_key(password, &salt, &params).expect("Key 2 derivation failed");

        assert_eq!(key1, key2);
        assert_ne!(key1, [0u8; 32]);
    }

    #[test]
    fn test_different_passwords_produce_different_keys() {
        let p1 = "Password_A";
        let p2 = "Password_B";
        let salt = generate_kdf_salt();
        let params = KdfParams::default();

        let k1 = derive_key(p1, &salt, &params).unwrap();
        let k2 = derive_key(p2, &salt, &params).unwrap();

        assert_ne!(k1, k2);
    }
}
