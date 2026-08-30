use crate::error::{AppError, AppResult};

pub const MAX_ENV_FILE_SIZE: usize = 10 * 1024 * 1024; // 10 MB limit

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DecodedEnvText {
    pub raw_text: String,
    pub had_bom: bool,
    pub line_ending: String, // "crlf" | "lf"
}

/// Validates raw bytes and decodes into UTF-8 text with BOM and line ending detection.
pub fn decode_and_validate_env_bytes(bytes: &[u8]) -> AppResult<DecodedEnvText> {
    if bytes.len() > MAX_ENV_FILE_SIZE {
        return Err(AppError::FileTooLarge);
    }

    // Check for NUL bytes indicating binary file
    if bytes.contains(&0u8) {
        return Err(AppError::InvalidEnvFile);
    }

    let (had_bom, slice_after_bom) = if bytes.starts_with(&[0xEF, 0xBB, 0xBF]) {
        (true, &bytes[3..])
    } else {
        (false, bytes)
    };

    let raw_text = std::str::from_utf8(slice_after_bom)
        .map_err(|_| AppError::UnsupportedEncoding)?
        .to_string();

    let line_ending = if raw_text.contains("\r\n") {
        "crlf".to_string()
    } else {
        "lf".to_string()
    };

    Ok(DecodedEnvText {
        raw_text,
        had_bom,
        line_ending,
    })
}

/// Encodes text back to bytes preserving BOM and line ending.
pub fn encode_env_text(text: &str, had_bom: bool, line_ending: &str) -> Vec<u8> {
    let normalized = if line_ending == "crlf" && !text.contains("\r\n") {
        text.replace('\n', "\r\n")
    } else if line_ending == "lf" && text.contains("\r\n") {
        text.replace("\r\n", "\n")
    } else {
        text.to_string()
    };

    let mut result = Vec::with_capacity(if had_bom { 3 } else { 0 } + normalized.len());
    if had_bom {
        result.extend_from_slice(&[0xEF, 0xBB, 0xBF]);
    }
    result.extend_from_slice(normalized.as_bytes());
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_utf8_bom_detection() {
        let mut bytes = vec![0xEF, 0xBB, 0xBF];
        bytes.extend_from_slice(b"FOO=bar\r\nBAZ=qux\r\n");

        let decoded = decode_and_validate_env_bytes(&bytes).unwrap();
        assert!(decoded.had_bom);
        assert_eq!(decoded.line_ending, "crlf");
        assert_eq!(decoded.raw_text, "FOO=bar\r\nBAZ=qux\r\n");
    }

    #[test]
    fn test_binary_nul_byte_rejected() {
        let bytes = b"FOO=bar\0BAZ=qux";
        let result = decode_and_validate_env_bytes(bytes);
        assert!(result.is_err());
        match result.unwrap_err() {
            AppError::InvalidEnvFile => (),
            other => panic!("Expected InvalidEnvFile, got {:?}", other),
        }
    }

    #[test]
    fn test_large_file_rejected() {
        let large_bytes = vec![b'a'; MAX_ENV_FILE_SIZE + 1];
        let result = decode_and_validate_env_bytes(&large_bytes);
        assert!(result.is_err());
        match result.unwrap_err() {
            AppError::FileTooLarge => (),
            other => panic!("Expected FileTooLarge, got {:?}", other),
        }
    }
}
