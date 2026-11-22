//! Loopback bridge that exposes the unlocked vault to the bundled CLI and MCP
//! server.
//!
//! Security model:
//! - the listener binds to 127.0.0.1 on an ephemeral port only,
//! - every request must carry the random bearer token written to
//!   `bridge.json` in the app data directory,
//! - the bridge is off unless the user enables it,
//! - data is only served while the vault session is unlocked, and
//! - secrets never leave the machine: the CLI talks to this loopback socket.

pub mod cli;

use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::Duration;

use parking_lot::Mutex;
use rand::RngCore;
use serde::Serialize;
use serde_json::json;

use crate::error::{AppError, AppResult};
use crate::vault::service::VaultService;
use crate::vault::session::VaultSessionState;

pub const BRIDGE_FILE: &str = "bridge.json";
const MAX_HEADER_BYTES: usize = 16 * 1024;
const IO_TIMEOUT: Duration = Duration::from_secs(5);

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BridgeInfo {
    pub running: bool,
    pub port: Option<u16>,
    pub endpoint: Option<String>,
    pub cli_path: String,
    pub data_dir: String,
}

pub struct BridgeState {
    data_dir: PathBuf,
    stop: Arc<AtomicBool>,
    worker: Mutex<Option<thread::JoinHandle<()>>>,
    port: Mutex<Option<u16>>,
    token: Mutex<Option<String>>,
}

impl BridgeState {
    pub fn new(data_dir: PathBuf) -> Self {
        Self {
            data_dir,
            stop: Arc::new(AtomicBool::new(false)),
            worker: Mutex::new(None),
            port: Mutex::new(None),
            token: Mutex::new(None),
        }
    }

    pub fn info(&self) -> BridgeInfo {
        let port = *self.port.lock();
        BridgeInfo {
            running: port.is_some(),
            port,
            endpoint: port.map(|value| format!("http://127.0.0.1:{value}")),
            cli_path: cli::script_path(&self.data_dir).to_string_lossy().to_string(),
            data_dir: self.data_dir.to_string_lossy().to_string(),
        }
    }

    pub fn start(&self, vault: Arc<VaultService>) -> AppResult<BridgeInfo> {
        if self.port.lock().is_some() {
            return Ok(self.info());
        }

        let listener = TcpListener::bind(("127.0.0.1", 0))
            .map_err(|_| AppError::Custom("BRIDGE_BIND_FAILED".into()))?;
        listener.set_nonblocking(true)?;
        let port = listener
            .local_addr()
            .map_err(|_| AppError::Custom("BRIDGE_BIND_FAILED".into()))?
            .port();
        let token = random_token();

        self.write_endpoint(port, &token)?;
        *self.port.lock() = Some(port);
        *self.token.lock() = Some(token.clone());
        self.stop.store(false, Ordering::SeqCst);

        let stop = self.stop.clone();
        let worker = thread::Builder::new()
            .name("env-vault-bridge".into())
            .spawn(move || {
                while !stop.load(Ordering::SeqCst) {
                    match listener.accept() {
                        Ok((stream, _address)) => {
                            let _ = serve(stream, &vault, &token);
                        }
                        Err(ref error) if error.kind() == std::io::ErrorKind::WouldBlock => {
                            thread::sleep(Duration::from_millis(120));
                        }
                        Err(_) => break,
                    }
                }
            })
            .map_err(|_| AppError::Custom("BRIDGE_START_FAILED".into()))?;

        *self.worker.lock() = Some(worker);
        Ok(self.info())
    }

    pub fn stop(&self) {
        self.stop.store(true, Ordering::SeqCst);
        if let Some(worker) = self.worker.lock().take() {
            let _ = worker.join();
        }
        *self.port.lock() = None;
        *self.token.lock() = None;
        let _ = std::fs::remove_file(self.data_dir.join(BRIDGE_FILE));
    }

    fn write_endpoint(&self, port: u16, token: &str) -> AppResult<()> {
        std::fs::create_dir_all(&self.data_dir)?;
        let payload = json!({
            "version": 1,
            "app": "Env Vault",
            "port": port,
            "token": token,
            "pid": std::process::id(),
        });
        let body = serde_json::to_vec_pretty(&payload)
            .map_err(|_| AppError::SettingsWriteFailed)?;
        let target = self.data_dir.join(BRIDGE_FILE);
        let temporary = self.data_dir.join("bridge.json.tmp");
        std::fs::write(&temporary, &body)?;
        if std::fs::rename(&temporary, &target).is_err() {
            let _ = std::fs::remove_file(&target);
            std::fs::rename(&temporary, &target)?;
        }
        restrict_permissions(&target);
        Ok(())
    }
}

