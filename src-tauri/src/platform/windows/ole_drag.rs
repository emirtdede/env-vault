#![cfg(target_os = "windows")]

use std::sync::mpsc;
use std::sync::Arc;
use std::thread;

use crate::error::AppResult;
use crate::metadata::models::EnvSecretPayload;
use crate::vault::service::VaultService;

pub fn start_virtual_file_drag(vault_service: Arc<VaultService>, env_id: String) -> AppResult<()> {
    let payload = vault_service.read_env_document(&env_id)?;
    start_virtual_file_drag_sta(payload)
}

pub fn start_virtual_file_drag_sta(payload: EnvSecretPayload) -> AppResult<()> {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        use windows::Win32::System::Ole::{OleInitialize, OleUninitialize};

        unsafe {
            let _ = OleInitialize(None);
        }

        let _ = tx.send(Ok(()));

        let _filename = payload.filename.clone();
        let _content_bytes =
            crate::env::encode_env_text(&payload.raw_text, payload.had_bom, &payload.line_ending);

        unsafe {
            OleUninitialize();
        }
    });

    rx.recv().unwrap_or(Ok(()))
}
