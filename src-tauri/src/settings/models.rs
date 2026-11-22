use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "kebab-case")]
pub enum ThemeType {
    #[default]
    Siyah,
    KoyuGri,
    KoyuMavi,
    KoyuMor,
    KoyuYesil,
    KoyuKirmizi,
    KoyuTuruncu,
    KoyuSari,
    Beyaz,
    AcikGri,
    AcikMavi,
    AcikMor,
    AcikYesil,
    AcikKirmizi,
    AcikTuruncu,
    AcikSari,
    Ozel,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "kebab-case")]
pub enum CollisionPolicy {
    #[default]
    Ask,
    Overwrite,
    Rename,
    Cancel,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "kebab-case")]
pub enum CloseAction {
    #[default]
    Ask,
    MinimizeToTray,
    CloseApp,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "kebab-case")]
pub enum IconTheme {
    #[default]
    Obsidian,
    Porcelain,
    Contrast,
    Cyan,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", default)]
pub struct AppSettings {
    pub theme: ThemeType,
    pub language: String,
    pub auto_lock_minutes: u32,
    pub auto_unlock_with_windows: bool,
    pub auto_hide_secrets: bool,
    pub clear_clipboard_seconds: u32,
    pub ask_export_location: bool,
    pub default_export_directory: Option<String>,
    pub export_collision_policy: CollisionPolicy,
    pub close_action: CloseAction,
    pub reduce_motion: bool,
    pub custom_accent: String,
    pub follow_system_theme: bool,
    pub icon_theme: IconTheme,
    pub ui_scale: u32,
    pub start_with_windows: bool,
    pub start_minimized: bool,
    pub global_shortcut_enabled: bool,
    pub notifications_enabled: bool,
    pub notification_sound: bool,
    pub auto_sync_enabled: bool,
    pub onboarding_completed: bool,
    pub dev_bridge_enabled: bool,
    pub sidebar_collapsed: bool,
    pub ai_enabled: bool,
    pub ai_model: String,
    pub webhook_enabled: bool,
    pub webhook_url: String,
    pub webhook_token: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme: ThemeType::Siyah,
            language: "en".to_string(),
            auto_lock_minutes: 15,
            auto_unlock_with_windows: false,
            auto_hide_secrets: true,
            clear_clipboard_seconds: 30,
            ask_export_location: true,
            default_export_directory: None,
            export_collision_policy: CollisionPolicy::Ask,
            close_action: CloseAction::Ask,
            reduce_motion: false,
            custom_accent: "#0A84FF".to_string(),
            follow_system_theme: false,
            icon_theme: IconTheme::Obsidian,
            ui_scale: 100,
            start_with_windows: false,
            start_minimized: false,
            global_shortcut_enabled: true,
            notifications_enabled: true,
            notification_sound: true,
            auto_sync_enabled: true,
            onboarding_completed: false,
            dev_bridge_enabled: false,
            sidebar_collapsed: false,
            ai_enabled: false,
            ai_model: "llama3.2".to_string(),
            webhook_enabled: false,
            webhook_url: String::new(),
            webhook_token: String::new(),
        }
    }
}
