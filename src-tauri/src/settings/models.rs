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
pub enum Language {
    #[default]
    Tr,
    En,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub theme: ThemeType,
    pub language: Language,
    pub auto_lock_minutes: u32, // 0 = never/when closed, 1, 5, 15, 30, 60
    pub auto_unlock_with_windows: bool,
    pub auto_hide_secrets: bool,
    pub clear_clipboard_seconds: u32,
    pub ask_export_location: bool,
    pub default_export_directory: Option<String>,
    pub export_collision_policy: CollisionPolicy,
    pub close_action: CloseAction,
    pub reduce_motion: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme: ThemeType::Siyah,
            language: Language::Tr,
            auto_lock_minutes: 15,
            auto_unlock_with_windows: false,
            auto_hide_secrets: true,
            clear_clipboard_seconds: 30,
            ask_export_location: true,
            default_export_directory: None,
            export_collision_policy: CollisionPolicy::Ask,
            close_action: CloseAction::Ask,
            reduce_motion: false,
        }
    }
}
