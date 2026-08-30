use std::sync::Arc;
use tempfile::tempdir;
use uuid::Uuid;

use env_vault_lib::backup::service::{BackupService, RestoreMode};
use env_vault_lib::import::service::ImportService;
use env_vault_lib::settings::models::CollisionPolicy;
use env_vault_lib::vault::repository::EncryptedFileRepository;
use env_vault_lib::vault::service::VaultService;

/// GATE 1: Copy-in Semantics & Source Project Deletion Test
#[test]
fn test_gate1_copy_in_source_deletion_resilience() {
    let vault_dir = tempdir().unwrap();
    let source_dir = tempdir().unwrap();

    let repo = Arc::new(EncryptedFileRepository::new(vault_dir.path().to_path_buf()));
    let vault = Arc::new(VaultService::new(repo.clone()));
    let import = ImportService::new(vault.clone());

    vault.initialize_vault("StrongMasterPassword2026!").unwrap();

    let proj = vault
        .create_project("Mission Critical Project", None, None)
        .unwrap();

    let source_env_path = source_dir.path().join(".env.production");
    let test_secret_body = "DATABASE_URL=postgres://master:secret@10.0.0.1/production\nAWS_SECRET_KEY=AKIAIOSFODNN7EXAMPLE\n";
    std::fs::write(&source_env_path, test_secret_body).unwrap();

    // Import into Vault
    let import_res = import
        .import_file_from_path(&proj.id, &source_env_path, CollisionPolicy::Overwrite)
        .unwrap();

    assert_eq!(import_res.document.filename, ".env.production");

    // DELETE ENTIRE SOURCE FOLDER
    std::fs::remove_dir_all(source_dir.path()).unwrap();
    assert!(!source_env_path.exists());

    // LOCK & RE-OPEN VAULT FROM DISK
    vault.lock_vault();
    let fresh_vault = Arc::new(VaultService::new(repo));
    fresh_vault
        .unlock_vault("StrongMasterPassword2026!")
        .unwrap();

    // Verify secret content is 100% intact and unaffected
    let read_payload = fresh_vault
        .read_env_document(&import_res.document.id)
        .expect("Vault copy must remain completely readable after source project deletion");

    assert_eq!(read_payload.raw_text, test_secret_body);
}

/// GATE 2: Plaintext Leakage Audit (0 plaintext matches in storage file)
#[test]
fn test_gate2_zero_plaintext_leakage_in_storage() {
    let vault_dir = tempdir().unwrap();
    let unique_marker = format!("ENV_VAULT_RELEASE_AUDIT_SECRET_{}", Uuid::new_v4());

    let repo = Arc::new(EncryptedFileRepository::new(vault_dir.path().to_path_buf()));
    let vault = Arc::new(VaultService::new(repo));

    vault.initialize_vault("AuditorMasterKey999!").unwrap();

    let proj = vault.create_project("Audit Project", None, None).unwrap();
    let env_content = format!("SUPER_SECRET_TOKEN={}\nAPI_KEY=top_secret\n", unique_marker);

    let doc = vault
        .create_env_document(&proj.id, ".env", &env_content)
        .unwrap();
    assert_eq!(doc.filename, ".env");

    vault.lock_vault();

    // Read the raw bytes of the stored container on disk
    let storage_file_path = vault_dir.path().join("vault.evault");
    assert!(storage_file_path.exists());

    let raw_bytes = std::fs::read(&storage_file_path).unwrap();
    let search_bytes = unique_marker.as_bytes();

    // Perform byte search across the entire file
    let found = raw_bytes
        .windows(search_bytes.len())
        .any(|window| window == search_bytes);
    assert!(
        !found,
        "CRITICAL VULNERABILITY: Plaintext secret was found on disk in unencrypted form!"
    );

    // Also verify sub-secret strings aren't leaked
    assert!(!raw_bytes
        .windows(b"SUPER_SECRET_TOKEN".len())
        .any(|w| w == b"SUPER_SECRET_TOKEN"));
    assert!(!raw_bytes
        .windows(b"top_secret".len())
        .any(|w| w == b"top_secret"));
    assert!(!raw_bytes
        .windows(b"AuditorMasterKey999!".len())
        .any(|w| w == b"AuditorMasterKey999!"));
}

