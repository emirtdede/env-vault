use rand::RngCore;

/// Generates cryptographically secure random bytes of the specified length.
pub fn generate_random_bytes<const N: usize>() -> [u8; N] {
    let mut bytes = [0u8; N];
    rand::thread_rng().fill_bytes(&mut bytes);
    bytes
}

/// Generates a random salt for Argon2id (32 bytes).
pub fn generate_salt() -> [u8; 32] {
    generate_random_bytes::<32>()
}

/// Generates a random nonce for AES-256-GCM (12 bytes / 96-bit).
pub fn generate_nonce() -> [u8; 12] {
    generate_random_bytes::<12>()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_random_bytes_not_all_zeroes() {
        let bytes1 = generate_salt();
        let bytes2 = generate_salt();
        assert_ne!(bytes1, [0u8; 32]);
        assert_ne!(bytes1, bytes2);
    }
}
