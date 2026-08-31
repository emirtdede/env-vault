use serde::{Serialize, Serializer};
use thiserror::Error;

#[derive(Error, Debug, Clone)]
pub enum AppError {
    #[error("Vault henüz oluşturulmamış.")]
    VaultNotInitialized,

    #[error("Vault kilitli. Lütfen önce ana parolanız ile kilidi açın.")]
    VaultLocked,

    #[error("Geçersiz ana parola.")]
    InvalidMasterPassword,

    #[error("Vault depolama dosyası bozulmuş veya geçersiz.")]
    VaultCorrupted,

    #[error("Proje bulunamadı.")]
    ProjectNotFound,

    #[error("Ortam dosyası bulunamadı.")]
    EnvDocumentNotFound,

    #[error("Geçersiz ortam dosyası.")]
    InvalidEnvFile,

    #[error("Dosya boyutu çok büyük (Maksimum 10 MB).")]
    FileTooLarge,

    #[error("Desteklenmeyen dosya kodlaması (Encoding).")]
    UnsupportedEncoding,

    #[error("İçe aktarılacak dosya okunamadı.")]
    ImportReadFailed,

    #[error("Şifreli veri yazılamadı.")]
    SecretWriteFailed,

    #[error("Şifreli veri okunamadı.")]
    SecretReadFailed,

    #[error("Dışa aktarma hedef dizini geçersiz veya erişilemez.")]
    ExportPathInvalid,

    #[error("Dışa aktarma işlemi başarısız oldu.")]
    ExportWriteFailed,

    #[error("Hedef konumda aynı isimde dosya zaten mevcut.")]
    ExportTargetExists,

    #[error("Bu isimde bir ortam dosyası zaten mevcut.")]
    DuplicateFileName,

    #[error("Sürükle-bırak işlemi başarısız oldu.")]
    DragDropFailed,

    #[error("Yedek oluşturma işlemi başarısız oldu.")]
    BackupCreateFailed,

    #[error("Yedek dosyası geçersiz veya bozulmuş.")]
    BackupInvalid,

    #[error("Yedek parolası geçersiz.")]
    BackupPasswordInvalid,

    #[error("Yedekten geri yükleme başarısız oldu.")]
    RestoreFailed,

    #[error("Ayarlar okunamadı.")]
    SettingsReadFailed,

    #[error("Ayarlar kaydedilemedi.")]
    SettingsWriteFailed,

    #[error("Platform özelliği desteklenmiyor.")]
    PlatformUnsupported,

    #[error("Çakışma: {0}")]
    Conflict(String),

    #[error("Kriptografik hata: {0}")]
    Crypto(String),

    #[error("{0}")]
    Custom(String),
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        match err.kind() {
            std::io::ErrorKind::NotFound => {
                AppError::Custom("Belirtilen dosya veya dizin bulunamadı.".into())
            }
            std::io::ErrorKind::PermissionDenied => {
                AppError::Custom("Dosya veya dizin erişim izni reddedildi.".into())
            }
            std::io::ErrorKind::AlreadyExists => {
                AppError::Custom("Dosya veya dizin zaten mevcut.".into())
            }
            _ => AppError::Custom("Dosya sistemi işlemi sırasında bir hata oluştu.".into()),
        }
    }
}


impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        AppError::Custom(err.to_string())
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