impl Drop for BridgeState {
    fn drop(&mut self) {
        if self.port.lock().is_some() {
            self.stop();
        }
    }
}

fn random_token() -> String {
    let mut bytes = [0u8; 32];
    rand::rngs::OsRng.fill_bytes(&mut bytes);
    bytes.iter().map(|byte| format!("{byte:02x}")).collect()
}

fn restrict_permissions(path: &std::path::Path) {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = std::fs::set_permissions(path, std::fs::Permissions::from_mode(0o600));
    }
    #[cfg(not(unix))]
    {
        let _ = path;
    }
}

struct HttpRequest {
    method: String,
    path: String,
    authorization: Option<String>,
}

fn serve(mut stream: TcpStream, vault: &VaultService, token: &str) -> std::io::Result<()> {
    // The listener is non-blocking so the accept loop can observe the stop
    // flag; on Windows an accepted socket inherits that mode, so it has to be
    // switched back before any read or write or every request fails instantly.
    let _ = stream.set_nonblocking(false);
    let _ = stream.set_read_timeout(Some(IO_TIMEOUT));
    let _ = stream.set_write_timeout(Some(IO_TIMEOUT));

    let mut buffer = Vec::with_capacity(2048);
    let mut chunk = [0u8; 1024];
    loop {
        let read = stream.read(&mut chunk)?;
        if read == 0 {
            break;
        }
        buffer.extend_from_slice(&chunk[..read]);
        if buffer.windows(4).any(|window| window == b"\r\n\r\n")
            || buffer.len() >= MAX_HEADER_BYTES
        {
            break;
        }
    }

    let request = match parse_request(&buffer) {
        Some(value) => value,
        None => {
            return write_json(&mut stream, 400, &json!({ "error": { "code": "BAD_REQUEST", "message": "Malformed request." } }));
        }
    };

    if request.method != "GET" {
        return write_json(
            &mut stream,
            405,
            &json!({ "error": { "code": "METHOD_NOT_ALLOWED", "message": "Only GET is supported." } }),
        );
    }

    let presented = request
        .authorization
        .as_deref()
        .and_then(|value| value.strip_prefix("Bearer "))
        .unwrap_or("");
    if !constant_time_eq(presented.as_bytes(), token.as_bytes()) {
        return write_json(
            &mut stream,
            401,
            &json!({ "error": { "code": "UNAUTHORIZED", "message": "A valid bridge token is required." } }),
        );
    }

    let path = request.path.split('?').next().unwrap_or("/");
    let unlocked = matches!(vault.get_state(), VaultSessionState::Unlocked);

    match path {
        "/v1/status" => {
            let (project_count, env_count) = if unlocked {
                vault.snapshot_summary().unwrap_or((0, 0))
            } else {
                (0, 0)
            };
            write_json(
                &mut stream,
                200,
                &json!({
                    "app": "Env Vault",
                    "version": env!("CARGO_PKG_VERSION"),
                    "unlocked": unlocked,
                    "projectCount": project_count,
                    "envCount": env_count,
                }),
            )
        }
        "/v1/projects" => {
            if !unlocked {
                return write_json(&mut stream, 423, &locked_error());
            }
            match project_payload(vault) {
                Ok(payload) => write_json(&mut stream, 200, &payload),
                Err(error) => write_json(&mut stream, 500, &error_payload(&error)),
            }
        }
        _ if path.starts_with("/v1/envs/") => {
            if !unlocked {
                return write_json(&mut stream, 423, &locked_error());
            }
            let id = decode_component(path.trim_start_matches("/v1/envs/"));
            match vault.read_env_document(&id) {
                Ok(payload) => write_json(
                    &mut stream,
                    200,
                    &json!({
                        "id": id,
                        "filename": payload.filename,
                        "encoding": payload.encoding,
                        "lineEnding": payload.line_ending,
                        "rawText": payload.raw_text,
                    }),
                ),
                Err(error) => write_json(&mut stream, 404, &error_payload(&error)),
            }
        }
        _ => write_json(
            &mut stream,
            404,
            &json!({ "error": { "code": "NOT_FOUND", "message": "Unknown endpoint." } }),
        ),
    }
}

fn project_payload(vault: &VaultService) -> AppResult<serde_json::Value> {
    let projects = vault.list_projects()?;
    let mut output = Vec::with_capacity(projects.len());
    for project in projects {
        let envs = vault.list_env_documents(&project.id).unwrap_or_default();
        let envs: Vec<serde_json::Value> = envs
            .into_iter()
            .map(|env| {
                json!({
                    "id": env.id,
                    "filename": env.filename,
                    "keyCount": env.key_count,
                    "keys": env.keys,
                })
            })
            .collect();
        output.push(json!({
            "id": project.id,
            "name": project.name,
            "favorite": project.favorite,
            "envs": envs,
        }));
    }
    Ok(serde_json::Value::Array(output))
}

