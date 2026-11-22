//! Local AI (Ollama), retrieval helpers and webhook delivery.
//!
//! Everything here is opt-in and loopback-first: the AI bridge only ever talks
//! to `127.0.0.1:11434`, and webhooks are delivered only to the URL the user
//! stored in settings. No secret material leaves the machine by default.

use std::time::Duration;

use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::error::{AppError, AppResult};

const OLLAMA_BASE: &str = "http://127.0.0.1:11434";
const MAX_MODEL_NAME: usize = 100;
const MAX_WEBHOOK_URL: usize = 2048;

fn client(timeout: Duration) -> AppResult<reqwest::blocking::Client> {
    reqwest::blocking::Client::builder()
        .timeout(timeout)
        .build()
        .map_err(|_| AppError::Custom("The local AI client could not be created.".into()))
}

fn valid_model_name(name: &str) -> bool {
    !name.is_empty()
        && name.len() <= MAX_MODEL_NAME
        && !name.contains("..")
        && !name.starts_with('/')
        && !name.starts_with('.')
        && name
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | ':' | '/' | '-'))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiModel {
    pub name: String,
    pub size: u64,
    pub modified_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiStatus {
    pub available: bool,
    pub models: Vec<AiModel>,
    pub endpoint: String,
}

#[derive(Debug, Deserialize)]
struct TagsResponse {
    #[serde(default)]
    models: Vec<TagModel>,
}

#[derive(Debug, Deserialize)]
struct TagModel {
    name: String,
    #[serde(default)]
    size: u64,
    #[serde(default)]
    modified_at: String,
}

/// Reports whether a local Ollama instance is reachable and which models it has.
pub fn status() -> AiStatus {
    let mut status = AiStatus {
        available: false,
        models: Vec::new(),
        endpoint: OLLAMA_BASE.to_string(),
    };
    let Ok(http) = client(Duration::from_millis(1200)) else {
        return status;
    };
    let Ok(response) = http.get(format!("{OLLAMA_BASE}/api/tags")).send() else {
        return status;
    };
    if !response.status().is_success() {
        return status;
    }
    let Ok(tags) = response.json::<TagsResponse>() else {
        return status;
    };
    status.available = true;
    status.models = tags
        .models
        .into_iter()
        .map(|model| AiModel {
            name: model.name,
            size: model.size,
            modified_at: model.modified_at,
        })
        .collect();
    status
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiAnswer {
    pub text: String,
    pub model: String,
}

/// Sends a single prompt to the selected local model and returns its answer.
/// The call is bounded so a stalled model can never freeze the interface.
pub fn generate(model: &str, prompt: &str, system: Option<&str>) -> AppResult<AiAnswer> {
    if !valid_model_name(model) {
        return Err(AppError::Custom("Invalid model name.".into()));
    }
    if prompt.trim().is_empty() || prompt.len() > 12_000 {
        return Err(AppError::Custom("Invalid prompt.".into()));
    }
    let http = client(Duration::from_secs(90))?;
    let mut body = json!({
        "model": model,
        "prompt": prompt,
        "stream": false,
        "options": { "temperature": 0.2 },
    });
    if let Some(system) = system {
        body["system"] = json!(system);
    }
    let response = http
        .post(format!("{OLLAMA_BASE}/api/generate"))
        .json(&body)
        .send()
        .map_err(|_| AppError::Custom("The local AI model is not reachable.".into()))?;
    if !response.status().is_success() {
        return Err(AppError::Custom(
            "The local AI model rejected the request.".into(),
        ));
    }
    #[derive(Deserialize)]
    struct GenerateResponse {
        #[serde(default)]
        response: String,
    }
    let parsed = response
        .json::<GenerateResponse>()
        .map_err(|_| AppError::Custom("The local AI response was invalid.".into()))?;
    Ok(AiAnswer {
        text: parsed.response.trim().to_string(),
        model: model.to_string(),
    })
}

/// Downloads a model into the local Ollama store. Blocking by design: the
/// caller runs it on a worker thread and reports progress when it completes.
pub fn pull(model: &str) -> AppResult<AiStatus> {
    if !valid_model_name(model) {
        return Err(AppError::Custom("Invalid model name.".into()));
    }
    let http = client(Duration::from_secs(60 * 30))?;
    let response = http
        .post(format!("{OLLAMA_BASE}/api/pull"))
        .json(&json!({ "name": model, "stream": false }))
        .send()
        .map_err(|_| AppError::Custom("The model could not be downloaded.".into()))?;
    if !response.status().is_success() {
        return Err(AppError::Custom(
            "The model could not be downloaded.".into(),
        ));
    }
    Ok(status())
}

/// Removes a downloaded model from the local Ollama store.
pub fn delete(model: &str) -> AppResult<AiStatus> {
    if !valid_model_name(model) {
        return Err(AppError::Custom("Invalid model name.".into()));
    }
    let http = client(Duration::from_secs(20))?;
    let response = http
        .delete(format!("{OLLAMA_BASE}/api/delete"))
        .json(&json!({ "name": model }))
        .send()
        .map_err(|_| AppError::Custom("The model could not be removed.".into()))?;
    if !response.status().is_success() {
        return Err(AppError::Custom("The model could not be removed.".into()));
    }
    Ok(status())
}

fn valid_webhook_url(value: &str) -> bool {
    let trimmed = value.trim();
    if trimmed.is_empty() || trimmed.len() > MAX_WEBHOOK_URL {
        return false;
    }
    let lower = trimmed.to_ascii_lowercase();
    if !(lower.starts_with("https://") || lower.starts_with("http://")) {
        return false;
    }
    // Reject embedded credentials and whitespace, both common smuggling tricks.
    !trimmed.contains('@') && !trimmed.chars().any(char::is_whitespace)
}

/// Delivers one signed event to the configured webhook endpoint.
pub fn send_webhook(url: &str, token: &str, event: &str, message: &str) -> AppResult<()> {
    if !valid_webhook_url(url) {
        return Err(AppError::Custom("Invalid webhook URL.".into()));
    }
    let http = client(Duration::from_secs(12))?;
    let payload = json!({
        "app": "env-vault",
        "version": env!("CARGO_PKG_VERSION"),
        "event": event,
        "message": message,
        "timestamp": chrono::Utc::now().to_rfc3339(),
    });
    let mut request = http.post(url.trim()).json(&payload);
    if !token.trim().is_empty() {
        request = request.header("X-EnvVault-Token", token.trim());
    }
    let response = request
        .send()
        .map_err(|_| AppError::Custom("The webhook could not be delivered.".into()))?;
    if response.status().is_success() {
        Ok(())
    } else {
        Err(AppError::Custom(format!(
            "The webhook endpoint replied with status {}.",
            response.status().as_u16()
        )))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn model_names_are_restricted() {
        assert!(valid_model_name("llama3.2:latest"));
        assert!(valid_model_name("qwen2.5-coder/7b"));
        assert!(!valid_model_name(""));
        assert!(!valid_model_name("bad model"));
        assert!(!valid_model_name("../../etc/passwd"));
    }

    #[test]
    fn webhook_urls_must_be_absolute_http() {
        assert!(valid_webhook_url("https://example.com/hook"));
        assert!(valid_webhook_url("http://127.0.0.1:9000/hook"));
        assert!(!valid_webhook_url("ftp://example.com"));
        assert!(!valid_webhook_url("https://user:pass@example.com"));
        assert!(!valid_webhook_url("https://example.com/a b"));
    }
}

