import React, { useState } from "react";
import {
  Globe2,
  Keyboard,
  LogOut,
  Power,
  Rocket,
  TimerReset,
} from "lucide-react";
import { usePreferencesStore } from "../../../stores/usePreferencesStore";
import { useTranslation } from "../../../i18n";
import { usePreferencesPersistence } from "../../../lib/settings-sync";
import { systemApi } from "../../../lib/tauri/system-api";
import { ToggleRow } from "./ToggleRow";
import { CloseAction } from "../../../types";

export const GeneralSection: React.FC = () => {
  const { t, language, setLanguage, languages } = useTranslation();
  const startWithWindows = usePreferencesStore((state) => state.startWithWindows);
  const startMinimized = usePreferencesStore((state) => state.startMinimized);
  const globalShortcutEnabled = usePreferencesStore((state) => state.globalShortcutEnabled);
  const closeAction = usePreferencesStore((state) => state.closeAction);
  const persist = usePreferencesPersistence();
  const [startupError, setStartupError] = useState<string | null>(null);
  const [shortcutError, setShortcutError] = useState<string | null>(null);
  const [pendingStartup, setPendingStartup] = useState(false);

  const updateStartup = async (enabled: boolean, minimized: boolean) => {
    setStartupError(null);
    setPendingStartup(true);
    try {
      await systemApi.setStartWithWindows(enabled, minimized);
      usePreferencesStore.getState().updateSettings({
        startWithWindows: enabled,
        startMinimized: minimized,
      });
    } catch {
      setStartupError(t("common.error"));
    } finally {
      setPendingStartup(false);
    }
  };

  const updateShortcut = async (enabled: boolean) => {
    setShortcutError(null);
    try {
      await systemApi.setGlobalShortcut(enabled, null);
      usePreferencesStore.getState().updateSettings({ globalShortcutEnabled: enabled });
    } catch {
      setShortcutError(t("common.error"));
    }
  };

  return (
    <div className="stack">
      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Globe2 size={16} aria-hidden />
              {t("settings.languageTitle")}
            </div>
            <p className="card-subtitle">{t("settings.languageDesc")}</p>
          </div>
        </div>
        <select
          className="control"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          aria-label={t("settings.languageTitle")}
        >
          {languages.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {entry.nativeName} ({entry.englishName})
            </option>
          ))}
        </select>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Rocket size={16} aria-hidden />
              {t("settings.startupTitle")}
            </div>
            <p className="card-subtitle">{t("settings.startWithWindowsDesc")}</p>
          </div>
        </div>
        <ToggleRow
          icon={Power}
          label={t("settings.startWithWindows")}
          description={t("settings.startWithWindowsDesc")}
          checked={startWithWindows}
          disabled={pendingStartup}
          onChange={(checked) => updateStartup(checked, startMinimized)}
        />
        <ToggleRow
          icon={LogOut}
          label={t("settings.startMinimized")}
          description={t("settings.startMinimizedDesc")}
          checked={startMinimized}
          disabled={pendingStartup || !startWithWindows}
          onChange={(checked) => updateStartup(startWithWindows, checked)}
        />
        {startupError && <p className="form-error">{startupError}</p>}
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Keyboard size={16} aria-hidden />
              {t("settings.hotkeyTitle")}
            </div>
            <p className="card-subtitle">{t("settings.hotkeyDesc")}</p>
          </div>
          <kbd>Ctrl + Alt + N</kbd>
        </div>
        <ToggleRow
          label={t("settings.hotkeyEnable")}
          checked={globalShortcutEnabled}
          onChange={updateShortcut}
        />
        {shortcutError && <p className="form-error">{shortcutError}</p>}
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <TimerReset size={16} aria-hidden />
              {t("settings.closeActionTitle")}
            </div>
            <p className="card-subtitle">{t("settings.closeActionDesc")}</p>
          </div>
        </div>
        <select
          className="control"
          value={closeAction}
          onChange={(event) =>
            persist({ closeAction: event.target.value as CloseAction }, true)
          }
          aria-label={t("settings.closeActionTitle")}
        >
          <option value="ask">{t("settings.closeActionAsk")}</option>
          <option value="minimize-to-tray">{t("settings.closeActionMinimize")}</option>
          <option value="close-app">{t("settings.closeActionExit")}</option>
        </select>
      </section>
    </div>
  );
};
