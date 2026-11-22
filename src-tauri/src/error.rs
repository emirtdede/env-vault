use serde::{Serialize, Serializer};
use thiserror::Error;

#[derive(Error, Debug, Clone)]
pub enum AppError {
    #[error("Vault has not been initialized yet.")]
    VaultNotInitialized,

    #[error("Vault is locked. Unlock it with your master password first.")]
    VaultLocked,

    #[error("Invalid master password.")]
    InvalidMasterPassword,

    #[error("Vault storage file is corrupted or invalid.")]
    VaultCorrupted,

    #[error("Project not found.")]
    ProjectNotFound,

    #[error("Environment file not found.")]
    EnvDocumentNotFound,

    #[error("Invalid environment file.")]
    InvalidEnvFile,

    #[error("File is too large (maximum 10 MB).")]
    FileTooLarge,

    #[error("Unsupported file encoding.")]
    UnsupportedEncoding,

    #[error("The file to import could not be read.")]
    ImportReadFailed,

    #[error("Encrypted data could not be written.")]
    SecretWriteFailed,

    #[error("Encrypted data could not be read.")]
    SecretReadFailed,

    #[error("Export destination folder is invalid or unreachable.")]
    ExportPathInvalid,

    #[error("Export failed.")]
    ExportWriteFailed,

    #[error("A file with the same name already exists at the destination.")]
    ExportTargetExists,

    #[error("An environment file with this name already exists.")]
    DuplicateFileName,

    #[error("Drag and drop failed.")]
    DragDropFailed,

    #[error("Backup creation failed.")]
    BackupCreateFailed,

    #[error("Backup file is invalid or corrupted.")]
    BackupInvalid,

    #[error("Backup password is invalid.")]
    BackupPasswordInvalid,

    #[error("Restore from backup failed.")]
    RestoreFailed,

    #[error("Settings could not be read.")]
    SettingsReadFailed,

    #[error("Settings could not be saved.")]
    SettingsWriteFailed,

    #[error("This platform feature is not supported.")]
    PlatformUnsupported,

    #[error("Conflict: {0}")]
    Conflict(String),

    #[error("Cryptographic error: {0}")]
    Crypto(String),

    #[error("{0}")]
    Custom(String),
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        match err.kind() {
            std::io::ErrorKind::NotFound => {
                AppError::Custom("The specified file or folder was not found.".into())
            }
            std::io::ErrorKind::PermissionDenied => {
                AppError::Custom("Access to the file or folder was denied.".into())
            }
            std::io::ErrorKind::AlreadyExists => {
                AppError::Custom("The file or folder already exists.".into())
            }
            _ => AppError::Custom("A filesystem error occurred.".into()),
        }
    }
}


impl From<serde_json::Error> for AppError {
    fn from(_err: serde_json::Error) -> Self {
        AppError::VaultCorrupted
    }
}


impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        #[derive(Serialize)]
        struct ErrorPayload<'a> {
            code: &'a str,
            message: String,
        }

        let code = match self {
            AppError::VaultNotInitialized => "VAULT_NOT_INITIALIZED",
            AppError::VaultLocked => "VAULT_LOCKED",
            AppError::InvalidMasterPassword => "INVALID_MASTER_PASSWORD",
            AppError::VaultCorrupted => "VAULT_CORRUPTED",
            AppError::ProjectNotFound => "PROJECT_NOT_FOUND",
            AppError::EnvDocumentNotFound => "ENV_DOCUMENT_NOT_FOUND",
            AppError::InvalidEnvFile => "INVALID_ENV_FILE",
            AppError::FileTooLarge => "FILE_TOO_LARGE",
            AppError::UnsupportedEncoding => "UNSUPPORTED_ENCODING",
            AppError::ImportReadFailed => "IMPORT_READ_FAILED",
            AppError::SecretWriteFailed => "SECRET_WRITE_FAILED",
            AppError::SecretReadFailed => "SECRET_READ_FAILED",
            AppError::ExportPathInvalid => "EXPORT_PATH_INVALID",
            AppError::ExportWriteFailed => "EXPORT_WRITE_FAILED",
            AppError::ExportTargetExists => "EXPORT_TARGET_EXISTS",
            AppError::DuplicateFileName => "DUPLICATE_FILE_NAME",
            AppError::DragDropFailed => "DRAG_DROP_FAILED",
            AppError::BackupCreateFailed => "BACKUP_CREATE_FAILED",
            AppError::BackupInvalid => "BACKUP_INVALID",
            AppError::BackupPasswordInvalid => "BACKUP_PASSWORD_INVALID",
            AppError::RestoreFailed => "RESTORE_FAILED",
            AppError::SettingsReadFailed => "SETTINGS_READ_FAILED",
            AppError::SettingsWriteFailed => "SETTINGS_WRITE_FAILED",
            AppError::PlatformUnsupported => "PLATFORM_UNSUPPORTED",
            AppError::Conflict(_) => "CONFLICT",
            AppError::Crypto(_) => "CRYPTO_ERROR",
            AppError::Custom(_) => "CUSTOM_ERROR",
        };

        let payload = ErrorPayload {
            code,
            message: self.to_string(),
        };

        payload.serialize(serializer)
    }
}

pub type AppResult<T> = Result<T, AppError>;
