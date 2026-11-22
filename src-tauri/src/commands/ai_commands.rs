use std::sync::Arc;

use tauri::State;

use crate::ai::{self, AiAnswer, AiStatus};
use crate::error::{AppError, AppResult};
use crate::settings::service::SettingsService;

fn join_error() -> AppError {
    AppError::Custom("The local AI worker stopped unexpectedly.".into())
}

#[tauri::command]
pub async fn ai_status() -> AppResult<AiStatus> {
    tauri::async_runtime::spawn_blocking(ai::status)
        .await
        .map_err(|_| join_error())
}

#[tauri::command]
pub async fn ai_generate(
    model: String,
    prompt: String,
    system: Option<String>,
) -> AppResult<AiAnswer> {
    tauri::async_runtime::spawn_blocking(move || ai::generate(&model, &prompt, system.as_deref()))
        .await
        .map_err(|_| join_error())?
}

#[tauri::command]
pub async fn ai_pull(model: String) -> AppResult<AiStatus> {
    tauri::async_runtime::spawn_blocking(move || ai::pull(&model))
        .await
        .map_err(|_| join_error())?
}

#[tauri::command]
pub async fn ai_delete(model: String) -> AppResult<AiStatus> {
    tauri::async_runtime::spawn_blocking(move || ai::delete(&model))
        .await
        .map_err(|_| join_error())?
}

#[tauri::command]
pub async fn webhook_send(
    settings_service: State<'_, Arc<SettingsService>>,
    event: String,
    message: String,
) -> AppResult<()> {
    let settings = settings_service.get_settings();
    if !settings.webhook_enabled {
        return Err(AppError::Custom(
            "Webhooks are disabled in settings.".into(),
        ));
    }
    if event.trim().is_empty() || event.len() > 64 {
        return Err(AppError::Custom("Invalid webhook event.".into()));
    }
    if message.len() > 4000 {
        return Err(AppError::Custom("The webhook message is too long.".into()));
    }
    let url = settings.webhook_url.clone();
    let token = settings.webhook_token.clone();
    tauri::async_runtime::spawn_blocking(move || ai::send_webhook(&url, &token, &event, &message))
        .await
        .map_err(|_| join_error())?
}
