use crate::crypto::random::generate_nonce;
use crate::error::{AppError, AppResult};
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};

/// Encrypts plaintext bytes using AES-256-GCM with a 32-byte key.
/// Returns: Nonce (12 bytes) prepended to the ciphertext and auth tag (16 bytes).
pub fn encrypt_aes_gcm(key: &[u8; 32], plaintext: &[u8]) -> AppResult<Vec<u8>> {
    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|e| AppError::Custom(format!("Cipher başlatılamadı: {}", e)))?;

    let nonce_bytes = generate_nonce();
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|_| AppError::SecretWriteFailed)?;

    // Prepend 12-byte nonce to ciphertext
    let mut result = Vec::with_capacity(12 + ciphertext.len());
    result.extend_from_slice(&nonce_bytes);
    result.extend_from_slice(&ciphertext);

    Ok(result)
}

/// Decrypts payload bytes (12-byte nonce + ciphertext + 16-byte auth tag) using AES-256-GCM with a 32-byte key.
pub fn decrypt_aes_gcm(key: &[u8; 32], payload: &[u8]) -> AppResult<Vec<u8>> {
    if payload.len() < 12 + 16 {
        return Err(AppError::VaultCorrupted);
    }

    let (nonce_bytes, ciphertext) = payload.split_at(12);
    let nonce = Nonce::from_slice(nonce_bytes);

    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|e| AppError::Custom(format!("Cipher başlatılamadı: {}", e)))?;

    cipher
        .decrypt(nonce, ciphertext)
        .map_err(|_| AppError::InvalidMasterPassword)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt_roundtrip() {
        let key = [42u8; 32];
        let original_data =
            b"DATABASE_URL=postgres://user:pass@localhost:5432/db\nAPI_KEY=secret-token";

        let encrypted = encrypt_aes_gcm(&key, original_data).expect("Encryption failed");
        assert_ne!(encrypted.as_slice(), original_data);
        assert!(!encrypted
            .windows(original_data.len())
            .any(|w| w == original_data));

        let decrypted = decrypt_aes_gcm(&key, &encrypted).expect("Decryption failed");
        assert_eq!(decrypted.as_slice(), original_data);
    }

    #[test]
    fn test_decrypt_with_wrong_key_fails() {
        let key1 = [42u8; 32];
        let key2 = [99u8; 32];
        let original_data = b"SECRET_PAYLOAD=12345";

        let encrypted = encrypt_aes_gcm(&key1, original_data).unwrap();
        let result = decrypt_aes_gcm(&key2, &encrypted);

        assert!(result.is_err());
        match result.unwrap_err() {
            AppError::InvalidMasterPassword => (),
            other => panic!("Expected InvalidMasterPassword, got {:?}", other),
        }
    }

    #[test]
    fn test_decrypt_corrupted_payload_fails() {
        let key = [42u8; 32];
        let original_data = b"SECRET_PAYLOAD=12345";

        let mut encrypted = encrypt_aes_gcm(&key, original_data).unwrap();
        // Tamper with the last byte (auth tag)
        let last_idx = encrypted.len() - 1;
        encrypted[last_idx] ^= 0xFF;

        let result = decrypt_aes_gcm(&key, &encrypted);
        assert!(result.is_err());
    }
}
