#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    std::panic::set_hook(Box::new(|info| {
        let dir = env_vault_lib::resolve_app_data_dir();
        let _ = std::fs::create_dir_all(&dir);
        let log_path = dir.join("crash.log");
        let msg = format!("Env Vault Crash:\n{}\n", info);
        let _ = std::fs::write(log_path, &msg);
    }));

    env_vault_lib::run();
}