/// GATE 3: 20 Projects / 50 Envs Backup & Restore Integrity Gate
#[test]
fn test_gate3_large_scale_backup_restore_fidelity() {
    let vault_dir = tempdir().unwrap();
    let backup_dir = tempdir().unwrap();

    let repo = Arc::new(EncryptedFileRepository::new(vault_dir.path().to_path_buf()));
    let vault = Arc::new(VaultService::new(repo));
    vault.initialize_vault("MainVaultPass2026!").unwrap();

    // Create 20 projects with 2-3 env documents each (total 50 documents)
    let mut total_docs = 0;
    for p_idx in 1..=20 {
        let proj = vault
            .create_project(&format!("Project {:02}", p_idx), None, None)
            .unwrap();

        let doc_types = if p_idx % 2 == 0 {
            vec![".env", ".env.local", ".env.production"]
        } else {
            vec![".env", ".env.staging"]
        };

        for doc_name in doc_types {
            let content = format!(
                "# Config for {}\nPROJECT_ID={}\nSECRET_KEY=val_{}_{}\n",
                doc_name, proj.id, p_idx, total_docs
            );
            vault
                .create_env_document(&proj.id, doc_name, &content)
                .unwrap();
            total_docs += 1;
        }
    }

    assert_eq!(total_docs, 50);

    let backup_service = BackupService::new(vault.clone());
    let backup_path = backup_dir.path().join("production_backup_20_50.evault");

    // 1. Create encrypted backup
    backup_service
        .create_backup(&backup_path, "BackupPassphrase2026!")
        .unwrap();
    assert!(backup_path.exists());

    // 2. Inspect preview
    let preview = backup_service
        .inspect_backup(&backup_path, "BackupPassphrase2026!")
        .unwrap();
    assert_eq!(preview.project_count, 20);
    assert_eq!(preview.env_document_count, 50);

    // 3. Restore into a clean fresh vault
    let fresh_vault_dir = tempdir().unwrap();
    let fresh_repo = Arc::new(EncryptedFileRepository::new(
        fresh_vault_dir.path().to_path_buf(),
    ));
    let fresh_vault = Arc::new(VaultService::new(fresh_repo));
    fresh_vault.initialize_vault("FreshInstallPass!").unwrap();

    let fresh_backup_service = BackupService::new(fresh_vault.clone());
    fresh_backup_service
        .restore_backup(&backup_path, "BackupPassphrase2026!", RestoreMode::Replace)
        .unwrap();

    // 4. Verify all 20 projects and 50 documents are intact
    let restored_projects = fresh_vault.list_projects().unwrap();
    assert_eq!(restored_projects.len(), 20);

    let mut restored_doc_count = 0;
    for proj in restored_projects {
        let docs = fresh_vault.list_env_documents(&proj.id).unwrap();
        for doc in docs {
            let payload = fresh_vault.read_env_document(&doc.id).unwrap();
            assert!(payload.raw_text.contains(&proj.id));
            restored_doc_count += 1;
        }
    }

    assert_eq!(restored_doc_count, 50);
}

/// GATE 4: Master Password Modification and State Transition Gate
#[test]
fn test_gate4_master_password_change_and_security() {
    let vault_dir = tempdir().unwrap();
    let repo = Arc::new(EncryptedFileRepository::new(vault_dir.path().to_path_buf()));
    let vault = Arc::new(VaultService::new(repo.clone()));

    vault.initialize_vault("OldSecretPass123!").unwrap();

    let proj = vault
        .create_project("Security Test Proj", None, None)
        .unwrap();
    let doc = vault
        .create_env_document(&proj.id, ".env", "API_KEY=unchanged_val\n")
        .unwrap();

    // Change master password
    vault
        .change_master_password("OldSecretPass123!", "NewSecretPass456!")
        .unwrap();

    // Lock vault
    vault.lock_vault();

    // Verify old password FAILS
    let unlock_old = vault.unlock_vault("OldSecretPass123!");
    assert!(unlock_old.is_err());

    // Verify new password SUCCEEDS
    let unlock_new = vault.unlock_vault("NewSecretPass456!");
    assert!(unlock_new.is_ok());

    let payload = vault.read_env_document(&doc.id).unwrap();
    assert_eq!(payload.raw_text, "API_KEY=unchanged_val\n");
}
