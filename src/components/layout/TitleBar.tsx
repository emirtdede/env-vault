import React, { useState, useEffect, useRef } from "react";
import {
  Palette,
  Globe,
  Minus,
  Square,
  Copy,
  X,
  Moon,
  Sun,
  Check,
} from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { usePreferencesStore } from "../../stores/usePreferencesStore";
import { useDialogStore } from "../../stores/useDialogStore";
import { Language, ThemeType } from "../../types";
import { settingsApi } from "../../lib/tauri/settings-api";
import { windowApi } from "../../lib/tauri/window-api";
import { Logo } from "../brand/Logo";
import { useTranslation } from "../../i18n";

interface ThemeOption {
  id: ThemeType;
  labelTr: string;
  labelEn: string;
  dotColor: string;
  pillBg: string;
  group: "dark" | "light";
}

const THEME_OPTIONS: ThemeOption[] = [
  // Koyu Temalar
  { id: "siyah", labelTr: "Siyah", labelEn: "Black", dotColor: "#0A84FF", pillBg: "#070709", group: "dark" },
  { id: "koyu-gri", labelTr: "Koyu Gri", labelEn: "Dark Gray", dotColor: "#38BDF8", pillBg: "#1C1D22", group: "dark" },
  { id: "koyu-mavi", labelTr: "Koyu Mavi", labelEn: "Dark Blue", dotColor: "#00A3FF", pillBg: "#10182B", group: "dark" },
  { id: "koyu-mor", labelTr: "Koyu Mor", labelEn: "Dark Purple", dotColor: "#A855F7", pillBg: "#19122C", group: "dark" },
  { id: "koyu-yesil", labelTr: "Koyu Yeşil", labelEn: "Dark Green", dotColor: "#10B981", pillBg: "#0E2018", group: "dark" },
  { id: "koyu-kirmizi", labelTr: "Koyu Kırmızı", labelEn: "Dark Red", dotColor: "#EF4444", pillBg: "#221013", group: "dark" },
  { id: "koyu-turuncu", labelTr: "Koyu Turuncu", labelEn: "Dark Orange", dotColor: "#F97316", pillBg: "#22140D", group: "dark" },
  { id: "koyu-sari", labelTr: "Koyu Sarı", labelEn: "Dark Yellow", dotColor: "#EAB308", pillBg: "#221E0D", group: "dark" },
  // Açık Temalar
  { id: "beyaz", labelTr: "Beyaz", labelEn: "White", dotColor: "#0A84FF", pillBg: "#FFFFFF", group: "light" },
  { id: "acik-gri", labelTr: "Açık Gri", labelEn: "Light Gray", dotColor: "#4B5563", pillBg: "#FFFFFF", group: "light" },
  { id: "acik-mavi", labelTr: "Açık Mavi", labelEn: "Light Blue", dotColor: "#0284C7", pillBg: "#E0F2FE", group: "light" },
  { id: "acik-mor", labelTr: "Açık Mor", labelEn: "Light Purple", dotColor: "#9333EA", pillBg: "#F3E8FF", group: "light" },
  { id: "acik-yesil", labelTr: "Açık Yeşil", labelEn: "Light Green", dotColor: "#16A34A", pillBg: "#DCFCE7", group: "light" },
  { id: "acik-kirmizi", labelTr: "Açık Kırmızı", labelEn: "Light Red", dotColor: "#E11D48", pillBg: "#FFE4E6", group: "light" },
  { id: "acik-turuncu", labelTr: "Açık Turuncu", labelEn: "Light Orange", dotColor: "#EA580C", pillBg: "#FFEDD5", group: "light" },
  { id: "acik-sari", labelTr: "Açık Sarı", labelEn: "Light Yellow", dotColor: "#CA8A04", pillBg: "#FEF9C3", group: "light" },
];

