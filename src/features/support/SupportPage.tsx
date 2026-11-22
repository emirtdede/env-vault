import React, { useEffect, useState } from "react";
import {
  Bug,
  Copy,
  GitBranch,
  Heart,
  Info,
  LifeBuoy,
  MonitorCheck,
} from "lucide-react";
import { useTranslation } from "../../i18n";
import { systemApi } from "../../lib/tauri/system-api";
import { SystemInfo } from "../../types";
import { Button } from "../../components/primitives/Button";
import { useToastStore } from "../../stores/useToastStore";
import { useNavigationStore } from "../../stores/useNavigationStore";
import { useVaultSessionStore } from "../../stores/useVaultSessionStore";
import { openExternalUrl } from "../../lib/utils/open-url";
import { APP_VERSION, REPOSITORY_URL, SPONSOR_URL } from "../../lib/constants";

export const SupportPage: React.FC = () => {
  const { t } = useTranslation();
  const pushToast = useToastStore((state) => state.push);
  const setView = useNavigationStore((state) => state.setView);
  const vaultState = useVaultSessionStore((state) => state.state);
  const [info, setInfo] = useState<SystemInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    systemApi
      .info()
      .then((next) => {
        if (!cancelled) setInfo(next);
      })
      .catch(() => {
        if (!cancelled) {
          setInfo({
            appVersion: APP_VERSION,
            os: navigator.userAgent,
            arch: "unknown",
            locale: navigator.language,
            vaultState,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [vaultState]);

  const copySystemInfo = async () => {
    const payload = [
      `Env Vault ${info?.appVersion ?? APP_VERSION}`,
      `OS: ${info?.os ?? "unknown"}`,
      `Architecture: ${info?.arch ?? "unknown"}`,
      `Locale: ${info?.locale ?? "unknown"}`,
      `Vault: ${info?.vaultState ?? vaultState}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(payload);
      pushToast(t("support.copied"), "success");
    } catch {
      pushToast(t("common.error"), "error");
    }
  };

  const tiles = [
    { label: t("support.versionLabel"), value: info?.appVersion ?? APP_VERSION },
    { label: t("support.osLabel"), value: info?.os ?? "unknown" },
    { label: t("support.archLabel"), value: info?.arch ?? "unknown" },
    { label: t("support.localeLabel"), value: info?.locale ?? "unknown" },
    { label: t("support.vaultStateLabel"), value: info?.vaultState ?? vaultState },
  ];

  return (
    <div className="page" data-testid="support-page">
      <div className="page-main">
        <div className="page-inner">
          <header className="page-header">
            <div>
              <h1 className="page-title">
                <LifeBuoy size={20} aria-hidden />
                {t("support.title")}
              </h1>
              <p className="page-subtitle">{t("support.subtitle")}</p>
            </div>
          </header>

          <section className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <MonitorCheck size={16} aria-hidden />
                  {t("support.copySystemInfo")}
                </div>
                <p className="card-subtitle">{t("support.diagnosticsScope")}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Copy size={14} />}
                onClick={copySystemInfo}
              >
                {t("support.copySystemInfo")}
              </Button>
            </div>
            <div className="info-grid">
              {tiles.map((tile) => (
                <div className="info-tile" key={tile.label}>
                  <div className="info-label">{tile.label}</div>
                  <div className="info-value">{tile.value}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="card-title">{t("support.quickLinks")}</div>
            <div className="link-list">
              <button
                type="button"
                className="link-row"
                onClick={() =>
                  openExternalUrl(`${REPOSITORY_URL}/issues/new?template=bug_report.yml`)
                }
              >
                <Bug size={16} aria-hidden />
                <span>{t("support.reportIssue")}</span>
              </button>
              <button
                type="button"
                className="link-row"
                onClick={() => openExternalUrl(REPOSITORY_URL)}
              >
                <GitBranch size={16} aria-hidden />
                <span>{t("support.github")}</span>
              </button>
              <button
                type="button"
                className="link-row"
                onClick={() => openExternalUrl(SPONSOR_URL)}
              >
                <Heart size={16} aria-hidden />
                <span>{t("support.sponsor")}</span>
              </button>
              <button type="button" className="link-row" onClick={() => setView("docs")}>
                <Info size={16} aria-hidden />
                <span>{t("support.openDocs")}</span>
              </button>
            </div>
            <p className="tiny">{t("support.privacyNote")}</p>
          </section>
        </div>
      </div>
    </div>
  );
};
