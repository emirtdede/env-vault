use crate::crypto::KdfParams;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source_path: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub favorite: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sort_order: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct EnvDocument {
    pub id: String,
    pub project_id: String,
    pub filename: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source_path: Option<String>,
    pub source_imported_at: String,
    pub created_at: String,
    pub updated_at: String,
    pub byte_length: usize,
    pub key_count: usize,
    pub keys: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct EnvSecretPayload {
    pub filename: String,
    pub encoding: String,
    pub line_ending: String,
    pub had_bom: bool,
    pub raw_text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultSnapshot {
    pub schema_version: u32,
    pub kdf_params: KdfParams,
    pub salt: Vec<u8>,
    pub projects: Vec<Project>,
    pub env_documents: Vec<EnvDocument>,
    pub secrets: HashMap<String, EnvSecretPayload>, // Key is EnvDocument.id
}

impl VaultSnapshot {
    pub fn new(kdf_params: KdfParams, salt: Vec<u8>) -> Self {
        Self {
            schema_version: 1,
            kdf_params,
            salt,
            projects: Vec::new(),
            env_documents: Vec::new(),
            secrets: HashMap::new(),
        }
    }
}
