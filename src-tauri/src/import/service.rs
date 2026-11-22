use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::Read;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use crate::env::{decode_and_validate_env_bytes, validate_env_filename};
use crate::error::{AppError, AppResult};
use crate::metadata::models::EnvDocument;
use crate::settings::models::CollisionPolicy;
use crate::vault::service::VaultService;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportResult {
    pub document: EnvDocument,
    pub renamed_from: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchImportReport {
    pub total_files: usize,
    pub imported_count: usize,
    pub skipped_count: usize,
    pub failed_count: usize,
    pub results: Vec<ImportResult>,
    pub errors: Vec<String>,
}

pub struct ImportService {
    vault_service: Arc<VaultService>,
}

impl ImportService {
    pub fn new(vault_service: Arc<VaultService>) -> Self {
        Self { vault_service }
    }

    /// Import an .env file from disk with Copy-in Semantics.
    /// Once imported into Vault, deleting the source directory will not affect the Vault copy.
    pub fn import_file_from_path(
        &self,
        project_id: &str,
        path: &Path,
        collision_policy: CollisionPolicy,
    ) -> AppResult<ImportResult> {
        let raw_filename = path
            .file_name()
            .and_then(|n| n.to_str())
            .ok_or_else(|| AppError::Custom("Invalid file name.".into()))?;

        validate_env_filename(raw_filename)?;
        let filename = raw_filename.to_string();

        let mut file = File::open(path)?;
        let mut bytes = Vec::new();
        file.read_to_end(&mut bytes)?;

        let decoded = decode_and_validate_env_bytes(&bytes)?;

        let existing_docs = self.vault_service.list_env_documents(project_id)?;
        let matching_doc = existing_docs.into_iter().find(|d| d.filename == filename);

        let mut renamed_from = None;
        let final_filename = match (matching_doc, collision_policy) {
            (None, _) => filename,
            (Some(existing_doc), CollisionPolicy::Overwrite) => {
                let updated = self
                    .vault_service
                    .update_env_document(&existing_doc.id, &decoded.raw_text)?;
                return Ok(ImportResult {
                    document: updated,
                    renamed_from: None,
                });
            }
            (Some(_), CollisionPolicy::Rename) => {
                let unique = self.generate_unique_filename(project_id, &filename)?;
                renamed_from = Some(filename);
                unique
            }
            (Some(_), CollisionPolicy::Ask) => {
                return Err(AppError::DuplicateFileName);
            }
            (Some(_), CollisionPolicy::Cancel) => {
                return Err(AppError::Custom("Import was cancelled.".into()));
            }
        };

        let source_path_str = path.to_string_lossy().to_string();
        let doc = self.vault_service.create_env_document_with_source(
            project_id,
            &final_filename,
            &decoded.raw_text,
            Some(source_path_str),
        )?;

        Ok(ImportResult {
            document: doc,
            renamed_from,
        })
    }

    pub fn import_files_from_paths(
        &self,
        project_id: &str,
        paths: &[PathBuf],
        collision_policy: CollisionPolicy,
    ) -> BatchImportReport {
        let mut results = Vec::new();
        let mut errors = Vec::new();
        let mut imported_count = 0;
        let mut skipped_count = 0;
        let mut failed_count = 0;

        for path in paths {
            match self.import_file_from_path(project_id, path, collision_policy) {
                Ok(res) => {
                    imported_count += 1;
                    results.push(res);
                }
                Err(AppError::Conflict(_)) | Err(AppError::DuplicateFileName) => {
                    skipped_count += 1;
                    let fname = path
                        .file_name()
                        .and_then(|n| n.to_str())
                        .unwrap_or("Dosya");
                    errors.push(format!("{fname}: file already exists (skipped)."));
                }
                Err(err) => {
                    failed_count += 1;
                    let fname = path
                        .file_name()
                        .and_then(|n| n.to_str())
                        .unwrap_or("Dosya");
                    errors.push(format!("{fname}: {err}"));
                }
            }
        }

        BatchImportReport {
            total_files: paths.len(),
            imported_count,
            skipped_count,
            failed_count,
            results,
            errors,
        }
    }

    pub fn import_directory_env_files(
        &self,
        project_id: &str,
        dir_path: &Path,
        recursive: bool,
        collision_policy: CollisionPolicy,
    ) -> AppResult<BatchImportReport> {
        if !dir_path.is_dir() {
            return Err(AppError::Custom("No valid folder was selected.".into()));
        }

        let mut env_paths = Vec::new();
        Self::collect_env_files(dir_path, recursive, 0, &mut env_paths)?;

        if env_paths.is_empty() {
            return Ok(BatchImportReport {
                total_files: 0,
                imported_count: 0,
                skipped_count: 0,
                failed_count: 0,
                results: Vec::new(),
                errors: vec!["No .env files were found in the folder.".into()],
            });
        }

        Ok(self.import_files_from_paths(project_id, &env_paths, collision_policy))
    }

    fn collect_env_files(
        dir: &Path,
        recursive: bool,
        depth: usize,
        collected: &mut Vec<PathBuf>,
    ) -> AppResult<()> {
        if depth > 6 {
            return Ok(());
        }

        let entries = match std::fs::read_dir(dir) {
            Ok(e) => e,
            Err(_) => return Ok(()),
        };

        for entry in entries.flatten() {
            let path = entry.path();
            let file_name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");

            if path.is_dir() {
                if file_name == "node_modules"
                    || file_name == ".git"
                    || file_name == "target"
                    || file_name == "dist"
                    || file_name == ".next"
                {
                    continue;
                }
                if recursive {
                    let _ = Self::collect_env_files(&path, recursive, depth + 1, collected);
                }
            } else if file_name.starts_with(".env") || file_name.ends_with(".env") {
                collected.push(path);
            }
        }
        Ok(())
    }

    pub fn import_batch_raw_documents(
        &self,
        project_id: &str,
        documents: Vec<(String, String)>,
        collision_policy: CollisionPolicy,
    ) -> AppResult<BatchImportReport> {
        let mut results = Vec::new();
        let mut errors = Vec::new();
        let mut imported_count = 0;
        let mut skipped_count = 0;
        let mut failed_count = 0;

        for (filename, content) in documents {
            if let Err(e) = validate_env_filename(&filename) {
                failed_count += 1;
                errors.push(format!("{filename}: {e}"));
                continue;
            }

            let existing = self.vault_service.list_env_documents(project_id)?;
            let matching = existing.into_iter().find(|d| d.filename == filename);

            let mut renamed_from = None;
            let final_filename = match (matching, collision_policy) {
                (None, _) => filename.clone(),
                (Some(existing_doc), CollisionPolicy::Overwrite) => {
                    match self.vault_service.update_env_document(&existing_doc.id, &content) {
                        Ok(doc) => {
                            imported_count += 1;
                            results.push(ImportResult {
                                document: doc,
                                renamed_from: None,
                            });
                        }
                        Err(e) => {
                            failed_count += 1;
                            errors.push(format!("{filename}: {e}"));
                        }
                    }
                    continue;
                }
                (Some(_), CollisionPolicy::Rename) => {
                    match self.generate_unique_filename(project_id, &filename) {
                        Ok(unique) => {
                            renamed_from = Some(filename.clone());
                            unique
                        }
                        Err(e) => {
                            failed_count += 1;
                            errors.push(format!("{filename}: {e}"));
                            continue;
                        }
                    }
                }
                (Some(_), CollisionPolicy::Cancel) | (Some(_), CollisionPolicy::Ask) => {
                    skipped_count += 1;
                    continue;
                }
            };

            match self.vault_service.create_env_document(project_id, &final_filename, &content) {
                Ok(doc) => {
                    imported_count += 1;
                    results.push(ImportResult {
                        document: doc,
                        renamed_from,
                    });
                }
                Err(e) => {
                    failed_count += 1;
                    errors.push(format!("{filename}: {e}"));
                }
            }
        }

        Ok(BatchImportReport {
            total_files: imported_count + skipped_count + failed_count,
            imported_count,
            skipped_count,
            failed_count,
            results,
            errors,
        })
    }

    fn generate_unique_filename(&self, project_id: &str, base_name: &str) -> AppResult<String> {
        let existing = self.vault_service.list_env_documents(project_id)?;
        let existing_names: std::collections::HashSet<String> =
            existing.into_iter().map(|d| d.filename).collect();

        for i in 1..1000 {
            let candidate = format!("{base_name}.{i}");
            if !existing_names.contains(&candidate) {
                return Ok(candidate);
            }
        }

        Err(AppError::Custom(
            "Could not generate a unique file name.".into(),
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::vault::repository::EncryptedFileRepository;
    use tempfile::tempdir;

    #[test]
    fn test_import_copy_in_semantics_and_source_deletion() {
        let vault_dir = tempdir().unwrap();
        let source_dir = tempdir().unwrap();

        let repo = Arc::new(EncryptedFileRepository::new(vault_dir.path().to_path_buf()));
        let vault_service = Arc::new(VaultService::new(repo));
        let import_service = ImportService::new(vault_service.clone());

        vault_service.initialize_vault("MasterPass12345!").unwrap();

        let project = vault_service
            .create_project("CopyIn Project", None, None)
            .unwrap();

        // Create source .env file
        let source_file_path = source_dir.path().join(".env.production");
        std::fs::write(
            &source_file_path,
            "DATABASE_URL=postgres://localhost:5432/db\nAPI_KEY=secret_123\n",
        )
        .unwrap();

        // Import into Vault
        let import_res = import_service
            .import_file_from_path(&project.id, &source_file_path, CollisionPolicy::Ask)
            .unwrap();

        assert_eq!(import_res.document.filename, ".env.production");
        assert_eq!(import_res.document.keys, vec!["DATABASE_URL", "API_KEY"]);

        // SIMULATE DELETION OF ENTIRE SOURCE PROJECT DIRECTORY
        std::fs::remove_dir_all(source_dir.path()).unwrap();
        assert!(!source_file_path.exists());

        // VERIFY VAULT RETENTION: Vault copy must remain fully intact and readable
        let verified_payload = vault_service
            .read_env_document(&import_res.document.id)
            .expect("Vault copy must remain completely readable after source project deletion");

        assert_eq!(
            verified_payload.raw_text,
            "DATABASE_URL=postgres://localhost:5432/db\nAPI_KEY=secret_123\n"
        );
    }

    #[test]
    fn test_batch_import_and_directory_scan() {
        let vault_dir = tempdir().unwrap();
        let source_dir = tempdir().unwrap();

        let repo = Arc::new(EncryptedFileRepository::new(vault_dir.path().to_path_buf()));
        let vault_service = Arc::new(VaultService::new(repo));
        let import_service = ImportService::new(vault_service.clone());

        vault_service.initialize_vault("MasterPass12345!").unwrap();

        let project = vault_service
            .create_project("Batch Project", None, None)
            .unwrap();

        // Create multiple source files
        let f1 = source_dir.path().join(".env");
        let f2 = source_dir.path().join(".env.local");
        let f3 = source_dir.path().join(".env.staging");
        std::fs::write(&f1, "PORT=3000\n").unwrap();
        std::fs::write(&f2, "API_KEY=local_key\n").unwrap();
        std::fs::write(&f3, "STAGE=true\n").unwrap();

        let batch_res = import_service.import_files_from_paths(
            &project.id,
            &[f1, f2, f3],
            CollisionPolicy::Ask,
        );

        assert_eq!(batch_res.total_files, 3);
        assert_eq!(batch_res.imported_count, 3);
        assert_eq!(batch_res.failed_count, 0);

        // Test Directory Scan
        let dir_res = import_service
            .import_directory_env_files(&project.id, source_dir.path(), false, CollisionPolicy::Rename)
            .unwrap();
        assert_eq!(dir_res.imported_count, 3);
        // With Rename policy, it should have created .env.1, .env.local.1, etc.
        let all_docs = vault_service.list_env_documents(&project.id).unwrap();
        assert_eq!(all_docs.len(), 6);
    }
}
