import React, { useState } from "react";
import { Bell, BellRing, Volume2 } from "lucide-react";
import { usePreferencesStore } from "../../../stores/usePreferencesStore";
import { useTranslation } from "../../../i18n";
import { usePreferencesPersistence } from "../../../lib/settings-sync";
import { systemApi } from "../../../lib/tauri/system-api";
import { ToggleRow } from "./ToggleRow";
import { Button } from "../../../components/primitives/Button";

export const NotificationsSection: React.FC = () => {
  const { t } = useTranslation();
  const notificationsEnabled = usePreferencesStore((state) => state.notificationsEnabled);
  const notificationSound = usePreferencesStore((state) => state.notificationSound);
  const persist = usePreferencesPersistence();
  const [status, setStatus] = useState<string | null>(null);

  const sendTest = async () => {
    setStatus(null);
    try {
      await systemApi.sendTestNotification(
        t("settings.testNotificationTitle"),
        t("settings.testNotificationBody")
      );
      setStatus(t("common.success"));
    } catch {
      setStatus(t("common.error"));
    }
  };

  return (
    <div className="stack">
      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Bell size={16} aria-hidden />
              {t("settings.notificationsTitle")}
            </div>
            <p className="card-subtitle">{t("settings.notificationsSectionDesc")}</p>
          </div>
        </div>

        <ToggleRow
          icon={BellRing}
          label={t("settings.notificationsEnabled")}
          description={t("settings.notificationsEnabledDesc")}
          checked={notificationsEnabled}
          onChange={(checked) => persist({ notificationsEnabled: checked })}
        />
        <ToggleRow
          icon={Volume2}
          label={t("settings.notificationSound")}
          description={t("settings.notificationSoundDesc")}
          checked={notificationSound}
          disabled={!notificationsEnabled}
          onChange={(checked) => persist({ notificationSound: checked })}
        />

        <div className="card-footer">
          <Button size="sm" variant="secondary" onClick={sendTest} disabled={!notificationsEnabled}>
            {t("settings.testNotification")}
          </Button>
          {status && <span className="tiny">{status}</span>}
        </div>
      </section>
    </div>
  );
};