fn locked_error() -> serde_json::Value {
    json!({ "error": { "code": "VAULT_LOCKED", "message": "Unlock the vault in Env Vault first." } })
}

fn error_payload(error: &AppError) -> serde_json::Value {
    // Every variant has a curated, user-facing message except `Crypto`, which
    // carries algorithm detail. That one is replaced so the socket never
    // exposes internals, even to a token holder.
    let message = match error {
        AppError::Crypto(_) => "The encrypted data could not be read.".to_string(),
        other => other.to_string(),
    };
    json!({ "error": { "code": "BRIDGE_ERROR", "message": message } })
}

fn parse_request(buffer: &[u8]) -> Option<HttpRequest> {
    let text = String::from_utf8_lossy(buffer);
    let mut lines = text.split("\r\n");
    let mut request_line = lines.next()?.split_whitespace();
    let method = request_line.next()?.to_string();
    let path = request_line.next()?.to_string();
    let mut authorization = None;
    for line in lines {
        if line.is_empty() {
            break;
        }
        if let Some((name, value)) = line.split_once(':') {
            if name.eq_ignore_ascii_case("authorization") {
                authorization = Some(value.trim().to_string());
            }
        }
    }
    Some(HttpRequest {
        method,
        path,
        authorization,
    })
}

fn decode_component(raw: &str) -> String {
    let mut output = String::with_capacity(raw.len());
    let bytes = raw.as_bytes();
    let mut index = 0;
    while index < bytes.len() {
        if bytes[index] == b'%' && index + 2 < bytes.len() {
            if let Ok(value) = u8::from_str_radix(&raw[index + 1..index + 3], 16) {
                output.push(value as char);
                index += 3;
                continue;
            }
        }
        output.push(bytes[index] as char);
        index += 1;
    }
    output
}

fn constant_time_eq(left: &[u8], right: &[u8]) -> bool {
    if left.len() != right.len() {
        return false;
    }
    let mut difference = 0u8;
    for (a, b) in left.iter().zip(right.iter()) {
        difference |= a ^ b;
    }
    difference == 0
}

fn write_json(stream: &mut TcpStream, status: u16, body: &serde_json::Value) -> std::io::Result<()> {
    let payload = serde_json::to_vec(body).unwrap_or_else(|_| b"{}".to_vec());
    let reason = match status {
        200 => "OK",
        400 => "Bad Request",
        401 => "Unauthorized",
        404 => "Not Found",
        405 => "Method Not Allowed",
        423 => "Locked",
        _ => "Internal Server Error",
    };
    let header = format!(
        "HTTP/1.1 {status} {reason}\r\nContent-Type: application/json; charset=utf-8\r\nContent-Length: {}\r\nCache-Control: no-store\r\nConnection: close\r\n\r\n",
        payload.len()
    );
    stream.write_all(header.as_bytes())?;
    stream.write_all(&payload)?;
    stream.flush()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_request_line_and_bearer_token() {
        let raw = b"GET /v1/status HTTP/1.1\r\nHost: localhost\r\nAuthorization: Bearer abc123\r\n\r\n";
        let request = parse_request(raw).expect("request");
        assert_eq!(request.method, "GET");
        assert_eq!(request.path, "/v1/status");
        assert_eq!(request.authorization.as_deref(), Some("Bearer abc123"));
    }

    #[test]
    fn rejects_requests_without_headers() {
        assert!(parse_request(b"").is_none());
    }

    #[test]
    fn compares_tokens_in_constant_time() {
        assert!(constant_time_eq(b"token", b"token"));
        assert!(!constant_time_eq(b"token", b"tokens"));
        assert!(!constant_time_eq(b"token", b"tokem"));
        assert!(!constant_time_eq(b"", b"token"));
    }

    #[test]
    fn decodes_percent_escapes() {
        assert_eq!(decode_component("abc%2Ddef"), "abc-def");
        assert_eq!(decode_component("plain"), "plain");
    }

    #[test]
    fn generates_unique_tokens() {
        let first = random_token();
        let second = random_token();
        assert_eq!(first.len(), 64);
        assert_ne!(first, second);
    }

    #[test]
    fn masks_cryptographic_detail_in_error_payloads() {
        let payload = error_payload(&AppError::Crypto("nonce reuse at 0xdeadbeef".into()));
        let text = payload.to_string();
        assert!(!text.contains("0xdeadbeef"));
        assert!(text.contains("could not be read"));

        let known = error_payload(&AppError::VaultLocked).to_string();
        assert!(known.contains("Unlock it with your master password"));
    }
}
