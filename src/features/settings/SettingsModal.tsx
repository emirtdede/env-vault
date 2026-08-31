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
  ArrowLeft,
  ShieldCheck,
  FileText,
  Lock,
  Package,
  ChevronRight,
  Scale,
  Archive,
  DownloadCloud,
  Upload,
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
import { VelliumLogo } from "../../components/brand/VelliumLogo";
import { useTranslation } from "../../i18n";
import { openExternalUrl } from "../../lib/utils/open-url";
import { LegalPrivacyPolicy } from "./legal/LegalPrivacyPolicy";

import { LegalTermsOfService } from "./legal/LegalTermsOfService";
import { LegalSecurityDisclosure } from "./legal/LegalSecurityDisclosure";
import { LegalLicenses } from "./legal/LegalLicenses";
import { LegalAboutVellium } from "./legal/LegalAboutVellium";

type SettingsView = "main" | "privacy" | "terms" | "security" | "licenses" | "about-vellium";

export const SettingsModal: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const isOpen = useDialogStore((s) => s.isSettingsOpen);
  const settingsInitialView = useDialogStore((s) => s.settingsInitialView);
  const onClose = useDialogStore((s) => s.closeSettings);
  const openBackup = useDialogStore((s) => s.openBackup);
  const openRestore = useDialogStore((s) => s.openRestore);
  const openChangePassword = useDialogStore((s) => s.openChangePassword);
  const showConfirm = useDialogStore((s) => s.showConfirm);
  const resetVault = useVaultSessionStore((s) => s.resetVault);
  const vaultState = useVaultSessionStore((s) => s.state);
  const isUnlocked = vaultState === "unlocked";

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

  const [currentView, setCurrentView] = useState<SettingsView>("main");
  const [appVersion, setAppVersion] = useState("1.0.0");

  useEffect(() => {
    if (isOpen) {
      if (vaultState !== "unlocked") {
        setCurrentView(settingsInitialView === "main" ? "about-vellium" : (settingsInitialView || "about-vellium"));
      } else {
        setCurrentView(settingsInitialView || "main");
      }
    } else {
      setCurrentView("main");
    }
  }, [isOpen, settingsInitialView, vaultState]);

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
    { id: "acik-sari", labelTr: "Açık Sarı", labelEn: "Light Yellow", dotColor: "#CA8A04", pillBg: "#FEF9C3", pillBorder: "rgba(202,138,4,0.16)" },
  ];

  const getModalTitle = () => {
    switch (currentView) {
      case "privacy":
        return t("legal.privacyTitle");
      case "terms":
        return t("legal.termsTitle");
      case "security":
        return t("legal.securityTitle");
      case "licenses":
        return t("legal.licensesTitle");
      case "about-vellium":
        return t("legal.aboutVelliumTitle");
      default:
        return isUnlocked ? t("settings.title") : t("legal.aboutVelliumTitle");
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={getModalTitle()} maxWidth="740px">
      {currentView !== "main" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          {isUnlocked && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ArrowLeft size={14} />}
                onClick={() => setCurrentView("main")}
              >
                {t("legal.backToSettings")}
              </Button>
            </div>
          )}

          {currentView === "privacy" && <LegalPrivacyPolicy />}
          {currentView === "terms" && <LegalTermsOfService />}
          {currentView === "security" && <LegalSecurityDisclosure />}
          {currentView === "licenses" && <LegalLicenses />}
          {currentView === "about-vellium" && <LegalAboutVellium />}

          <div
            style={{
              display: "flex",
              justifyContent: isUnlocked ? "space-between" : "flex-end",
              alignItems: "center",
              marginTop: "var(--space-4)",
              paddingTop: "var(--space-4)",
              borderTop: "1px solid var(--separator)",
            }}
          >
            {isUnlocked && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ArrowLeft size={14} />}
                onClick={() => setCurrentView("main")}
              >
                {t("legal.backToSettings")}
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={onClose}>
              {t("common.close")}
            </Button>
          </div>
        </div>
      ) : isUnlocked ? (

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
                  padding: "var(--space-3) var(--space-4)",
                  borderRadius: "var(--radius-lg)",
                  border: language === "tr" ? "1.5px solid var(--accent)" : "1px solid var(--border-subtle)",
                  backgroundColor: language === "tr" ? "var(--accent-subtle)" : "var(--surface-subtle)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "20px", lineHeight: 1 }}>🇹🇷</span>
                  <div>
                    <div style={{ fontSize: "13.5px", fontWeight: 600 }}>Türkçe</div>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Varsayılan Dil</div>
                  </div>
                </div>
                {language === "tr" && (
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      backgroundColor: "var(--accent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#FFFFFF",
                    }}
                  >
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </button>

              {/* EN Option */}
              <button
                type="button"
                onClick={() => handleSelectLanguage("en")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "var(--space-3) var(--space-4)",
                  borderRadius: "var(--radius-lg)",
                  border: language === "en" ? "1.5px solid var(--accent)" : "1px solid var(--border-subtle)",
                  backgroundColor: language === "en" ? "var(--accent-subtle)" : "var(--surface-subtle)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "20px", lineHeight: 1 }}>🇬🇧</span>
                  <div>
                    <div style={{ fontSize: "13.5px", fontWeight: 600 }}>English</div>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>International</div>
                  </div>
                </div>
                {language === "en" && (
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      backgroundColor: "var(--accent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#FFFFFF",
                    }}
                  >
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </button>
            </div>
          </section>

          <div style={{ height: "1px", backgroundColor: "var(--separator)" }} />

          {/* Theme Selection */}
          <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--text-primary)" }}>
              <Palette size={16} />
              <h3 style={{ fontSize: "14.5px", fontWeight: 700 }}>{t("settings.themeTitle")}</h3>
            </div>

            {/* Dark Themes Group */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600 }}>
                <Moon size={14} />
                <span>{t("settings.darkThemes")}</span>
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
                        gap: "8px",
                        padding: "7px 10px",
                        borderRadius: "var(--radius-md)",
                        border: isSelected ? "2px solid var(--accent)" : "1px solid var(--border)",
                        backgroundColor: isSelected ? "var(--accent-subtle)" : "var(--surface)",
                        color: "var(--text-primary)",
                        cursor: "pointer",
                        fontSize: "12.5px",
                        fontWeight: isSelected ? 600 : 500,
                        textAlign: "left",
                        outline: "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span
                        style={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          backgroundColor: tItem.dotColor,
                          boxShadow: "0 0 6px " + tItem.dotColor + "80",
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Light Themes Group */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginTop: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600 }}>
                <Sun size={14} />
                <span>{t("settings.lightThemes")}</span>
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
                        gap: "8px",
                        padding: "7px 10px",
                        borderRadius: "var(--radius-md)",
                        border: isSelected ? "2px solid var(--accent)" : "1px solid var(--border)",
                        backgroundColor: isSelected ? "var(--accent-subtle)" : "var(--surface)",
                        color: "var(--text-primary)",
                        cursor: "pointer",
                        fontSize: "12.5px",
                        fontWeight: isSelected ? 600 : 500,
                        textAlign: "left",
                        outline: "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span
                        style={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          backgroundColor: tItem.dotColor,
                          boxShadow: "0 0 4px " + tItem.dotColor + "60",
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reduce Motion */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "var(--space-2)" }}>
              <div>
                <span style={{ fontSize: "13.5px", fontWeight: 500, color: "var(--text-primary)" }}>
                  {t("settings.reduceMotion")}
                </span>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  {t("settings.reduceMotionDesc")}
                </p>
              </div>
              <Switch
                checked={reduceMotion}
                onChange={async (checked) => {
                  setReduceMotion(checked);
                  await persistSettings();
                }}
              />
            </div>
          </section>

          <div style={{ height: "1px", backgroundColor: "var(--separator)" }} />

          {/* Security & Vault Section */}
          <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--text-primary)" }}>
              <Shield size={16} />
              <h3 style={{ fontSize: "14.5px", fontWeight: 700 }}>{t("settings.securityTab")}</h3>
            </div>

            {/* Auto Lock Duration */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-4)" }}>
              <div>
                <span style={{ fontSize: "13.5px", fontWeight: 500, color: "var(--text-primary)" }}>
                  {t("settings.autoLock")}
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
                  minWidth: "140px",
                }}
              >
                <option value={1}>1 {t("common.minutes")}</option>
                <option value={5}>5 {t("common.minutes")}</option>
                <option value={15}>15 {t("common.minutes")}</option>
                <option value={30}>30 {t("common.minutes")}</option>
                <option value={60}>1 {language === "tr" ? "Saat" : "Hour"}</option>
                <option value={0}>{t("common.never")}</option>
              </select>
            </div>

            {/* Change Master Password */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontSize: "13.5px", fontWeight: 500, color: "var(--text-primary)" }}>
                  {t("settings.changePassword")}
                </span>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  {t("settings.changePasswordDesc")}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<KeyRound size={14} />}
                onClick={() => {
                  onClose();
                  openChangePassword();
                }}
              >
                {t("settings.changePassword")}
              </Button>
            </div>

            {/* Reset Vault */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontSize: "13.5px", fontWeight: 500, color: "var(--error)" }}>
                  {t("settings.resetVault")}
                </span>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  {t("settings.resetVaultDesc")}
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                leftIcon={<RotateCcw size={14} />}
                onClick={() => {
                  showConfirm({
                    title: t("settings.resetVaultConfirmTitle"),
                    message: t("settings.resetVaultConfirmDesc"),
                    isDestructive: true,
                    onConfirm: async () => {
                      await resetVault();
                      onClose();
                    },
                  });
                }}
              >
                {t("settings.resetVault")}
              </Button>
            </div>
          </section>

          <div style={{ height: "1px", backgroundColor: "var(--separator)" }} />

          {/* Export Settings */}
          <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--text-primary)" }}>
              <Download size={16} />
              <h3 style={{ fontSize: "14.5px", fontWeight: 700 }}>{t("settings.exportTab")}</h3>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontSize: "13.5px", fontWeight: 500, color: "var(--text-primary)" }}>
                  {t("settings.askLocation")}
                </span>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  {t("settings.askLocationDesc")}
                </p>
              </div>
              <Switch
                checked={askExportLocation}
                onChange={async (checked) => {
                  setAskExportLocation(checked);
                  await persistSettings();
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-4)" }}>
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: "13.5px", fontWeight: 500, color: "var(--text-primary)" }}>
                  {t("settings.defaultLocation")}
                </span>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    marginTop: "2px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={defaultExportDirectory || t("common.none")}
                >
                  {defaultExportDirectory || t("common.none")}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Folder size={14} />}
                onClick={handlePickDefaultDirectory}
              >
                {t("common.edit")}
              </Button>
            </div>
          </section>

          <div style={{ height: "1px", backgroundColor: "var(--separator)" }} />

          {/* Backup & Restore Section */}
          <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--text-primary)" }}>
              <Archive size={16} />
              <h3 style={{ fontSize: "14.5px", fontWeight: 700 }}>
                {t("settings.backupAndRestore")}
              </h3>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "-4px" }}>
              {t("settings.backupAndRestoreDesc")}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
              {/* Backup Button */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openBackup();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "var(--space-3) var(--space-4)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  backgroundColor: "var(--surface-subtle)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.backgroundColor = "var(--surface)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-subtle)";
                  e.currentTarget.style.backgroundColor = "var(--surface-subtle)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      backgroundColor: "var(--accent-subtle)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--accent)",
                      flexShrink: 0,
                    }}
                  >
                    <DownloadCloud size={18} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600 }}>
                        {t("settings.backupButton")}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          padding: "1px 6px",
                          borderRadius: "10px",
                          backgroundColor: "var(--accent-subtle)",
                          color: "var(--accent)",
                        }}
                      >
                        {language === "tr" ? "AES-256" : "AES-256"}
                      </span>
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                      {t("settings.backupSubtext")}
                    </span>
                  </div>
                </div>
                <ChevronRight size={15} style={{ color: "var(--text-tertiary)" }} />
              </button>


              {/* Restore Button */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openRestore();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "var(--space-3) var(--space-4)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  backgroundColor: "var(--surface-subtle)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.backgroundColor = "var(--surface)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-subtle)";
                  e.currentTarget.style.backgroundColor = "var(--surface-subtle)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      backgroundColor: "var(--accent-subtle)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--accent)",
                      flexShrink: 0,
                    }}
                  >
                    <Upload size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>
                      {t("settings.restoreButton")}
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                      {t("settings.restoreSubtext")}
                    </span>
                  </div>
                </div>
                <ChevronRight size={15} style={{ color: "var(--text-tertiary)" }} />
              </button>
            </div>
          </section>

          <div style={{ height: "1px", backgroundColor: "var(--separator)" }} />

          {/* Window & Close Behavior */}

          <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--text-primary)" }}>
              <RotateCcw size={16} />
              <h3 style={{ fontSize: "14.5px", fontWeight: 700 }}>{t("settings.closeActionTitle")}</h3>
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

          {/* Legal & Corporate Section */}
          <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--text-primary)" }}>
              <Scale size={16} />
              <h3 style={{ fontSize: "14.5px", fontWeight: 700 }}>{t("legal.sectionTitle")}</h3>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "-4px" }}>
              {t("legal.sectionDesc")}
            </p>

            {/* Legal Cards Grid (2x2) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
              {/* 1. Privacy Policy */}
              <button
                type="button"
                onClick={() => setCurrentView("privacy")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "var(--space-3) var(--space-4)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  backgroundColor: "var(--surface-subtle)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.backgroundColor = "var(--surface)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-subtle)";
                  e.currentTarget.style.backgroundColor = "var(--surface-subtle)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      backgroundColor: "var(--accent-subtle)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--accent)",
                      flexShrink: 0,
                    }}
                  >
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>{t("legal.privacyTitle")}</div>
                    <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>{t("legal.privacyBadge")}</span>
                  </div>
                </div>
                <ChevronRight size={15} style={{ color: "var(--text-tertiary)" }} />
              </button>

              {/* 2. Terms of Service */}
              <button
                type="button"
                onClick={() => setCurrentView("terms")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "var(--space-3) var(--space-4)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  backgroundColor: "var(--surface-subtle)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.backgroundColor = "var(--surface)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-subtle)";
                  e.currentTarget.style.backgroundColor = "var(--surface-subtle)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      backgroundColor: "var(--accent-subtle)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--accent)",
                      flexShrink: 0,
                    }}
                  >
                    <FileText size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>{t("legal.termsTitle")}</div>
                    <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>{t("legal.termsBadge")}</span>
                  </div>
                </div>
                <ChevronRight size={15} style={{ color: "var(--text-tertiary)" }} />
              </button>

              {/* 3. Security & Cryptography */}
              <button
                type="button"
                onClick={() => setCurrentView("security")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "var(--space-3) var(--space-4)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  backgroundColor: "var(--surface-subtle)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.backgroundColor = "var(--surface)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-subtle)";
                  e.currentTarget.style.backgroundColor = "var(--surface-subtle)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      backgroundColor: "var(--accent-subtle)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--accent)",
                      flexShrink: 0,
                    }}
                  >
                    <Lock size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>{t("legal.securityTitle")}</div>
                    <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>{t("legal.securityBadge")}</span>
                  </div>
                </div>
                <ChevronRight size={15} style={{ color: "var(--text-tertiary)" }} />
              </button>

              {/* 4. Open Source Licenses */}
              <button
                type="button"
                onClick={() => setCurrentView("licenses")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "var(--space-3) var(--space-4)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  backgroundColor: "var(--surface-subtle)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.backgroundColor = "var(--surface)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-subtle)";
                  e.currentTarget.style.backgroundColor = "var(--surface-subtle)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      backgroundColor: "var(--accent-subtle)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--accent)",
                      flexShrink: 0,
                    }}
                  >
                    <Package size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>{t("legal.licensesTitle")}</div>
                    <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>{t("legal.licensesBadge")}</span>
                  </div>
                </div>
                <ChevronRight size={15} style={{ color: "var(--text-tertiary)" }} />
              </button>
            </div>

            {/* Featured Vellium Company Card */}
            <button
              type="button"
              onClick={() => setCurrentView("about-vellium")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "var(--space-4)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border)",
                backgroundColor: "var(--surface-subtle)",
                color: "var(--text-primary)",
                cursor: "pointer",
                textAlign: "left",
                marginTop: "4px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.backgroundColor = "var(--surface)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.backgroundColor = "var(--surface-subtle)";
                e.currentTarget.style.transform = "none";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <VelliumLogo size={36} showText={false} />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                      {t("legal.aboutVelliumTitle")}
                    </span>
                    <span
                      style={{
                        fontSize: "10.5px",
                        fontWeight: 600,
                        padding: "1px 6px",
                        borderRadius: "4px",
                        backgroundColor: "var(--accent-subtle)",
                        color: "var(--accent)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      Vellium.dev
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "3px 0 0 0" }}>
                    {t("legal.aboutVelliumDesc")}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--accent)", fontWeight: 600, fontSize: "12.5px" }}>
                <span>{language === "tr" ? "İncele" : "Explore"}</span>
                <ChevronRight size={16} />
              </div>
            </button>
          </section>

          <div style={{ height: "1px", backgroundColor: "var(--separator)" }} />

          {/* About Section */}
          <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--text-primary)" }}>
              <Info size={16} />
              <h3 style={{ fontSize: "14.5px", fontWeight: 700 }}>{t("settings.aboutTab")}</h3>
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
                    onClick={(e) => openExternalUrl("https://vellium.dev", e)}
                    style={{
                      fontSize: "12px",
                      color: "var(--accent)",
                      textDecoration: "none",
                      fontWeight: 600,
                      cursor: "pointer",
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
      ) : null}
    </Dialog>
  );
};

