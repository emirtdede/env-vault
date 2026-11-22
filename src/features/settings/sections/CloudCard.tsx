import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Cloud,
  CloudCog,
  FolderOpen,
  RotateCcw,
  Unplug,
  UploadCloud,
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "../../../i18n";
import { Button } from "../../../components/primitives/Button";
import { cloudApi } from "../../../lib/tauri/cloud-api";
import { useToastStore } from "../../../stores/useToastStore";
import { CloudProviderInfo, CloudStatus } from "../../../types";
import { usePreferencesStore } from "../../../stores/usePreferencesStore";
import { persistSettingsPatch } from "../../../lib/settings-sync";

const PROVIDER_LABELS: Record<string, string> = {
  onedrive: "cloud.providerOneDrive",
  "google-drive": "cloud.providerGoogleDrive",
  dropbox: "cloud.providerDropbox",
  icloud: "cloud.providerICloud",
  yandex: "cloud.providerYandex",
  nextcloud: "cloud.providerNextcloud",
  custom: "cloud.providerCustom",
  none: "cloud.providerNone",
};

export const CloudCard: React.FC = () => {
  const { t, language } = useTranslation();
  const pushToast = useToastStore((state) => state.push);
  const autoSyncEnabled = usePreferencesStore((state) => state.autoSyncEnabled);

  const [status, setStatus] = useState<CloudStatus | null>(null);
  const [providers, setProviders] = useState<CloudProviderInfo[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [nextStatus, nextProviders] = await Promise.all([
        cloudApi.status(),
        cloudApi.providers(),
      ]);
      setStatus(nextStatus);
      setProviders(nextProviders);
    } catch {
      setError(t("cloud.errorGeneric"));
    }
  }, [t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectedProvider = useMemo(() => {
    if (!status) return "none";
    return status.provider === "none" ? providers[0]?.id ?? "custom" : status.provider;
  }, [providers, status]);

  const run = async (key: string, action: () => Promise<void>) => {
    setBusy(key);
    setError(null);
    try {
      await action();
      await refresh();
    } catch {
      setError(t("cloud.errorGeneric"));
    } finally {
      setBusy(null);
    }
  };

  const connect = () =>
    run("connect", async () => {
      const target = providers.find((provider) => provider.id === selectedProvider);
      if (!target) {
        // No provider detected on this machine: fall back to a custom folder.
        const { open } = await import("@tauri-apps/plugin-dialog");
        const selected = await open({ directory: true, multiple: false });
        if (typeof selected !== "string") return;
        await cloudApi.setFolder(selected);
        await cloudApi.syncNow();
        pushToast(t("cloud.connectSuccess"), "success");
        return;
      }
      await cloudApi.connect(target.id, target.path);
      pushToast(t("cloud.connectSuccess"), "success");
    });

  const chooseFolder = () =>
    run("folder", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({ directory: true, multiple: false });
      if (typeof selected !== "string") return;
      await cloudApi.setFolder(selected);
      await cloudApi.syncNow();
      pushToast(t("cloud.connectSuccess"), "success");
    });

  const syncNow = () =>
    run("sync", async () => {
      const outcome = await cloudApi.syncNow();
      pushToast(
        outcome.skippedEmpty ? t("cloud.emptyGuard") : t("cloud.syncSuccess"),
        outcome.skippedEmpty ? "info" : "success"
      );
    });

  const restore = () =>
    run("restore", async () => {
      await cloudApi.restore();
      pushToast(t("cloud.restoreSuccess"), "success");
    });

  const openFolder = () =>
    run("open", async () => {
      await cloudApi.openFolder();
    });

  const disconnect = () =>
    run("disconnect", async () => {
      await cloudApi.disconnect();
      pushToast(t("cloud.disconnected"), "info");
    });

  const toggleAutoSync = async (enabled: boolean) => {
    await persistSettingsPatch({ autoSyncEnabled: enabled });
    if (status?.connected) {
      await cloudApi.setAutoSync(enabled);
      setStatus({ ...status, autoSync: enabled });
    }
  };

  const lastSyncLabel = status?.lastSync
    ? t("cloud.lastSync", { time: new Date(status.lastSync).toLocaleString(language) })
    : t("cloud.neverSynced");

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <div className="card-title">
            <Cloud size={16} aria-hidden />
            {t("cloud.title")}
            {status?.connected && (
              <span className="badge badge-success">
                <CheckCircle2 size={11} aria-hidden />
                {t("cloud.connected")}
              </span>
            )}
          </div>
          <p className="card-subtitle">{t("cloud.desc")}</p>
        </div>
      </div>

      <div className="stack-sm">
        <label className="field-label" htmlFor="cloud-provider">
          {t("cloud.providerLabel")}
        </label>
        <select
          id="cloud-provider"
          className="control"
          value={selectedProvider}
          onChange={(event) => {
            setStatus((current) =>
              current ? { ...current, provider: event.target.value } : current
            );
          }}
          disabled={Boolean(busy) || providers.length === 0}
        >
          {providers.length === 0 && <option value="custom">{t("cloud.customFolder")}</option>}
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {t(PROVIDER_LABELS[provider.id] ?? "cloud.providerCustom")} - {provider.path}
            </option>
          ))}
        </select>
        <p className="tiny">{t("cloud.syncScope")}</p>
      </div>

      {status?.connected ? (
        <>
          <div className="cloud-status">
            <span className="cloud-dot is-connected" aria-hidden />
            <span>{lastSyncLabel}</span>
            {status.summary && (
              <span>
                {t("cloud.snapshotInfo", {
                  projects: status.summary.projects,
                  documents: status.summary.documents,
                })}
              </span>
            )}
            <span>{t("cloud.backupFilesCount", { count: status.backupFiles })}</span>
          </div>
          {status.cloudDir && <p className="path-text">{status.cloudDir}</p>}

          <div className="cloud-actions">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<UploadCloud size={14} />}
              isLoading={busy === "sync"}
              onClick={syncNow}
            >
              {t("cloud.syncNow")}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RotateCcw size={14} />}
              isLoading={busy === "restore"}
              onClick={restore}
            >
              {t("cloud.restoreFromCloud")}
            </Button>
            <Button
              variant="subtle"
              size="sm"
              leftIcon={<FolderOpen size={14} />}
              onClick={openFolder}
            >
              {t("cloud.openFolder")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Unplug size={14} />}
              onClick={disconnect}
            >
              {t("cloud.disconnect")}
            </Button>
          </div>

          <label className="cloud-toggle">
            <input
              type="checkbox"
              checked={autoSyncEnabled}
              onChange={(event) => toggleAutoSync(event.target.checked)}
            />
            <span>
              <span className="row-label">{t("cloud.autoSync")}</span>
              <span className="row-desc">{t("cloud.autoSyncDesc")}</span>
            </span>
          </label>
        </>
      ) : (
        <div className="cloud-actions">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<CloudCog size={14} />}
            isLoading={busy === "connect"}
            onClick={connect}
          >
            {t("cloud.connect")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<FolderOpen size={14} />}
            isLoading={busy === "folder"}
            onClick={chooseFolder}
          >
            {t("cloud.chooseFolder")}
          </Button>
        </div>
      )}

      {error && <p className="form-error">{error}</p>}
    </section>
  );
};
