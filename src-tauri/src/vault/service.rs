use chrono::Utc;
use parking_lot::Mutex;
use std::sync::Arc;
use uuid::Uuid;

use crate::crypto::{derive_key, KdfParams};
use crate::env::{decode_and_validate_env_bytes, extract_env_keys, validate_env_filename};
use crate::error::{AppError, AppResult};
use crate::metadata::models::{EnvDocument, EnvSecretPayload, Project, VaultSnapshot};
use crate::vault::repository::VaultRepository;
use crate::vault::session::{VaultSession, VaultSessionState};

pub struct VaultService {
    repo: Arc<dyn VaultRepository>,
    session: Arc<Mutex<VaultSession>>,
}

impl VaultService {
    pub fn new(repo: Arc<dyn VaultRepository>) -> Self {
        let is_initialized = repo.is_initialized();
        Self {
            repo,
            session: Arc::new(Mutex::new(VaultSession::new(is_initialized))),
        }
    }

    pub fn get_state(&self) -> VaultSessionState {
        let mut session = self.session.lock();
        if !self.repo.is_initialized() {
            return VaultSessionState::Uninitialized;
        }
        session.check_auto_lock();
        session.get_state()
    }

    pub fn set_auto_lock_duration(&self, minutes: u32) {
        self.session.lock().set_auto_lock_duration(minutes);
    }

    pub fn initialize_vault(&self, password: &str) -> AppResult<()> {
        if password.trim().len() < 8 {
            return Err(AppError::Custom(
                "Ana parola en az 8 karakter olmalıdır.".to_string(),
            ));
        }

        if self.repo.is_initialized() {
            return Err(AppError::Custom("Vault zaten oluşturulmuş.".to_string()));
        }

        let salt = crate::crypto::generate_salt();
        let params = KdfParams::default();
        let master_key = derive_key(password, &salt, &params)?;

        self.repo.initialize(&master_key, params, &salt)?;
        self.session.lock().unlock(master_key);

        Ok(())
    }

    pub fn unlock_vault(&self, password: &str) -> AppResult<()> {
        let (salt, params) = self.repo.get_salt_and_params()?;
        let derived_key = derive_key(password, &salt, &params)?;

        // Try loading snapshot to authenticate password
        self.repo.load_snapshot(&derived_key)?;

        self.session.lock().unlock(derived_key);
        Ok(())
    }

    pub fn lock_vault(&self) {
        self.session.lock().lock();
    }

    pub fn reset_vault(&self) -> AppResult<()> {
        let mut session = self.session.lock();
        session.lock();
        self.repo.delete_vault_file()?;
        Ok(())
    }

    pub fn change_master_password(
        &self,
        current_password: &str,
        new_password: &str,
    ) -> AppResult<()> {
        if new_password.trim().len() < 8 {
            return Err(AppError::Custom(
                "Yeni ana parola en az 8 karakter olmalıdır.".to_string(),
            ));
        }

        let (salt, current_params) = self.repo.get_salt_and_params()?;
        let current_key = derive_key(current_password, &salt, &current_params)?;

        // Validate current password
        self.repo.load_snapshot(&current_key)?;

        // Derive new key with fresh salt
        let new_salt = crate::crypto::generate_salt();
        let new_params = KdfParams::default();
        let new_key = derive_key(new_password, &new_salt, &new_params)?;

        self.repo
            .rewrap_snapshot(&current_key, &new_key, new_params, &new_salt)?;
        self.session.lock().unlock(new_key);

        Ok(())
    }

    // --- Projects CRUD ---

    pub fn list_projects(&self) -> AppResult<Vec<Project>> {
        let master_key = self.session.lock().get_master_key()?;
        let snapshot = self.repo.load_snapshot(&master_key)?;
        Ok(snapshot.projects)
    }

    pub fn create_project(
        &self,
        name: &str,
        description: Option<String>,
        source_path: Option<String>,
    ) -> AppResult<Project> {
        let trimmed_name = name.trim();
        if trimmed_name.is_empty() {
            return Err(AppError::Custom("Proje adı boş bırakılamaz.".to_string()));
        }

        let master_key = self.session.lock().get_master_key()?;
        let mut snapshot = self.repo.load_snapshot(&master_key)?;

        let now = Utc::now().to_rfc3339();
        let project = Project {
            id: Uuid::new_v4().to_string(),
            name: trimmed_name.to_string(),
            description: description
                .map(|d| d.trim().to_string())
                .filter(|d| !d.is_empty()),
            source_path: source_path
                .map(|p| p.trim().to_string())
                .filter(|p| !p.is_empty()),
            created_at: now.clone(),
            updated_at: now,
            favorite: false,
            sort_order: None,
        };

        snapshot.projects.push(project.clone());
        self.repo.save_snapshot(&master_key, &snapshot)?;

        Ok(project)
    }

