use crate::error::{AppError, AppResult};
use std::time::{Duration, Instant};
use zeroize::Zeroize;

#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "lowercase")]
pub enum VaultSessionState {
    Uninitialized,
    Locked,
    Unlocking,
    Unlocked,
    Locking,
    Error,
}

pub struct VaultSession {
    state: VaultSessionState,
    master_key: Option<[u8; 32]>,
    last_activity: Instant,
    auto_lock_duration: Option<Duration>,
}

impl VaultSession {
    pub fn new(is_initialized: bool) -> Self {
        Self {
            state: if is_initialized {
                VaultSessionState::Locked
            } else {
                VaultSessionState::Uninitialized
            },
            master_key: None,
            last_activity: Instant::now(),
            auto_lock_duration: Some(Duration::from_secs(15 * 60)), // 15 mins default
        }
    }

    pub fn get_state(&self) -> VaultSessionState {
        self.state
    }

    pub fn set_auto_lock_duration(&mut self, duration_minutes: u32) {
        self.auto_lock_duration = if duration_minutes == 0 {
            None
        } else {
            Some(Duration::from_secs((duration_minutes as u64) * 60))
        };
    }

    pub fn touch_activity(&mut self) {
        self.last_activity = Instant::now();
    }

    pub fn check_auto_lock(&mut self) -> bool {
        if self.state != VaultSessionState::Unlocked {
            return false;
        }

        if let Some(limit) = self.auto_lock_duration {
            if self.last_activity.elapsed() >= limit {
                self.lock();
                return true;
            }
        }

        false
    }

    pub fn unlock(&mut self, key: [u8; 32]) {
        self.master_key = Some(key);
        self.state = VaultSessionState::Unlocked;
        self.touch_activity();
    }

    pub fn lock(&mut self) {
        if let Some(mut key) = self.master_key.take() {
            key.zeroize();
        }
        self.state = VaultSessionState::Locked;
    }

    pub fn get_master_key(&mut self) -> AppResult<[u8; 32]> {
        self.check_auto_lock();

        match (self.state, self.master_key) {
            (VaultSessionState::Unlocked, Some(key)) => {
                self.touch_activity();
                Ok(key)
            }
            (VaultSessionState::Uninitialized, _) => Err(AppError::VaultNotInitialized),
            _ => Err(AppError::VaultLocked),
        }
    }
}

impl Drop for VaultSession {
    fn drop(&mut self) {
        if let Some(mut key) = self.master_key.take() {
            key.zeroize();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vault_session_state_transitions() {
        let mut session = VaultSession::new(true);
        assert_eq!(session.get_state(), VaultSessionState::Locked);
        assert!(session.get_master_key().is_err());

        let key = [42u8; 32];
        session.unlock(key);
        assert_eq!(session.get_state(), VaultSessionState::Unlocked);
        assert_eq!(session.get_master_key().unwrap(), key);

        session.lock();
        assert_eq!(session.get_state(), VaultSessionState::Locked);
        assert!(session.get_master_key().is_err());
    }

    #[test]
    fn test_auto_lock_deadline() {
        let mut session = VaultSession::new(true);
        session.unlock([1u8; 32]);

        // 0 duration means never auto-lock
        session.set_auto_lock_duration(0);
        assert!(!session.check_auto_lock());
        assert_eq!(session.get_state(), VaultSessionState::Unlocked);
    }
}
