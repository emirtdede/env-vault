use zeroize::{Zeroize, ZeroizeOnDrop};

/// A wrapper around a secret string that zeroizes its memory upon drop.
#[derive(Clone, Zeroize, ZeroizeOnDrop)]
pub struct SecretString(String);

impl SecretString {
    pub fn new(value: String) -> Self {
        Self(value)
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }

    pub fn as_bytes(&self) -> &[u8] {
        self.0.as_bytes()
    }
}

impl std::fmt::Debug for SecretString {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "SecretString(***REDACTED***)")
    }
}

/// A wrapper around a secret byte vector that zeroizes its memory upon drop.
#[derive(Clone, Zeroize, ZeroizeOnDrop)]
pub struct SecretBytes(Vec<u8>);

impl SecretBytes {
    pub fn new(bytes: Vec<u8>) -> Self {
        Self(bytes)
    }

    pub fn as_slice(&self) -> &[u8] {
        &self.0
    }
}

impl std::fmt::Debug for SecretBytes {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "SecretBytes(***REDACTED***)")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_secret_string_redacted_debug() {
        let secret = SecretString::new("my-super-secret-password".to_string());
        let debug_output = format!("{:?}", secret);
        assert!(!debug_output.contains("my-super-secret-password"));
        assert!(debug_output.contains("***REDACTED***"));
    }

    #[test]
    fn test_secret_bytes_redacted_debug() {
        let secret = SecretBytes::new(vec![1, 2, 3, 4]);
        let debug_output = format!("{:?}", secret);
        assert!(debug_output.contains("***REDACTED***"));
    }
}