    pub fn update_project(
        &self,
        id: &str,
        name: &str,
        description: Option<String>,
        source_path: Option<String>,
        favorite: Option<bool>,
    ) -> AppResult<Project> {
        let trimmed_name = name.trim();
        if trimmed_name.is_empty() {
            return Err(AppError::Custom("Proje adı boş bırakılamaz.".to_string()));
        }

        let master_key = self.session.lock().get_master_key()?;
        let mut snapshot = self.repo.load_snapshot(&master_key)?;

        let project = snapshot
            .projects
            .iter_mut()
            .find(|p| p.id == id)
            .ok_or(AppError::ProjectNotFound)?;

        project.name = trimmed_name.to_string();
        project.description = description
            .map(|d| d.trim().to_string())
            .filter(|d| !d.is_empty());
        project.source_path = source_path
            .map(|p| p.trim().to_string())
            .filter(|p| !p.is_empty());
        if let Some(fav) = favorite {
            project.favorite = fav;
        }
        project.updated_at = Utc::now().to_rfc3339();

        let updated = project.clone();
        self.repo.save_snapshot(&master_key, &snapshot)?;

        Ok(updated)
    }

    pub fn delete_project(&self, id: &str) -> AppResult<()> {
        let master_key = self.session.lock().get_master_key()?;
        let mut snapshot = self.repo.load_snapshot(&master_key)?;

        let initial_len = snapshot.projects.len();
        snapshot.projects.retain(|p| p.id != id);

        if snapshot.projects.len() == initial_len {
            return Err(AppError::ProjectNotFound);
        }

        // Cascade delete env documents and secret payloads belonging to this project
        let removed_doc_ids: Vec<String> = snapshot
            .env_documents
            .iter()
            .filter(|doc| doc.project_id == id)
            .map(|doc| doc.id.clone())
            .collect();

        snapshot.env_documents.retain(|doc| doc.project_id != id);
        for doc_id in removed_doc_ids {
            snapshot.secrets.remove(&doc_id);
        }

        self.repo.save_snapshot(&master_key, &snapshot)?;
        Ok(())
    }

    // --- EnvDocuments CRUD ---

    pub fn list_env_documents(&self, project_id: &str) -> AppResult<Vec<EnvDocument>> {
        let master_key = self.session.lock().get_master_key()?;
        let snapshot = self.repo.load_snapshot(&master_key)?;

        let docs = snapshot
            .env_documents
            .into_iter()
            .filter(|doc| doc.project_id == project_id)
            .collect();

        Ok(docs)
    }

    pub fn read_env_document(&self, env_id: &str) -> AppResult<EnvSecretPayload> {
        let master_key = self.session.lock().get_master_key()?;
        let snapshot = self.repo.load_snapshot(&master_key)?;

        snapshot
            .secrets
            .get(env_id)
            .cloned()
            .ok_or(AppError::EnvDocumentNotFound)
    }

    pub fn get_env_document_and_payload(
        &self,
        env_id: &str,
    ) -> AppResult<(EnvDocument, EnvSecretPayload)> {
        let master_key = self.session.lock().get_master_key()?;
        let snapshot = self.repo.load_snapshot(&master_key)?;

        let doc = snapshot
            .env_documents
            .iter()
            .find(|d| d.id == env_id)
            .cloned()
            .ok_or(AppError::EnvDocumentNotFound)?;

        let payload = snapshot
            .secrets
            .get(env_id)
            .cloned()
            .ok_or(AppError::EnvDocumentNotFound)?;

        Ok((doc, payload))
    }

    pub fn create_env_document(
        &self,
        project_id: &str,
        filename: &str,
        raw_text: &str,
    ) -> AppResult<EnvDocument> {
        self.create_env_document_with_source(project_id, filename, raw_text, None)
    }

