use serde::{Deserialize, Serialize};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tempfile::NamedTempFile;

use crate::env::encode_env_text;
use crate::error::{AppError, AppResult};
use crate::settings::models::CollisionPolicy;
use crate::vault::service::VaultService;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportReport {
    pub destination_path: String,
    pub bytes_written: usize,
    pub filename: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchExportReport {
    pub total_requested: usize,
    pub exported_count: usize,
    pub destination_directory: String,
    pub reports: Vec<ExportReport>,
    pub errors: Vec<String>,
}

pub struct ExportService {
    vault_service: Arc<VaultService>,
}

impl ExportService {
    pub fn new(vault_service: Arc<VaultService>) -> Self {
        Self { vault_service }
    }

    pub fn export_to_path(
        &self,
        env_id: &str,
        target_path: &Path,
        collision_policy: CollisionPolicy,
    ) -> AppResult<ExportReport> {
        let (doc, payload) = self.vault_service.get_env_document_and_payload(env_id)?;

        let final_path = if target_path.exists() {
            Self::resolve_collision(target_path, collision_policy)?
        } else {
            target_path.to_path_buf()
        };

        if let Some(parent) = final_path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        let encoded_bytes =
            encode_env_text(&payload.raw_text, payload.had_bom, &payload.line_ending);
        Self::atomic_write_file(&final_path, &encoded_bytes)?;

        Ok(ExportReport {
            destination_path: final_path.to_string_lossy().to_string(),
            bytes_written: encoded_bytes.len(),
            filename: doc.filename,
        })
    }

    pub fn export_to_default_directory(
        &self,
        env_id: &str,
        default_dir: &Path,
        collision_policy: CollisionPolicy,
    ) -> AppResult<ExportReport> {
        let (doc, _) = self.vault_service.get_env_document_and_payload(env_id)?;
        let initial_target = default_dir.join(&doc.filename);
        self.export_to_path(env_id, &initial_target, collision_policy)
    }

    pub fn export_multiple_to_directory(
        &self,
        env_ids: &[String],
        target_dir: &Path,
        collision_policy: CollisionPolicy,
    ) -> AppResult<BatchExportReport> {
        if !target_dir.exists() {
            std::fs::create_dir_all(target_dir)?;
        }

        let mut reports = Vec::new();
        let mut errors = Vec::new();
        let mut exported_count = 0;

        for id in env_ids {
            match self.export_to_default_directory(id, target_dir, collision_policy) {
                Ok(rep) => {
                    exported_count += 1;
                    reports.push(rep);
                }
                Err(err) => {
                    errors.push(format!("ID {id}: {err}"));
                }
            }
        }

        Ok(BatchExportReport {
            total_requested: env_ids.len(),
            exported_count,
            destination_directory: target_dir.to_string_lossy().to_string(),
            reports,
            errors,
        })
    }

    pub fn export_project_to_directory(
        &self,
        project_id: &str,
        target_dir: &Path,
        collision_policy: CollisionPolicy,
    ) -> AppResult<BatchExportReport> {
        let docs = self.vault_service.list_env_documents(project_id)?;
        let env_ids: Vec<String> = docs.into_iter().map(|d| d.id).collect();
        self.export_multiple_to_directory(&env_ids, target_dir, collision_policy)
    }

    pub fn export_all_projects_to_directory(
        &self,
        target_dir: &Path,
        collision_policy: CollisionPolicy,
    ) -> AppResult<BatchExportReport> {
        if !target_dir.exists() {
            std::fs::create_dir_all(target_dir)?;
        }

        let projects = self.vault_service.list_projects()?;
        let mut total_requested = 0;
        let mut exported_count = 0;
        let mut all_reports = Vec::new();
        let mut all_errors = Vec::new();

        for project in projects {
            // Sanitize project name for directory name
            let clean_name: String = project
                .name
                .chars()
                .map(|c| if c.is_alphanumeric() || c == '-' || c == '_' || c == ' ' { c } else { '_' })
                .collect();
            let project_dir = target_dir.join(clean_name.trim());

            match self.export_project_to_directory(&project.id, &project_dir, collision_policy) {
                Ok(rep) => {
                    total_requested += rep.total_requested;
                    exported_count += rep.exported_count;
                    all_reports.extend(rep.reports);
                    all_errors.extend(rep.errors);
                }
                Err(err) => {
                    all_errors.push(format!("Proje {}: {err}", project.name));
                }
            }
        }

        Ok(BatchExportReport {
            total_requested,
            exported_count,
            destination_directory: target_dir.to_string_lossy().to_string(),
            reports: all_reports,
            errors: all_errors,
        })
    }

    pub fn export_merged_project_env(
        &self,
        project_id: &str,
        target_path: &Path,
    ) -> AppResult<ExportReport> {
        let (project, docs) = {
            let projects = self.vault_service.list_projects()?;
            let proj = projects.into_iter().find(|p| p.id == project_id)
                .ok_or_else(|| AppError::ProjectNotFound)?;
            let docs = self.vault_service.list_env_documents(project_id)?;
            (proj, docs)
        };

        let mut combined_text = format!(
            "# ====================================================================\n# Env Vault - Birleşik Ortam Dosyası Dışa Aktarımı\n# Proje: {}\n# Dışa Aktarma Tarihi: {}\n# ====================================================================\n\n",
            project.name,
            chrono::Utc::now().to_rfc3339()
        );

        for doc in &docs {
            let (_, payload) = self.vault_service.get_env_document_and_payload(&doc.id)?;
            combined_text.push_str(&format!(
                "# --------------------------------------------------------------------\n# [Dosya: {}] ({} değişken)\n# --------------------------------------------------------------------\n{}\n\n",
                doc.filename,
                doc.key_count,
                payload.raw_text.trim_end()
            ));
        }

        if let Some(parent) = target_path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        Self::atomic_write_file(target_path, combined_text.as_bytes())?;

        Ok(ExportReport {
            destination_path: target_path.to_string_lossy().to_string(),
            bytes_written: combined_text.len(),
            filename: target_path.file_name().and_then(|s| s.to_str()).unwrap_or("combined.env").to_string(),
        })
    }

    fn resolve_collision(target: &Path, policy: CollisionPolicy) -> AppResult<PathBuf> {
        match policy {
            CollisionPolicy::Overwrite => Ok(target.to_path_buf()),
            CollisionPolicy::Rename => {
                let parent = target.parent().unwrap_or_else(|| Path::new(""));
                let file_name = target
                    .file_name()
                    .and_then(|s| s.to_str())
                    .unwrap_or(".env");

                for counter in 1..1000 {
                    let candidate = parent.join(format!("{file_name}.{counter}"));
                    if !candidate.exists() {
                        return Ok(candidate);
                    }
                }
                Err(AppError::Custom("Yeni dosya adı üretilemedi.".into()))
            }
            CollisionPolicy::Cancel => Err(AppError::Conflict(
                "Hedef dosya zaten mevcut ve işlem iptal edildi.".into(),
            )),
            CollisionPolicy::Ask => Ok(target.to_path_buf()),
        }
    }

    fn atomic_write_file(destination: &Path, data: &[u8]) -> AppResult<()> {
        let parent = destination
            .parent()
            .ok_or_else(|| AppError::Custom("Geçersiz hedef yolu.".into()))?;

        let mut temp_file = NamedTempFile::new_in(parent)?;
        temp_file.write_all(data)?;
        temp_file.flush()?;

        temp_file
            .persist(destination)
            .map_err(|e| AppError::Custom(format!("Dosya atomik olarak kaydedilemedi: {e}")))?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::vault::repository::EncryptedFileRepository;
    use tempfile::tempdir;

    #[test]
    fn test_batch_export_to_directory() {
        let vault_dir = tempdir().unwrap();
        let export_dir = tempdir().unwrap();

        let repo = Arc::new(EncryptedFileRepository::new(vault_dir.path().to_path_buf()));
        let vault_service = Arc::new(VaultService::new(repo));
        let export_service = ExportService::new(vault_service.clone());

        vault_service.initialize_vault("MasterPass12345!").unwrap();

        let project = vault_service
            .create_project("Export Project", None, None)
            .unwrap();

        let _d1 = vault_service
            .create_env_document(&project.id, ".env", "A=1\nB=2\n")
            .unwrap();
        let _d2 = vault_service
            .create_env_document(&project.id, ".env.production", "C=3\nD=4\n")
            .unwrap();

        let batch_rep = export_service
            .export_project_to_directory(&project.id, export_dir.path(), CollisionPolicy::Overwrite)
            .unwrap();

        assert_eq!(batch_rep.total_requested, 2);
        assert_eq!(batch_rep.exported_count, 2);

        let out1 = export_dir.path().join(".env");
        let out2 = export_dir.path().join(".env.production");
        assert!(out1.exists());
        assert!(out2.exists());

        assert_eq!(std::fs::read_to_string(out1).unwrap(), "A=1\nB=2\n");
        assert_eq!(std::fs::read_to_string(out2).unwrap(), "C=3\nD=4\n");
    }
}
