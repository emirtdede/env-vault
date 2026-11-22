import React from "react";
import { EyeOff, KeyRound, ShieldAlert, Timer } from "lucide-react";
import { usePreferencesStore } from "../../../stores/usePreferencesStore";
import { useDialogStore } from "../../../stores/useDialogStore";
import { useTranslation } from "../../../i18n";
import { usePreferencesPersistence } from "../../../lib/settings-sync";
import { ToggleRow } from "./ToggleRow";
import { Button } from "../../../components/primitives/Button";
import { AutoLockDuration } from "../../../types";
import { vaultApi } from "../../../lib/tauri/vault-api";
import { useVaultSessionStore } from "../../../stores/useVaultSessionStore";

const AUTO_LOCK_OPTIONS: { value: AutoLockDuration; key: string }[] = [
  { value: 1, key: "settings.autoLock1m" },
  { value: 5, key: "settings.autoLock5m" },
  { value: 15, key: "settings.autoLock15m" },
  { value: 30, key: "settings.autoLock30m" },
  { value: 60, key: "settings.autoLock60m" },
  { value: 0, key: "settings.autoLockNever" },
];

const CLIPBOARD_OPTIONS = [
  { value: 30, key: "settings.clipboard30s" },
  { value: 60, key: "settings.clipboard60s" },
  { value: 120, key: "settings.clipboard120s" },
  { value: 0, key: "settings.clipboardNever" },
];

export const SecuritySection: React.FC = () => {
  const { t } = useTranslation();
  const autoLockMinutes = usePreferencesStore((state) => state.autoLockMinutes);
  const autoHideSecrets = usePreferencesStore((state) => state.autoHideSecrets);
  const clearClipboardSeconds = usePreferencesStore((state) => state.clearClipboardSeconds);
  const persist = usePreferencesPersistence();
  const openChangePassword = useDialogStore((state) => state.openChangePassword);
  const showConfirm = useDialogStore((state) => state.showConfirm);
  const fetchState = useVaultSessionStore((state) => state.fetchState);

  const resetVault = async () => {
    await vaultApi.resetVault();
    await fetchState();
  };

  return (
    <div className="stack">
      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <KeyRound size={16} aria-hidden />
              {t("settings.changePassword")}
            </div>
            <p className="card-subtitle">{t("settings.changePasswordDesc")}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={openChangePassword}>
            {t("settings.changePasswordButton")}
          </Button>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Timer size={16} aria-hidden />
              {t("settings.autoLockTitle")}
            </div>
            <p className="card-subtitle">{t("settings.autoLockDesc")}</p>
          </div>
        </div>
        <select
          className="control"
          value={autoLockMinutes}
          onChange={(event) =>
            persist({ autoLockMinutes: Number(event.target.value) as AutoLockDuration }, true)
          }
          aria-label={t("settings.autoLockTitle")}
        >
          {AUTO_LOCK_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.key)}
            </option>
          ))}
        </select>
        <ToggleRow
          icon={EyeOff}
          label={t("settings.autoHideSecretsTitle")}
          description={t("settings.autoHideSecretsDesc")}
          checked={autoHideSecrets}
          onChange={(checked) => persist({ autoHideSecrets: checked })}
        />
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">{t("settings.clipboardTitle")}</div>
            <p className="card-subtitle">{t("settings.clipboardDesc")}</p>
          </div>
        </div>
        <select
          className="control"
          value={clearClipboardSeconds}
          onChange={(event) => persist({ clearClipboardSeconds: Number(event.target.value) })}
          aria-label={t("settings.clipboardTitle")}
        >
          {CLIPBOARD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.key)}
            </option>
          ))}
        </select>
      </section>

      <section className="card card-danger">
        <div className="card-header">
          <div>
            <div className="card-title">
              <ShieldAlert size={16} aria-hidden />
              {t("settings.resetVault")}
            </div>
            <p className="card-subtitle">{t("settings.resetVaultDesc")}</p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() =>
              showConfirm({
                title: t("settings.resetVaultConfirmTitle"),
                message: t("settings.resetVaultConfirmDesc"),
                confirmLabel: t("settings.resetVault"),
                isDestructive: true,
                onConfirm: resetVault,
              })
            }
          >
            {t("settings.resetVault")}
          </Button>
        </div>
      </section>
    </div>
  );
};