    pub fn create_env_document_with_source(
        &self,
        project_id: &str,
        filename: &str,
        raw_text: &str,
        source_path: Option<String>,
    ) -> AppResult<EnvDocument> {
        validate_env_filename(filename)?;

        let decoded = decode_and_validate_env_bytes(raw_text.as_bytes())?;
        let keys = extract_env_keys(&decoded.raw_text);

        let master_key = self.session.lock().get_master_key()?;
        let mut snapshot = self.repo.load_snapshot(&master_key)?;

        // Verify project exists
        if !snapshot.projects.iter().any(|p| p.id == project_id) {
            return Err(AppError::ProjectNotFound);
        }

        // Verify unique filename in project
        if snapshot
            .env_documents
            .iter()
            .any(|d| d.project_id == project_id && d.filename.eq_ignore_ascii_case(filename))
        {
            return Err(AppError::Custom(
                "Aynı projede bu isimde bir ortam dosyası zaten mevcut.".to_string(),
            ));
        }

        let now = Utc::now().to_rfc3339();
        let doc_id = Uuid::new_v4().to_string();

        let env_doc = EnvDocument {
            id: doc_id.clone(),
            project_id: project_id.to_string(),
            filename: filename.to_string(),
            display_name: None,
            source_path,
            source_imported_at: now.clone(),
            created_at: now.clone(),
            updated_at: now.clone(),
            byte_length: raw_text.len(),
            key_count: keys.len(),
            keys,
        };

        let payload = EnvSecretPayload {
            filename: filename.to_string(),
            encoding: "utf-8".to_string(),
            line_ending: decoded.line_ending,
            had_bom: decoded.had_bom,
            raw_text: decoded.raw_text,
        };

        snapshot.env_documents.push(env_doc.clone());
        snapshot.secrets.insert(doc_id, payload);

        // Update project updatedAt
        if let Some(proj) = snapshot.projects.iter_mut().find(|p| p.id == project_id) {
            proj.updated_at = now;
        }

        self.repo.save_snapshot(&master_key, &snapshot)?;
        Ok(env_doc)
    }

    pub fn update_env_document(&self, env_id: &str, raw_text: &str) -> AppResult<EnvDocument> {
        let decoded = decode_and_validate_env_bytes(raw_text.as_bytes())?;
        let keys = extract_env_keys(&decoded.raw_text);

        let master_key = self.session.lock().get_master_key()?;
        let mut snapshot = self.repo.load_snapshot(&master_key)?;

        let now = Utc::now().to_rfc3339();
        let project_id: String;

        {
            let doc = snapshot
                .env_documents
                .iter_mut()
                .find(|d| d.id == env_id)
                .ok_or(AppError::EnvDocumentNotFound)?;

            doc.updated_at = now.clone();
            doc.byte_length = raw_text.len();
            doc.key_count = keys.len();
            doc.keys = keys;
            project_id = doc.project_id.clone();
        }

        let filename = snapshot
            .env_documents
            .iter()
            .find(|d| d.id == env_id)
            .map(|d| d.filename.clone())
            .unwrap_or_else(|| ".env".to_string());

        let payload = EnvSecretPayload {
            filename,
            encoding: "utf-8".to_string(),
            line_ending: decoded.line_ending,
            had_bom: decoded.had_bom,
            raw_text: decoded.raw_text,
        };

        snapshot.secrets.insert(env_id.to_string(), payload);

        if let Some(proj) = snapshot.projects.iter_mut().find(|p| p.id == project_id) {
            proj.updated_at = now;
        }

        let updated_doc = snapshot
            .env_documents
            .iter()
            .find(|d| d.id == env_id)
            .cloned()
            .ok_or(AppError::EnvDocumentNotFound)?;

        self.repo.save_snapshot(&master_key, &snapshot)?;
        Ok(updated_doc)
    }

    pub fn rename_env_document(&self, env_id: &str, new_filename: &str) -> AppResult<EnvDocument> {
        validate_env_filename(new_filename)?;

        let master_key = self.session.lock().get_master_key()?;
        let mut snapshot = self.repo.load_snapshot(&master_key)?;

        let (project_id, old_filename) = {
            let doc = snapshot
                .env_documents
                .iter()
                .find(|d| d.id == env_id)
                .ok_or(AppError::EnvDocumentNotFound)?;
            (doc.project_id.clone(), doc.filename.clone())
        };

        if old_filename.eq_ignore_ascii_case(new_filename) {
            let doc = snapshot
                .env_documents
                .iter()
                .find(|d| d.id == env_id)
                .cloned()
                .unwrap();
            return Ok(doc);
        }

        if snapshot.env_documents.iter().any(|d| {
            d.project_id == project_id
                && d.id != env_id
                && d.filename.eq_ignore_ascii_case(new_filename)
        }) {
            return Err(AppError::Custom(
                "Aynı projede bu isimde bir ortam dosyası zaten mevcut.".to_string(),
            ));
        }

        let now = Utc::now().to_rfc3339();
        let doc = snapshot
            .env_documents
            .iter_mut()
            .find(|d| d.id == env_id)
            .ok_or(AppError::EnvDocumentNotFound)?;

        doc.filename = new_filename.to_string();
        doc.updated_at = now.clone();

        if let Some(secret) = snapshot.secrets.get_mut(env_id) {
            secret.filename = new_filename.to_string();
        }

        if let Some(proj) = snapshot.projects.iter_mut().find(|p| p.id == project_id) {
            proj.updated_at = now;
        }

        let updated_doc = doc.clone();
        self.repo.save_snapshot(&master_key, &snapshot)?;
        Ok(updated_doc)
    }

