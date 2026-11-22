import React from "react";
import { Download, FolderDown, Upload } from "lucide-react";
import { usePreferencesStore } from "../../../stores/usePreferencesStore";
import { useDialogStore } from "../../../stores/useDialogStore";
import { useTranslation } from "../../../i18n";
import { usePreferencesPersistence } from "../../../lib/settings-sync";
import { ToggleRow } from "./ToggleRow";
import { Button } from "../../../components/primitives/Button";
import { CloudCard } from "./CloudCard";
import { CollisionPolicy } from "../../../types";

export const DataSection: React.FC = () => {
  const { t } = useTranslation();
  const askExportLocation = usePreferencesStore((state) => state.askExportLocation);
  const defaultExportDirectory = usePreferencesStore((state) => state.defaultExportDirectory);
  const exportCollisionPolicy = usePreferencesStore((state) => state.exportCollisionPolicy);
  const persist = usePreferencesPersistence();
  const openBackup = useDialogStore((state) => state.openBackup);
  const openRestore = useDialogStore((state) => state.openRestore);

  const pickDirectory = async () => {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const selected = await open({ directory: true, multiple: false });
    if (typeof selected === "string") await persist({ defaultExportDirectory: selected });
  };

  return (
    <div className="stack">
      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Download size={16} aria-hidden />
              {t("settings.backupAndRestore")}
            </div>
            <p className="card-subtitle">{t("settings.backupAndRestoreDesc")}</p>
          </div>
        </div>
        <div className="inline">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Download size={14} />}
            onClick={openBackup}
          >
            {t("settings.backupButton")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Upload size={14} />}
            onClick={openRestore}
          >
            {t("settings.restoreButton")}
          </Button>
        </div>
      </section>

      <CloudCard />

      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <FolderDown size={16} aria-hidden />
              {t("settings.exportTab")}
            </div>
          </div>
        </div>

        <ToggleRow
          label={t("settings.askLocation")}
          description={t("settings.askLocationDesc")}
          checked={askExportLocation}
          onChange={(checked) => persist({ askExportLocation: checked })}
        />

        <div className="row">
          <div>
            <div className="row-label">{t("settings.defaultLocation")}</div>
            <div className="row-desc path-text" title={defaultExportDirectory ?? undefined}>
              {defaultExportDirectory || t("common.none")}
            </div>
          </div>
          <div className="row-control">
            <Button variant="secondary" size="sm" onClick={pickDirectory}>
              {t("common.browse")}
            </Button>
            {defaultExportDirectory && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => persist({ defaultExportDirectory: null })}
              >
                {t("common.clear")}
              </Button>
            )}
          </div>
        </div>

        <div className="stack-sm">
          <div>
            <div className="row-label">{t("settings.exportPolicyTitle")}</div>
            <div className="row-desc">{t("settings.exportPolicyDesc")}</div>
          </div>
          <select
            className="control"
            value={exportCollisionPolicy}
            onChange={(event) =>
              persist({
                exportCollisionPolicy: event.target.value as CollisionPolicy,
              })
            }
            aria-label={t("settings.exportPolicyTitle")}
          >
            <option value="ask">{t("settings.exportPolicyAsk")}</option>
            <option value="overwrite">{t("settings.exportPolicyOverwrite")}</option>
            <option value="rename">{t("settings.exportPolicyRename")}</option>
          </select>
        </div>
      </section>
    </div>
  );
};
