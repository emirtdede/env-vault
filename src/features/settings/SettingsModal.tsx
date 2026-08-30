import React, { useEffect, useState } from "react";
import {
  Shield,
  Download,
  Palette,
  KeyRound,
  Folder,
  Info,
  RotateCcw,
  Moon,
  Sun,
  Check,
  Languages,
} from "lucide-react";
import { Dialog } from "../../components/primitives/Dialog";
import { Button } from "../../components/primitives/Button";
import { Switch } from "../../components/primitives/Switch";
import { useDialogStore } from "../../stores/useDialogStore";
import { usePreferencesStore } from "../../stores/usePreferencesStore";
import { useVaultSessionStore } from "../../stores/useVaultSessionStore";
import { settingsApi } from "../../lib/tauri/settings-api";
import { ThemeType, AutoLockDuration, Language } from "../../types";
import { Logo } from "../../components/brand/Logo";
import { useTranslation } from "../../i18n";

export const SettingsModal: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const isOpen = useDialogStore((s) => s.isSettingsOpen);
  const onClose = useDialogStore((s) => s.closeSettings);
  const openChangePassword = useDialogStore((s) => s.openChangePassword);
  const showConfirm = useDialogStore((s) => s.showConfirm);
  const resetVault = useVaultSessionStore((s) => s.resetVault);

  const theme = usePreferencesStore((s) => s.theme);
  const setTheme = usePreferencesStore((s) => s.setTheme);
  const autoLockMinutes = usePreferencesStore((s) => s.autoLockMinutes);
  const setAutoLockMinutes = usePreferencesStore((s) => s.setAutoLockMinutes);
  const askExportLocation = usePreferencesStore((s) => s.askExportLocation);
  const setAskExportLocation = usePreferencesStore((s) => s.setAskExportLocation);
  const defaultExportDirectory = usePreferencesStore((s) => s.defaultExportDirectory);
  const setDefaultExportDirectory = usePreferencesStore((s) => s.setDefaultExportDirectory);
  const reduceMotion = usePreferencesStore((s) => s.reduceMotion);
  const setReduceMotion = usePreferencesStore((s) => s.setReduceMotion);
  const closeAction = usePreferencesStore((s) => s.closeAction);
  const setCloseAction = usePreferencesStore((s) => s.setCloseAction);

  const [appVersion, setAppVersion] = useState("1.0.0");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { getVersion } = await import("@tauri-apps/api/app");
        const v = await getVersion();
        if (mounted && v) setAppVersion(v);
      } catch {
        // Fallback for non-tauri context
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const persistSettings = async () => {
    const currentSettings = usePreferencesStore.getState();
    await settingsApi.updateSettings(currentSettings);
  };

  const handleSelectLanguage = async (lang: Language) => {
    setLanguage(lang);
    try {
      const currentSettings = usePreferencesStore.getState();
      await settingsApi.updateSettings({ ...currentSettings, language: lang });
    } catch {}
  };

  const handlePickDefaultDirectory = async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        directory: true,
        multiple: false,
      });

      if (selected && typeof selected === "string") {
        setDefaultExportDirectory(selected);
        await persistSettings();
      }
    } catch {}
  };

  interface ThemeDescriptor {
    id: ThemeType;
    labelTr: string;
    labelEn: string;
    dotColor: string;
    pillBg: string;
    pillBorder?: string;
  }

  const DARK_THEMES: ThemeDescriptor[] = [
    { id: "siyah", labelTr: "Siyah", labelEn: "Black", dotColor: "#0A84FF", pillBg: "#070709" },
    { id: "koyu-gri", labelTr: "Koyu Gri", labelEn: "Dark Gray", dotColor: "#38BDF8", pillBg: "#1C1D22" },
    { id: "koyu-mavi", labelTr: "Koyu Mavi", labelEn: "Dark Blue", dotColor: "#00A3FF", pillBg: "#10182B" },
    { id: "koyu-mor", labelTr: "Koyu Mor", labelEn: "Dark Purple", dotColor: "#A855F7", pillBg: "#19122C" },
    { id: "koyu-yesil", labelTr: "Koyu Yeşil", labelEn: "Dark Green", dotColor: "#10B981", pillBg: "#0E2018" },
    { id: "koyu-kirmizi", labelTr: "Koyu Kırmızı", labelEn: "Dark Red", dotColor: "#EF4444", pillBg: "#221013" },
    { id: "koyu-turuncu", labelTr: "Koyu Turuncu", labelEn: "Dark Orange", dotColor: "#F97316", pillBg: "#22140D" },
    { id: "koyu-sari", labelTr: "Koyu Sarı", labelEn: "Dark Yellow", dotColor: "#EAB308", pillBg: "#221E0D" },
  ];

  const LIGHT_THEMES: ThemeDescriptor[] = [
    { id: "beyaz", labelTr: "Beyaz", labelEn: "White", dotColor: "#0A84FF", pillBg: "#FFFFFF", pillBorder: "rgba(0,0,0,0.14)" },
    { id: "acik-gri", labelTr: "Açık Gri", labelEn: "Light Gray", dotColor: "#4B5563", pillBg: "#FFFFFF", pillBorder: "rgba(0,0,0,0.14)" },
    { id: "acik-mavi", labelTr: "Açık Mavi", labelEn: "Light Blue", dotColor: "#0284C7", pillBg: "#E0F2FE", pillBorder: "rgba(2,132,199,0.16)" },
    { id: "acik-mor", labelTr: "Açık Mor", labelEn: "Light Purple", dotColor: "#9333EA", pillBg: "#F3E8FF", pillBorder: "rgba(147,51,234,0.16)" },
    { id: "acik-yesil", labelTr: "Açık Yeşil", labelEn: "Light Green", dotColor: "#16A34A", pillBg: "#DCFCE7", pillBorder: "rgba(22,163,74,0.16)" },
    { id: "acik-kirmizi", labelTr: "Açık Kırmızı", labelEn: "Light Red", dotColor: "#E11D48", pillBg: "#FFE4E6", pillBorder: "rgba(225,29,72,0.16)" },
    { id: "acik-turuncu", labelTr: "Açık Turuncu", labelEn: "Light Orange", dotColor: "#EA580C", pillBg: "#FFEDD5", pillBorder: "rgba(234,88,12,0.16)" },
    { id: "acik-sari", labelTr: "Açık Sarı", labelEn: "Light Yellow", dotColor: "#CA8A04", pillBg: "#FEF9C3", pillBorder: "rgba(202,138,4,0.18)" },
  ];

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={t("settings.title")} maxWidth="720px">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        {/* Language Selection */}
        <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--text-primary)" }}>
            <Languages size={16} />
            <h3 style={{ fontSize: "14.5px", fontWeight: 700 }}>{t("settings.languageTitle")}</h3>
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "-4px" }}>
            {t("settings.languageDesc")}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
            {/* TR Option */}
            <button
              type="button"
              onClick={() => handleSelectLanguage("tr")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderRadius: "10px",
                backgroundColor: language === "tr" ? "var(--surface-active)" : "var(--surface-subtle)",
                border: language === "tr" ? "1.5px solid var(--accent)" : "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, padding: "2px 6px", borderRadius: "5px", backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
                  TR
                </span>
                <span style={{ fontSize: "13.5px", fontWeight: language === "tr" ? 600 : 500 }}>
                  {t("settings.languageTr")}
                </span>
              </div>
              {language === "tr" && <Check size={16} style={{ color: "var(--accent)" }} />}
            </button>

            {/* EN Option */}
            <button
              type="button"
              onClick={() => handleSelectLanguage("en")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderRadius: "10px",
                backgroundColor: language === "en" ? "var(--surface-active)" : "var(--surface-subtle)",
                border: language === "en" ? "1.5px solid var(--accent)" : "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, padding: "2px 6px", borderRadius: "5px", backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
                  EN
                </span>
                <span style={{ fontSize: "13.5px", fontWeight: language === "en" ? 600 : 500 }}>
                  {t("settings.languageEn")}
                </span>
              </div>
              {language === "en" && <Check size={16} style={{ color: "var(--accent)" }} />}
            </button>
          </div>
        </section>

        <div style={{ height: "1px", backgroundColor: "var(--separator)" }} />

        {/* Appearance / Theme */}
        <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--text-primary)" }}>
            <Palette size={16} />
            <h3 style={{ fontSize: "14.5px", fontWeight: 700 }}>{t("settings.themeTitle")}</h3>
          </div>

          {/* Koyu Temalar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.04em" }}>
              <Moon size={12} style={{ color: "var(--text-secondary)" }} />
              <span>{t("settings.darkThemes").toUpperCase()}</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
              {DARK_THEMES.map((tItem) => {
                const isSelected = theme === tItem.id;
                const label = language === "tr" ? tItem.labelTr : tItem.labelEn;
                return (
                  <button
                    key={tItem.id}
                    type="button"
                    onClick={async () => {
                      setTheme(tItem.id);
                      await persistSettings();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 10px",
                      borderRadius: "10px",
                      backgroundColor: isSelected ? "var(--surface-active)" : "var(--surface-subtle)",
                      border: isSelected ? "1.5px solid var(--accent)" : "1px solid var(--border-subtle)",
                      boxShadow: isSelected ? "0 0 0 1px var(--accent-subtle)" : "none",
                      color: "var(--text-primary)",
                      cursor: "pointer",
                      textAlign: "left",
                      position: "relative",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        backgroundColor: tItem.pillBg,
                        border: tItem.pillBorder || "1px solid rgba(255,255,255,0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: "9px",
                          height: "9px",
                          borderRadius: "50%",
                          backgroundColor: tItem.dotColor,
                          boxShadow: `0 0 6px ${tItem.dotColor}88`,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: isSelected ? 600 : 500, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {label}
                    </span>
                    {isSelected && (
                      <Check size={14} style={{ color: "var(--accent)", marginLeft: "auto", flexShrink: 0 }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Açık Temalar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.04em" }}>
              <Sun size={12} style={{ color: "var(--text-secondary)" }} />
              <span>{t("settings.lightThemes").toUpperCase()}</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
              {LIGHT_THEMES.map((tItem) => {
                const isSelected = theme === tItem.id;
                const label = language === "tr" ? tItem.labelTr : tItem.labelEn;
                return (
                  <button
                    key={tItem.id}
                    type="button"
                    onClick={async () => {
                      setTheme(tItem.id);
                      await persistSettings();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 10px",
                      borderRadius: "10px",
                      backgroundColor: isSelected ? "var(--surface-active)" : "var(--surface-subtle)",
                      border: isSelected ? "1.5px solid var(--accent)" : "1px solid var(--border-subtle)",
                      boxShadow: isSelected ? "0 0 0 1px var(--accent-subtle)" : "none",
                      color: "var(--text-primary)",
                      cursor: "pointer",
                      textAlign: "left",
                      position: "relative",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        backgroundColor: tItem.pillBg,
                        border: tItem.pillBorder || "1px solid rgba(0,0,0,0.14)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: "9px",
                          height: "9px",
                          borderRadius: "50%",
                          backgroundColor: tItem.dotColor,
                          boxShadow: `0 0 4px ${tItem.dotColor}88`,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: isSelected ? 600 : 500, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {label}
                    </span>
                    {isSelected && (
                      <Check size={14} style={{ color: "var(--accent)", marginLeft: "auto", flexShrink: 0 }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: "4px" }}>
            <Switch
              label={t("settings.reduceMotionTitle")}
              description={t("settings.reduceMotionDesc")}
              checked={reduceMotion}
              onChange={async (checked) => {
                setReduceMotion(checked);
                await persistSettings();
              }}
            />
          </div>
        </section>

        <div style={{ height: "1px", backgroundColor: "var(--separator)" }} />

        {/* Security Settings */}
        <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--text-primary)" }}>
            <Shield size={16} />
            <h3 style={{ fontSize: "14px", fontWeight: 600 }}>{t("settings.securityTab")}</h3>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-4)" }}>
            <div>
              <span style={{ fontSize: "13.5px", fontWeight: 500, color: "var(--text-primary)" }}>
                {t("settings.autoLockTitle")}
              </span>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                {t("settings.autoLockDesc")}
              </p>
            </div>
            <select
              value={autoLockMinutes}
              onChange={async (e) => {
                const val = Number(e.target.value) as AutoLockDuration;
                setAutoLockMinutes(val);
                await persistSettings();
              }}
              style={{
                height: "34px",
                padding: "0 10px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                backgroundColor: "var(--surface)",
                color: "var(--text-primary)",
                fontSize: "13px",
                outline: "none",
              }}
            >
              <option value={1}>{t("settings.autoLock1m")}</option>
              <option value={5}>{t("settings.autoLock5m")}</option>
              <option value={15}>{t("settings.autoLock15m")}</option>
              <option value={30}>{t("settings.autoLock30m")}</option>
              <option value={60}>{t("settings.autoLock60m")}</option>
              <option value={0}>{t("settings.autoLockImmediate")}</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-2)", flexWrap: "wrap" }}>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<KeyRound size={15} />}
              onClick={() => {
                onClose();
                openChangePassword();
              }}
            >
              {t("settings.changePasswordButton")}
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<RotateCcw size={15} />}
              onClick={() => {
                showConfirm({
                  title: language === "tr" ? "Kasa Sıfırlansın mı?" : "Reset Vault?",
                  message: language === "tr"
                    ? "Bu işlem tüm projeleri, ortam dosyalarını ve oluşturduğunuz parolayı tamamen siler. Uygulama ilk açılış (Hoş Geldiniz) ekranına döner. Bu işlem geri alınamaz!"
                    : "This action will permanently delete all projects, environment files, and your master password. The app will return to the Welcome screen. This cannot be undone!",
                  confirmLabel: language === "tr" ? "Kasayı Tamamen Sıfırla" : "Reset Vault Completely",
                  cancelLabel: t("common.cancel"),
                  isDestructive: true,
                  onConfirm: async () => {
                    await resetVault();
                    onClose();
                  },
                });
              }}
            >
              {language === "tr" ? "Kasayı Sıfırla" : "Reset Vault"}
            </Button>
          </div>
        </section>

        <div style={{ height: "1px", backgroundColor: "var(--separator)" }} />

        {/* Download & Export Settings */}
        <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--text-primary)" }}>
            <Download size={16} />
            <h3 style={{ fontSize: "14px", fontWeight: 600 }}>{language === "tr" ? "Dışa Aktarma ve İndirme" : "Export & Downloads"}</h3>
          </div>

          <Switch
            label={language === "tr" ? "Her indirmede konum sor" : "Ask for destination path on each export"}
            description={language === "tr" ? "Açıkken her dışa aktarma işleminde Windows Kaydetme penceresi açılır." : "When enabled, a save location dialog will open for each export action."}
            checked={askExportLocation}
            onChange={async (checked) => {
              setAskExportLocation(checked);
              await persistSettings();
            }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>
              {language === "tr" ? "Varsayılan İndirme Klasörü" : "Default Export Directory"}
            </span>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <input
                type="text"
                readOnly
                value={defaultExportDirectory || (language === "tr" ? "Belirlenmedi (Her seferinde sorulur)" : "Not set (Prompt every time)")}
                style={{
                  flex: 1,
                  height: "34px",
                  padding: "0 10px",
                  fontSize: "12.5px",
                  color: defaultExportDirectory ? "var(--text-primary)" : "var(--text-tertiary)",
                  backgroundColor: "var(--surface-subtle)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  outline: "none",
                }}
              />
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Folder size={14} />}
                onClick={handlePickDefaultDirectory}
              >
                {t("common.edit")}
              </Button>
            </div>
          </div>
        </section>

        <div style={{ height: "1px", backgroundColor: "var(--separator)" }} />

        {/* Window & Close Behavior */}
        <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--text-primary)" }}>
            <RotateCcw size={16} />
            <h3 style={{ fontSize: "14px", fontWeight: 600 }}>{t("settings.closeActionTitle")}</h3>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-4)" }}>
            <div>
              <span style={{ fontSize: "13.5px", fontWeight: 500, color: "var(--text-primary)" }}>
                {language === "tr" ? "Pencere Kapatıldığında (X)" : "When Closing Window (X)"}
              </span>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                {t("settings.closeActionDesc")}
              </p>
            </div>
            <select
              value={closeAction}
              onChange={async (e) => {
                const val = e.target.value as "ask" | "minimize-to-tray" | "close-app";
                setCloseAction(val);
                await persistSettings();
              }}
              style={{
                height: "34px",
                padding: "0 10px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                backgroundColor: "var(--surface)",
                color: "var(--text-primary)",
                fontSize: "13px",
                outline: "none",
                minWidth: "200px",
              }}
            >
              <option value="ask">{t("settings.closeActionAsk")}</option>
              <option value="minimize-to-tray">{t("settings.closeActionMinimize")}</option>
              <option value="close-app">{t("settings.closeActionExit")}</option>
            </select>
          </div>
        </section>

        <div style={{ height: "1px", backgroundColor: "var(--separator)" }} />

        {/* About Section */}
        <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--text-primary)" }}>
            <Info size={16} />
            <h3 style={{ fontSize: "14px", fontWeight: 600 }}>{t("settings.aboutTab")}</h3>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-4)",
              padding: "var(--space-4)",
              borderRadius: "var(--radius-lg)",
              backgroundColor: "var(--surface-subtle)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <Logo size={42} showText={false} />
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "14.5px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                  Env Vault
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "2px 7px",
                    borderRadius: "6px",
                    backgroundColor: "var(--accent-subtle)",
                    color: "var(--accent)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {t("settings.appVersion")} {appVersion}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12.5px", color: "var(--text-secondary)", fontWeight: 500 }}>
                  {t("settings.developer")}: <strong style={{ color: "var(--text-primary)" }}>Vellium</strong>
                </span>
                <span style={{ fontSize: "11.5px", color: "var(--text-tertiary)" }}>&bull;</span>
                <a
                  href="https://vellium.dev"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: "12px",
                    color: "var(--accent)",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = "underline")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = "none")}
                >
                  Vellium.dev
                </a>
              </div>
              <span style={{ fontSize: "11.5px", color: "var(--text-tertiary)" }}>
                © 2026 Vellium. {language === "tr" ? "Tüm hakları saklıdır." : "All rights reserved."}
              </span>
            </div>
          </div>
        </section>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
          <Button variant="primary" onClick={onClose}>
            {t("common.done")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