    pub fn delete_env_document(&self, env_id: &str) -> AppResult<()> {
        let master_key = self.session.lock().get_master_key()?;
        let mut snapshot = self.repo.load_snapshot(&master_key)?;

        let initial_len = snapshot.env_documents.len();
        snapshot.env_documents.retain(|d| d.id != env_id);

        if snapshot.env_documents.len() == initial_len {
            return Err(AppError::EnvDocumentNotFound);
        }

        snapshot.secrets.remove(env_id);
        self.repo.save_snapshot(&master_key, &snapshot)?;

        Ok(())
    }

    pub fn delete_env_documents_batch(&self, env_ids: &[String]) -> AppResult<()> {
        if env_ids.is_empty() {
            return Ok(());
        }

        let master_key = self.session.lock().get_master_key()?;
        let mut snapshot = self.repo.load_snapshot(&master_key)?;

        let id_set: std::collections::HashSet<_> = env_ids.iter().map(|s| s.as_str()).collect();
        snapshot.env_documents.retain(|d| !id_set.contains(d.id.as_str()));
        for id in env_ids {
            snapshot.secrets.remove(id);
        }

        self.repo.save_snapshot(&master_key, &snapshot)?;
        Ok(())
    }


    // Direct access to snapshot for backup/restore operations
    pub fn get_snapshot(&self) -> AppResult<VaultSnapshot> {
        let master_key = self.session.lock().get_master_key()?;
        self.repo.load_snapshot(&master_key)
    }

    pub fn replace_snapshot(&self, snapshot: &VaultSnapshot) -> AppResult<()> {
        let master_key = self.session.lock().get_master_key()?;
        self.repo.save_snapshot(&master_key, snapshot)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::vault::repository::EncryptedFileRepository;
    use tempfile::tempdir;

    fn setup_service() -> (tempfile::TempDir, VaultService) {
        let dir = tempdir().unwrap();
        let repo = Arc::new(EncryptedFileRepository::new(dir.path().to_path_buf()));
        let service = VaultService::new(repo);
        (dir, service)
    }

    #[test]
    fn test_vault_initialization_and_crud() {
        let (_dir, service) = setup_service();
        assert_eq!(service.get_state(), VaultSessionState::Uninitialized);

        service.initialize_vault("StrongPassword123!").unwrap();
        assert_eq!(service.get_state(), VaultSessionState::Unlocked);

        // Create Project
        let project = service
            .create_project("Vellium API", Some("Backend service".to_string()), None)
            .unwrap();
        assert_eq!(project.name, "Vellium API");

        // Add Env Document
        let raw_content = "DATABASE_URL=postgres://localhost:5432/main\nAPI_KEY=test-secret\n";
        let doc = service
            .create_env_document(&project.id, ".env", raw_content)
            .unwrap();
        assert_eq!(doc.filename, ".env");
        assert_eq!(doc.keys, vec!["DATABASE_URL", "API_KEY"]);

        // Read Env Document
        let payload = service.read_env_document(&doc.id).unwrap();
        assert_eq!(payload.raw_text, raw_content);

        // Update Env Document
        let updated_content =
            "DATABASE_URL=postgres://localhost:5432/main\nAPI_KEY=updated-secret\nPORT=8080\n";
        let updated_doc = service
            .update_env_document(&doc.id, updated_content)
            .unwrap();
        assert_eq!(updated_doc.keys, vec!["DATABASE_URL", "API_KEY", "PORT"]);

        // Lock Vault
        service.lock_vault();
        assert_eq!(service.get_state(), VaultSessionState::Locked);
        assert!(service.read_env_document(&doc.id).is_err());

        // Unlock with correct password
        service.unlock_vault("StrongPassword123!").unwrap();
        assert_eq!(service.get_state(), VaultSessionState::Unlocked);
        let read_after_unlock = service.read_env_document(&doc.id).unwrap();
        assert_eq!(read_after_unlock.raw_text, updated_content);

        // Test Batch Delete
        let doc2 = service
            .create_env_document(&project.id, ".env.production", "PROD=true\n")
            .unwrap();
        let doc3 = service
            .create_env_document(&project.id, ".env.staging", "STAGING=true\n")
            .unwrap();

        assert_eq!(service.list_env_documents(&project.id).unwrap().len(), 3);
        service
            .delete_env_documents_batch(&[doc.id.clone(), doc2.id.clone()])
            .unwrap();

        let remaining = service.list_env_documents(&project.id).unwrap();
        assert_eq!(remaining.len(), 1);
        assert_eq!(remaining[0].id, doc3.id);
    }
}

