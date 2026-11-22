import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  Globe,
  Lock,
  Minus,
  Palette,
  Search,
  Settings,
  Square,
  X,
} from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { usePreferencesStore } from "../../stores/usePreferencesStore";
import { useDialogStore } from "../../stores/useDialogStore";
import { useVaultSessionStore } from "../../stores/useVaultSessionStore";
import { useNavigationStore } from "../../stores/useNavigationStore";
import { useTranslation } from "../../i18n";
import { Logo } from "../brand/Logo";
import { windowApi } from "../../lib/tauri/window-api";
import {
  DARK_THEMES,
  LIGHT_THEMES,
  THEME_LABELS,
  THEME_SWATCHES,
} from "../../lib/theme";
import { BuiltInTheme, ThemeType } from "../../types";
import { persistSettingsPatch } from "../../lib/settings-sync";

export const TitleBar: React.FC = () => {
  const { t, language, setLanguage, languages } = useTranslation();
  const theme = usePreferencesStore((state) => state.theme);
  const vaultState = useVaultSessionStore((state) => state.state);
  const lockVault = useVaultSessionStore((state) => state.lock);
  const openCloseAction = useDialogStore((state) => state.openCloseAction);
  const setView = useNavigationStore((state) => state.setView);
  const openSettings = useNavigationStore((state) => state.openSettings);

  const [themeOpen, setThemeOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [maximized, setMaximized] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const appWindow = getCurrentWindow();
    appWindow.isMaximized().then(setMaximized).catch(() => {});
    let unlisten: (() => void) | undefined;
    appWindow
      .onResized(() => {
        appWindow.isMaximized().then(setMaximized).catch(() => {});
      })
      .then((fn) => {
        unlisten = fn;
      })
      .catch(() => {});
    return () => unlisten?.();
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (themeRef.current && !themeRef.current.contains(target)) setThemeOpen(false);
      if (languageRef.current && !languageRef.current.contains(target)) setLanguageOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  const filteredLanguages = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return languages;
    return languages.filter(
      (entry) =>
        entry.nativeName.toLowerCase().includes(normalized) ||
        entry.englishName.toLowerCase().includes(normalized) ||
        entry.code.includes(normalized)
    );
  }, [languages, query]);

  const themeLabel = (value: BuiltInTheme) =>
    language === "tr" ? THEME_LABELS[value].tr : THEME_LABELS[value].en;

  const applyTheme = (value: ThemeType) => {
    void persistSettingsPatch({ theme: value });
    setThemeOpen(false);
  };

  const close = async () => {
    const action = usePreferencesStore.getState().closeAction;
    if (action === "minimize-to-tray") {
      await windowApi.hideToTray();
      return;
    }
    if (action === "close-app") {
      await windowApi.closeOrExit();
      return;
    }
    openCloseAction();
  };

  return (
    <header className="titlebar" data-tauri-drag-region>
      <div className="titlebar-brand">
        <Logo size={20} showText showBadge={false} />
      </div>

      <div className="titlebar-drag" data-tauri-drag-region />

      <div className="titlebar-actions no-drag" data-tauri-drag-region="false">
        {vaultState === "unlocked" && (
          <button
            type="button"
            className="tb-button"
            onClick={() => {
              void lockVault();
              setView("vault");
            }}
            title={t("docs.shortcutLock")}
            aria-label={t("docs.shortcutLock")}
          >
            <Lock size={14} aria-hidden />
          </button>
        )}

        <button
          type="button"
          className="tb-button"
          onClick={() => openSettings("general")}
          title={t("nav.settings")}
          aria-label={t("nav.settings")}
        >
          <Settings size={14} aria-hidden />
        </button>

        <div className="tb-menu-anchor" ref={themeRef}>
          <button
            type="button"
            className={`tb-button${themeOpen ? " is-active" : ""}`}
            onClick={() => {
              setLanguageOpen(false);
              setThemeOpen((value) => !value);
            }}
            title={t("titlebar.theme")}
            aria-label={t("titlebar.theme")}
            aria-expanded={themeOpen}
          >
            <Palette size={14} aria-hidden />
            <ChevronDown size={11} aria-hidden />
          </button>
          {themeOpen && (
            <div className="dropdown dropdown-wide" role="menu">
              <div className="dropdown-header">{t("settings.darkThemes")}</div>
              <div className="dropdown-grid">
                {DARK_THEMES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="menuitem"
                    className={`dropdown-item${theme === value ? " is-selected" : ""}`}
                    onClick={() => applyTheme(value)}
                  >
                    <span className="swatch" style={{ background: THEME_SWATCHES[value] }} />
                    <span className="dropdown-item-label">{themeLabel(value)}</span>
                    {theme === value && <Check size={13} aria-hidden />}
                  </button>
                ))}
              </div>
              <div className="dropdown-header">{t("settings.lightThemes")}</div>
              <div className="dropdown-grid">
                {LIGHT_THEMES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="menuitem"
                    className={`dropdown-item${theme === value ? " is-selected" : ""}`}
                    onClick={() => applyTheme(value)}
                  >
                    <span className="swatch" style={{ background: THEME_SWATCHES[value] }} />
                    <span className="dropdown-item-label">{themeLabel(value)}</span>
                    {theme === value && <Check size={13} aria-hidden />}
                  </button>
                ))}
              </div>
              <div className="dropdown-scroll">
                <button
                  type="button"
                  className={`dropdown-item${theme === "ozel" ? " is-selected" : ""}`}
                  onClick={() => {
                    openSettings("appearance");
                    setThemeOpen(false);
                  }}
                >
                  <span className="swatch" style={{ background: THEME_SWATCHES.ozel }} />
                  <span className="dropdown-item-label">{themeLabel("ozel")}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="tb-menu-anchor" ref={languageRef}>
          <button
            type="button"
            className={`tb-button${languageOpen ? " is-active" : ""}`}
            onClick={() => {
              setThemeOpen(false);
              setLanguageOpen((value) => !value);
            }}
            title={t("titlebar.language")}
            aria-label={t("titlebar.language")}
            aria-expanded={languageOpen}
          >
            <Globe size={14} aria-hidden />
            <ChevronDown size={11} aria-hidden />
          </button>
          {languageOpen && (
            <div className="dropdown" role="menu">
              <div className="dropdown-search-box">
                <Search size={13} aria-hidden />
                <input
                  className="dropdown-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("common.search")}
                  aria-label={t("common.search")}
                  autoFocus
                />
              </div>
              <div className="dropdown-scroll">
                {filteredLanguages.map((entry) => (
                  <button
                    key={entry.code}
                    type="button"
                    role="menuitem"
                    className={`dropdown-item${language === entry.code ? " is-selected" : ""}`}
                    onClick={() => {
                      setLanguage(entry.code);
                      setLanguageOpen(false);
                    }}
                  >
                    <span className="dropdown-item-label">{entry.nativeName}</span>
                    <span className="lang-code">{entry.code}</span>
                    {language === entry.code && <Check size={13} aria-hidden />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          className="tb-window-button"
          onClick={() => getCurrentWindow().minimize()}
          title={t("titlebar.minimize")}
          aria-label={t("titlebar.minimize")}
        >
          <Minus size={15} aria-hidden />
        </button>
        <button
          type="button"
          className="tb-window-button"
          onClick={() => {
            const appWindow = getCurrentWindow();
            if (maximized) {
              appWindow.unmaximize();
            } else {
              appWindow.maximize();
            }
          }}
          title={maximized ? t("titlebar.restore") : t("titlebar.maximize")}
          aria-label={maximized ? t("titlebar.restore") : t("titlebar.maximize")}
        >
          {maximized ? <Copy size={13} aria-hidden /> : <Square size={12} aria-hidden />}
        </button>
        <button
          type="button"
          className="tb-window-button is-close"
          onClick={close}
          title={t("titlebar.close")}
          aria-label={t("titlebar.close")}
        >
          <X size={15} aria-hidden />
        </button>
      </div>
    </header>
  );
};
