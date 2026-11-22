import React from "react";
import {
  BookOpen,
  Bot,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Heart,
  Info,
  LifeBuoy,
  Lock,
  LockKeyhole,
  Plug,
  Settings as SettingsIcon,
} from "lucide-react";
import { Logo } from "../brand/Logo";
import { useNavigationStore, AppView } from "../../stores/useNavigationStore";
import { usePreferencesStore } from "../../stores/usePreferencesStore";
import { useVaultSessionStore } from "../../stores/useVaultSessionStore";
import { useTranslation } from "../../i18n";
import { REPOSITORY_URL, SPONSOR_URL } from "../../lib/constants";
import { openExternalUrl } from "../../lib/utils/open-url";
import { persistSettingsPatch } from "../../lib/settings-sync";

interface NavEntry {
  view: AppView;
  labelKey: string;
  icon: React.ElementType;
}

const NAV_ENTRIES: NavEntry[] = [
  { view: "vault", labelKey: "nav.vault", icon: LockKeyhole },
  { view: "assistant", labelKey: "nav.assistant", icon: Bot },
  { view: "integrations", labelKey: "nav.integrations", icon: Plug },
  { view: "docs", labelKey: "nav.docs", icon: BookOpen },
  { view: "support", labelKey: "nav.support", icon: LifeBuoy },
  { view: "about", labelKey: "nav.about", icon: Info },
];

/**
 * Primary sidebar. Its header doubles as the window drag handle, which is why
 * the shell needs no title bar. Every view renders its own secondary pane to
 * the right of this rail, matching the two-level navigation used across the
 * Vellium product line.
 */
export const AppSidebar: React.FC = () => {
  const { t } = useTranslation();
  const view = useNavigationStore((state) => state.view);
  const setView = useNavigationStore((state) => state.setView);
  const openSettings = useNavigationStore((state) => state.openSettings);
  const collapsed = usePreferencesStore((state) => state.sidebarCollapsed);
  const vaultState = useVaultSessionStore((state) => state.state);
  const lockVault = useVaultSessionStore((state) => state.lock);

  const toggleCollapsed = () => {
    void persistSettingsPatch({ sidebarCollapsed: !collapsed }).catch(() => {});
  };

  const isUnlocked = vaultState === "unlocked";

  return (
    <aside
      className={`app-sidebar${collapsed ? " is-collapsed" : ""}`}
      aria-label={t("nav.railLabel")}
    >
      <div className="sidebar-brand" data-tauri-drag-region="deep">
        <div className="sidebar-brand-identity">
          <Logo size={24} showText={!collapsed} showBadge={false} />
        </div>
        {!collapsed && (
          <div className="sidebar-brand-actions">
            <button
              type="button"
              className="sidebar-icon-button"
              onClick={toggleCollapsed}
              title={t("nav.collapse")}
              aria-label={t("nav.collapse")}
              aria-expanded
            >
              <ChevronLeft size={16} aria-hidden />
            </button>
          </div>
        )}
      </div>

      <nav className="sidebar-nav-primary" aria-label={t("nav.railLabel")}>
        {NAV_ENTRIES.map(({ view: target, labelKey, icon: Icon }) => (
          <button
            key={target}
            type="button"
            className={`nav-entry${view === target ? " is-active" : ""}`}
            onClick={() => setView(target)}
            aria-current={view === target ? "page" : undefined}
            title={collapsed ? t(labelKey) : undefined}
          >
            <Icon size={18} className="nav-entry-icon" aria-hidden />
            <span className="nav-entry-text">{t(labelKey)}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className={`nav-entry${view === "settings" ? " is-active" : ""}`}
          onClick={() => openSettings("general")}
          aria-current={view === "settings" ? "page" : undefined}
          title={t("nav.settings")}
        >
          <SettingsIcon size={18} className="nav-entry-icon" aria-hidden />
          <span className="nav-entry-text">{t("nav.settings")}</span>
        </button>

        {isUnlocked && (
          <button
            type="button"
            className="nav-entry"
            onClick={() => {
              void lockVault();
              setView("vault");
            }}
            title={t("sidebar.lockVault")}
          >
            <Lock size={17} className="nav-entry-icon" aria-hidden />
            <span className="nav-entry-text">{t("sidebar.lockVault")}</span>
          </button>
        )}

        <div className="sidebar-links">
          <button
            type="button"
            className="sidebar-link-btn"
            onClick={() => openExternalUrl(REPOSITORY_URL)}
            title={t("support.github")}
          >
            <GitBranch size={14} aria-hidden />
            <span className="sidebar-link-label">{t("support.githubShort")}</span>
          </button>
          <button
            type="button"
            className="sidebar-link-btn"
            onClick={() => openExternalUrl(SPONSOR_URL)}
            title={t("support.sponsor")}
          >
            <Heart size={14} aria-hidden />
            <span className="sidebar-link-label">{t("support.sponsorShort")}</span>
          </button>
        </div>

        {collapsed && (
          <button
            type="button"
            className="nav-entry sidebar-collapse"
            onClick={toggleCollapsed}
            title={t("nav.expand")}
            aria-label={t("nav.expand")}
          >
            <ChevronRight size={17} className="nav-entry-icon" aria-hidden />
            <span className="nav-entry-text">{t("nav.expand")}</span>
          </button>
        )}
      </div>
    </aside>
  );
};