export const TitleBar: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const currentTheme = usePreferencesStore((s) => s.theme);
  const setTheme = usePreferencesStore((s) => s.setTheme);
  const closeAction = usePreferencesStore((s) => s.closeAction);
  const openCloseAction = useDialogStore((s) => s.openCloseAction);

  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Monitor maximized state & close requests
  useEffect(() => {
    let unlistenResize: (() => void) | undefined;
    let unlistenClose: (() => void) | undefined;

    const checkState = async () => {
      try {
        const win = getCurrentWindow();
        const max = await win.isMaximized();
        setIsMaximized(max);
        unlistenResize = await win.onResized(async () => {
          try {
            const currentMax = await win.isMaximized();
            setIsMaximized(currentMax);
          } catch {}
        });

        unlistenClose = await win.onCloseRequested(async (event) => {
          const action = usePreferencesStore.getState().closeAction;
          if (action === "minimize-to-tray") {
            event.preventDefault();
            await windowApi.hideToTray();
          } else if (action === "ask") {
            event.preventDefault();
            useDialogStore.getState().openCloseAction();
          }
          // if "close-app", allow default close event
        });
      } catch {
        // Fallback for non-tauri/web environment
      }
    };
    checkState();
    return () => {
      if (unlistenResize) unlistenResize();
      if (unlistenClose) unlistenClose();
    };
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setIsThemeMenuOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    if (isThemeMenuOpen || isLangMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isThemeMenuOpen, isLangMenuOpen]);

  const handleSelectTheme = async (themeId: ThemeType) => {
    setTheme(themeId);
    setIsThemeMenuOpen(false);
    try {
      const current = usePreferencesStore.getState();
      await settingsApi.updateSettings({ ...current, theme: themeId });
    } catch {
      // Handled silently
    }
  };

  const handleSelectLanguage = async (lang: Language) => {
    setLanguage(lang);
    setIsLangMenuOpen(false);
    try {
      const current = usePreferencesStore.getState();
      await settingsApi.updateSettings({ ...current, language: lang });
    } catch {
      // Handled silently
    }
  };

  const handleMinimize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const win = getCurrentWindow();
      await win.minimize();
    } catch (err) {
      console.warn("Minimize error:", err);
    }
  };

  const handleToggleMaximize = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const win = getCurrentWindow();
      const isMax = await win.isMaximized();
      if (isMax) {
        await win.unmaximize();
        setIsMaximized(false);
      } else {
        await win.maximize();
        setIsMaximized(true);
      }
    } catch (err) {
      console.warn("Maximize toggle error:", err);
    }
  };

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (closeAction === "minimize-to-tray") {
        await windowApi.hideToTray();
      } else if (closeAction === "close-app") {
        await windowApi.closeOrExit();
      } else {
        openCloseAction();
      }
    } catch (err) {
      console.warn("Close error:", err);
    }
  };

  return (
    <header
      data-tauri-drag-region
      onDoubleClick={(e) => {
        const target = e.target as HTMLElement;
        if (
          target.closest("button") ||
          target.closest("input") ||
          target.closest("select") ||
          target.closest("[role='button']") ||
          target.closest(".no-drag")
        ) {
          return;
        }
        handleToggleMaximize();
      }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "38px",
        minHeight: "38px",
        padding: "0 0 0 14px",
        backgroundColor: "var(--app-bg)",
        borderBottom: "1px solid var(--border-subtle)",
        userSelect: "none",
        WebkitUserSelect: "none",
        position: "relative",
        zIndex: 9999,
      }}
    >
      {/* Left: Brand info & Vector Icon */}
      <div
        data-tauri-drag-region
        style={{
          display: "flex",
          alignItems: "center",
          cursor: "default",
        }}
      >
        <Logo size={20} showText={true} showBadge={false} />
      </div>

      {/* Center: Seamless Drag Area */}
      <div
        data-tauri-drag-region
        style={{
          flex: 1,
          height: "100%",
          cursor: "default",
        }}
      />

      {/* Right: Theme & Language Switchers & Windows Control Buttons */}
      <div
        className="no-drag"
        data-tauri-drag-region="false"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          alignItems: "center",
          height: "100%",
          gap: "4px",
          position: "relative",
          zIndex: 100020,
        }}
      >
        {/* Quick Theme Switcher Button */}
        <div style={{ position: "relative" }} ref={themeMenuRef}>
          <button
            type="button"
            data-tauri-drag-region="false"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setIsLangMenuOpen(false);
              setIsThemeMenuOpen((prev) => !prev);
            }}
            title={t("titlebar.theme")}
            aria-label={t("titlebar.theme")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              padding: 0,
              borderRadius: "6px",
              backgroundColor: isThemeMenuOpen ? "var(--surface-active)" : "var(--surface-subtle)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!isThemeMenuOpen) {
                (e.currentTarget as HTMLElement).style.backgroundColor = "var(--surface-hover)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isThemeMenuOpen) {
                (e.currentTarget as HTMLElement).style.backgroundColor = "var(--surface-subtle)";
              }
            }}
          >
            <Palette size={14} style={{ color: "var(--accent)" }} />
          </button>

          {/* Theme Dropdown Menu */}
          {isThemeMenuOpen && (
            <div
              className="no-drag"
              data-tauri-drag-region="false"
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                width: "280px",
                maxHeight: "380px",
                overflowY: "auto",
                backgroundColor: "var(--surface-strong)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid var(--border-strong)",
                borderRadius: "12px",
                boxShadow: "var(--shadow-xl)",
                padding: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                zIndex: 100030,
              }}
            >
              {/* Koyu Temalar */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10.5px", fontWeight: 700, color: "var(--text-secondary)", padding: "4px 8px 2px" }}>
                <Moon size={11} style={{ color: "var(--text-secondary)" }} />
                <span>{t("settings.darkThemes").toUpperCase()}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "4px" }}>
                {THEME_OPTIONS.filter((o) => o.group === "dark").map((opt) => {
                  const isSelected = currentTheme === opt.id;
                  const label = language === "tr" ? opt.labelTr : opt.labelEn;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      data-tauri-drag-region="false"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectTheme(opt.id);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 8px",
                        borderRadius: "8px",
                        backgroundColor: isSelected ? "var(--surface-active)" : "transparent",
                        border: isSelected ? "1px solid var(--accent)" : "1px solid transparent",
                        color: "var(--text-primary)",
                        fontSize: "12px",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.12s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--surface-hover)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                      }}
                    >
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "6px",
                          backgroundColor: opt.pillBg,
                          border: "1px solid var(--border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            width: "7px",
                            height: "7px",
                            borderRadius: "50%",
                            backgroundColor: opt.dotColor,
                          }}
                        />
                      </div>
                      <span style={{ fontSize: "11.5px", fontWeight: isSelected ? 600 : 400, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {label}
                      </span>
                      {isSelected && <Check size={12} style={{ color: "var(--accent)", flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>

              {/* Açık Temalar */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10.5px", fontWeight: 700, color: "var(--text-secondary)", padding: "10px 8px 2px 8px" }}>
                <Sun size={11} style={{ color: "var(--text-secondary)" }} />
                <span>{t("settings.lightThemes").toUpperCase()}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "4px" }}>
                {THEME_OPTIONS.filter((o) => o.group === "light").map((opt) => {
                  const isSelected = currentTheme === opt.id;
                  const label = language === "tr" ? opt.labelTr : opt.labelEn;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      data-tauri-drag-region="false"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectTheme(opt.id);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 8px",
                        borderRadius: "8px",
                        backgroundColor: isSelected ? "var(--surface-active)" : "transparent",
                        border: isSelected ? "1px solid var(--accent)" : "1px solid transparent",
                        color: "var(--text-primary)",
                        fontSize: "12px",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.12s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--surface-hover)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                      }}
                    >
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "6px",
                          backgroundColor: opt.pillBg,
                          border: "1px solid var(--border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            width: "7px",
                            height: "7px",
                            borderRadius: "50%",
                            backgroundColor: opt.dotColor,
                          }}
                        />
                      </div>
                      <span style={{ fontSize: "11.5px", fontWeight: isSelected ? 600 : 400, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {label}
                      </span>
                      {isSelected && <Check size={12} style={{ color: "var(--accent)", flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Quick Language Switcher Button */}
        <div style={{ position: "relative", marginRight: "4px" }} ref={langMenuRef}>
          <button
            type="button"
            data-tauri-drag-region="false"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setIsThemeMenuOpen(false);
              setIsLangMenuOpen((prev) => !prev);
            }}
            title={t("titlebar.language")}
            aria-label={t("titlebar.language")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              padding: 0,
              borderRadius: "6px",
              backgroundColor: isLangMenuOpen ? "var(--surface-active)" : "var(--surface-subtle)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!isLangMenuOpen) {
                (e.currentTarget as HTMLElement).style.backgroundColor = "var(--surface-hover)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isLangMenuOpen) {
                (e.currentTarget as HTMLElement).style.backgroundColor = "var(--surface-subtle)";
              }
            }}
          >
            <Globe size={14} style={{ color: "var(--accent)" }} />
          </button>

          {/* Language Dropdown Menu */}
          {isLangMenuOpen && (
            <div
              className="no-drag"
              data-tauri-drag-region="false"
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                width: "180px",
                backgroundColor: "var(--surface-strong)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid var(--border-strong)",
                borderRadius: "12px",
                boxShadow: "var(--shadow-xl)",
                padding: "6px",
                display: "flex",
                flexDirection: "column",
                gap: "3px",
                zIndex: 100030,
              }}
            >
              {/* Türkçe */}
              <button
                type="button"
                data-tauri-drag-region="false"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectLanguage("tr");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  backgroundColor: language === "tr" ? "var(--surface-active)" : "transparent",
                  border: language === "tr" ? "1px solid var(--accent)" : "1px solid transparent",
                  color: "var(--text-primary)",
                  fontSize: "12.5px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.12s ease",
                }}
                onMouseEnter={(e) => {
                  if (language !== "tr") (e.currentTarget as HTMLElement).style.backgroundColor = "var(--surface-hover)";
                }}
                onMouseLeave={(e) => {
                  if (language !== "tr") (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 4px", borderRadius: "4px", backgroundColor: "var(--surface-subtle)", border: "1px solid var(--border)" }}>TR</span>
                  <span style={{ fontWeight: language === "tr" ? 600 : 400 }}>{t("titlebar.turkish")}</span>
                </div>
                {language === "tr" && <Check size={14} style={{ color: "var(--accent)" }} />}
              </button>

              {/* English */}
              <button
                type="button"
                data-tauri-drag-region="false"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectLanguage("en");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  backgroundColor: language === "en" ? "var(--surface-active)" : "transparent",
                  border: language === "en" ? "1px solid var(--accent)" : "1px solid transparent",
                  color: "var(--text-primary)",
                  fontSize: "12.5px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.12s ease",
                }}
                onMouseEnter={(e) => {
                  if (language !== "en") (e.currentTarget as HTMLElement).style.backgroundColor = "var(--surface-hover)";
                }}
                onMouseLeave={(e) => {
                  if (language !== "en") (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 4px", borderRadius: "4px", backgroundColor: "var(--surface-subtle)", border: "1px solid var(--border)" }}>EN</span>
                  <span style={{ fontWeight: language === "en" ? 600 : 400 }}>{t("titlebar.english")}</span>
                </div>
                {language === "en" && <Check size={14} style={{ color: "var(--accent)" }} />}
              </button>
            </div>
          )}
        </div>

        {/* Windows Standard Controls: Minimize, Maximize/Restore, Close */}
        <div
          className="no-drag"
          data-tauri-drag-region="false"
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            display: "flex",
            alignItems: "stretch",
            height: "100%",
          }}
        >
          {/* Minimize Button */}
          <button
            type="button"
            data-tauri-drag-region="false"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleMinimize}
            title={t("titlebar.minimize")}
            aria-label={t("titlebar.minimize")}
            style={{
              width: "44px",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              background: "transparent",
              color: "var(--text-secondary)",
              cursor: "pointer",
              transition: "background-color 0.12s ease, color 0.12s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "var(--surface-hover)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
            }}
          >
            <Minus size={13} strokeWidth={2} />
          </button>

          {/* Maximize / Restore Button */}
          <button
            type="button"
            data-tauri-drag-region="false"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleToggleMaximize}
            title={isMaximized ? t("titlebar.restore") : t("titlebar.maximize")}
            aria-label={isMaximized ? t("titlebar.restore") : t("titlebar.maximize")}
            style={{
              width: "44px",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              background: "transparent",
              color: "var(--text-secondary)",
              cursor: "pointer",
              transition: "background-color 0.12s ease, color 0.12s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "var(--surface-hover)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
            }}
          >
            {isMaximized ? (
              <Copy size={11} strokeWidth={2} style={{ transform: "rotate(90deg)" }} />
            ) : (
              <Square size={11} strokeWidth={2} />
            )}
          </button>

          {/* Close Button */}
          <button
            type="button"
            data-tauri-drag-region="false"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleClose}
            title={t("titlebar.close")}
            aria-label={t("titlebar.close")}
            style={{
              width: "46px",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              background: "transparent",
              color: "var(--text-secondary)",
              cursor: "pointer",
              transition: "background-color 0.12s ease, color 0.12s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "#E81123";
              (e.currentTarget as HTMLElement).style.color = "#FFFFFF";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
            }}
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </header>
  );
};
