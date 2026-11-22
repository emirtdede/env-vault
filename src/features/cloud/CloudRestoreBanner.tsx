import React, { useEffect, useState } from "react";
import { CloudDownload, FolderPlus, X } from "lucide-react";
import { useTranslation } from "../../i18n";
import { useRestorePromptStore } from "../../stores/useRestorePromptStore";
import { useVaultSessionStore } from "../../stores/useVaultSessionStore";
import { useNavigationStore } from "../../stores/useNavigationStore";
import { cloudApi } from "../../lib/tauri/cloud-api";
import { Button } from "../../components/primitives/Button";

export const CloudRestoreBanner: React.FC = () => {
  const { t } = useTranslation();
  const proposal = useRestorePromptStore((state) => state.proposal);
  const dismissed = useRestorePromptStore((state) => state.dismissed);
  const setProposal = useRestorePromptStore((state) => state.setProposal);
  const dismiss = useRestorePromptStore((state) => state.dismiss);
  const vaultState = useVaultSessionStore((state) => state.state);
  const fetchState = useVaultSessionStore((state) => state.fetchState);
  const setView = useNavigationStore((state) => state.setView);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (dismissed || vaultState !== "uninitialized") return;
    let cancelled = false;
    cloudApi
      .detectRestore()
      .then((next) => {
        if (!cancelled && next.found) setProposal(next);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [dismissed, setProposal, vaultState]);

  if (!proposal?.found || vaultState !== "uninitialized") return null;

  const restore = async () => {
    setBusy(true);
    try {
      await cloudApi.restore();
      await fetchState();
      setView("vault");
      dismiss();
    } catch {
      // Keep the prompt open; the failure is visible through the vault state.
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-panel" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div className="card-title">
            <CloudDownload size={17} aria-hidden />
            {t("cloud.restorePromptTitle")}
          </div>
          <button
            type="button"
            className="tb-window-button"
            onClick={dismiss}
            aria-label={t("common.close")}
          >
            <X size={16} aria-hidden />
          </button>
        </div>
        <div className="modal-body stack-sm">
          <p className="muted">
            {t("cloud.restorePromptDesc", { path: proposal.cloudDir })}
          </p>
          {proposal.exportedAt && (
            <p className="tiny">
              {t("cloud.lastSync", {
                time: new Date(proposal.exportedAt).toLocaleString(),
              })}
            </p>
          )}
          {proposal.summary && (
            <p className="tiny">
              {t("cloud.snapshotInfo", {
                projects: proposal.summary.projects,
                documents: proposal.summary.documents,
              })}
            </p>
          )}
        </div>
        <div className="modal-footer">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<FolderPlus size={14} />}
            onClick={dismiss}
          >
            {t("cloud.freshStart")}
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={busy}
            leftIcon={<CloudDownload size={14} />}
            onClick={restore}
          >
            {t("cloud.restoreAction")}
          </Button>
        </div>
      </div>
    </div>
  );
};
