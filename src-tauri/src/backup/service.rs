use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::sync::Arc;
use uuid::Uuid;

use crate::backup::format::BackupContainer;
use crate::error::{AppError, AppResult};
use crate::vault::service::VaultService;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupPreview {
    pub format_version: u32,
    pub created_at: String,
    pub project_count: usize,
    pub env_document_count: usize,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum RestoreMode {
    Merge,
    Replace,
}

pub struct BackupService {
    vault_service: Arc<VaultService>,
}

impl BackupService {
    pub fn new(vault_service: Arc<VaultService>) -> Self {
        Self { vault_service }
    }

    pub fn create_backup(&self, destination_path: &Path, password: &str) -> AppResult<()> {
        let snapshot = self.vault_service.get_snapshot()?;
        let backup_bytes = BackupContainer::create(&snapshot, password)?;

        if let Some(parent) = destination_path.parent() {
            fs::create_dir_all(parent).map_err(|_| AppError::BackupCreateFailed)?;
        }

        fs::write(destination_path, backup_bytes).map_err(|_| AppError::BackupCreateFailed)?;
        Ok(())
    }

    pub fn inspect_backup(&self, backup_path: &Path, password: &str) -> AppResult<BackupPreview> {
        let bytes = fs::read(backup_path).map_err(|_| AppError::BackupInvalid)?;
        let (snapshot, created_at) = BackupContainer::read_snapshot(&bytes, password)?;

        Ok(BackupPreview {
            format_version: snapshot.schema_version,
            created_at,
            project_count: snapshot.projects.len(),
            env_document_count: snapshot.env_documents.len(),
        })
    }

    pub fn restore_backup(
        &self,
        backup_path: &Path,
        password: &str,
        mode: RestoreMode,
    ) -> AppResult<()> {
        let bytes = fs::read(backup_path).map_err(|_| AppError::BackupInvalid)?;
        let (backup_snapshot, _) = BackupContainer::read_snapshot(&bytes, password)?;

        match mode {
            RestoreMode::Replace => {
                self.vault_service.replace_snapshot(&backup_snapshot)?;
            }
            RestoreMode::Merge => {
                let mut current_snapshot = self.vault_service.get_snapshot()?;

                for mut project in backup_snapshot.projects {
                    let old_project_id = project.id.clone();
                    let new_project_id = Uuid::new_v4().to_string();
                    project.id = new_project_id.clone();

                    // If a project with this name already exists, suffix with (Yedekten)
                    if current_snapshot
                        .projects
                        .iter()
                        .any(|p| p.name == project.name)
                    {
                        project.name = format!("{} (Yedekten)", project.name);
                    }

                    // Find and migrate env documents belonging to this project
                    let project_docs: Vec<_> = backup_snapshot
                        .env_documents
                        .iter()
                        .filter(|d| d.project_id == old_project_id)
                        .cloned()
                        .collect();

                    for mut doc in project_docs {
                        let old_doc_id = doc.id.clone();
                        let new_doc_id = Uuid::new_v4().to_string();
                        doc.id = new_doc_id.clone();
                        doc.project_id = new_project_id.clone();

                        if let Some(secret) = backup_snapshot.secrets.get(&old_doc_id) {
                            current_snapshot.secrets.insert(new_doc_id, secret.clone());
                        }

                        current_snapshot.env_documents.push(doc);
                    }

                    current_snapshot.projects.push(project);
                }

                self.vault_service.replace_snapshot(&current_snapshot)?;
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::vault::repository::EncryptedFileRepository;
    use tempfile::tempdir;

    #[test]
    fn test_backup_and_restore_cycle() {
        let dir = tempdir().unwrap();
        let repo = Arc::new(EncryptedFileRepository::new(dir.path().to_path_buf()));
        let vault_service = Arc::new(VaultService::new(repo));
        vault_service.initialize_vault("VaultPass123!").unwrap();

        // Populate with multiple projects and env documents
        for i in 1..=5 {
            let proj = vault_service
                .create_project(&format!("Project {}", i), None, None)
                .unwrap();
            vault_service
                .create_env_document(&proj.id, ".env", &format!("SECRET_KEY_{}=val_{}\n", i, i))
                .unwrap();
            vault_service
                .create_env_document(
                    &proj.id,
                    ".env.production",
                    &format!("PROD_KEY_{}=prod_{}\n", i, i),
                )
                .unwrap();
        }

        let backup_service = BackupService::new(vault_service.clone());
        let backup_file = dir.path().join("test_backup.evault");

        // Create backup with master password
        backup_service
            .create_backup(&backup_file, "BackupSecret123!")
            .unwrap();
        assert!(backup_file.exists());

        // Inspect backup
        let preview = backup_service
            .inspect_backup(&backup_file, "BackupSecret123!")
            .unwrap();
        assert_eq!(preview.project_count, 5);
        assert_eq!(preview.env_document_count, 10);

        // Inspect with wrong password should fail
        assert!(backup_service
            .inspect_backup(&backup_file, "WrongPassword!")
            .is_err());

        // Restore into a fresh vault
        let fresh_dir = tempdir().unwrap();
        let fresh_repo = Arc::new(EncryptedFileRepository::new(fresh_dir.path().to_path_buf()));
        let fresh_vault_service = Arc::new(VaultService::new(fresh_repo));
        fresh_vault_service
            .initialize_vault("FreshPass123!")
            .unwrap();

        let fresh_backup_service = BackupService::new(fresh_vault_service.clone());
        fresh_backup_service
            .restore_backup(&backup_file, "BackupSecret123!", RestoreMode::Replace)
            .unwrap();

        let restored_projects = fresh_vault_service.list_projects().unwrap();
        assert_eq!(restored_projects.len(), 5);
    }
}
