import React, { useState } from "react";
import { Monitor, Power, Check } from "lucide-react";
import { Dialog } from "../primitives/Dialog";
import { Button } from "../primitives/Button";
import { useDialogStore } from "../../stores/useDialogStore";
import { usePreferencesStore } from "../../stores/usePreferencesStore";
import { settingsApi } from "../../lib/tauri/settings-api";
import { windowApi } from "../../lib/tauri/window-api";
import { useTranslation } from "../../i18n";

export const CloseActionModal: React.FC = () => {
  const { t, language } = useTranslation();
  const isOpen = useDialogStore((s) => s.isCloseActionOpen);
  const onClose = useDialogStore((s) => s.closeCloseAction);
  const preferences = usePreferencesStore();
  const setCloseAction = usePreferencesStore((s) => s.setCloseAction);

  const [selectedAction, setSelectedAction] = useState<"minimize-to-tray" | "close-app">("minimize-to-tray");
  const [rememberChoice, setRememberChoice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleApplyAction = async (actionToRun?: "minimize-to-tray" | "close-app") => {
    const action = actionToRun || selectedAction;
    try {
      setIsLoading(true);

      if (rememberChoice) {
        setCloseAction(action);
        await settingsApi.updateSettings({
          theme: preferences.theme,
          language: preferences.language,
          autoLockMinutes: preferences.autoLockMinutes,
          autoUnlockWithWindows: preferences.autoUnlockWithWindows,
          autoHideSecrets: preferences.autoHideSecrets,
          clearClipboardSeconds: preferences.clearClipboardSeconds,
          askExportLocation: preferences.askExportLocation,
          defaultExportDirectory: preferences.defaultExportDirectory,
          exportCollisionPolicy: preferences.exportCollisionPolicy,
          closeAction: action,
          reduceMotion: preferences.reduceMotion,
        });
      }

      onClose();

      if (action === "minimize-to-tray") {
        await windowApi.hideToTray();
      } else {
        await windowApi.closeOrExit();
      }
    } catch {
      // Close action fallback
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={t("closeModal.title")} maxWidth="480px">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.45 }}>
          {t("closeModal.question")}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {/* Option 1: Minimize to Tray */}
          <div
            onClick={() => setSelectedAction("minimize-to-tray")}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "var(--space-3)",
              padding: "var(--space-3) var(--space-4)",
              borderRadius: "var(--radius-md)",
              border: `1.5px solid ${
                selectedAction === "minimize-to-tray" ? "var(--accent)" : "var(--border)"
              }`,
              backgroundColor:
                selectedAction === "minimize-to-tray"
                  ? "var(--accent-subtle)"
                  : "var(--surface-subtle)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-md)",
                backgroundColor:
                  selectedAction === "minimize-to-tray"
                    ? "var(--accent)"
                    : "var(--surface-strong)",
                color: selectedAction === "minimize-to-tray" ? "#FFFFFF" : "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Monitor size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    fontSize: "13.5px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {t("closeModal.minimizeOptionTitle")}
                </span>
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 600,
                    padding: "1px 6px",
                    borderRadius: "var(--radius-full)",
                    backgroundColor: "var(--accent-subtle)",
                    color: "var(--accent)",
                  }}
                >
                  {language === "tr" ? "Tavsiye Edilen" : "Recommended"}
                </span>
              </div>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  marginTop: "3px",
                  lineHeight: 1.35,
                }}
              >
                {t("closeModal.minimizeOptionDesc")}
              </p>
            </div>
          </div>

          {/* Option 2: Exit completely */}
          <div
            onClick={() => setSelectedAction("close-app")}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "var(--space-3)",
              padding: "var(--space-3) var(--space-4)",
              borderRadius: "var(--radius-md)",
              border: `1.5px solid ${
                selectedAction === "close-app" ? "var(--danger)" : "var(--border)"
              }`,
              backgroundColor:
                selectedAction === "close-app"
                  ? "var(--danger-subtle)"
                  : "var(--surface-subtle)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-md)",
                backgroundColor:
                  selectedAction === "close-app"
                    ? "var(--danger)"
                    : "var(--surface-strong)",
                color: selectedAction === "close-app" ? "#FFFFFF" : "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Power size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <span
                style={{
                  fontSize: "13.5px",
                  fontWeight: 600,
                  color: selectedAction === "close-app" ? "var(--danger)" : "var(--text-primary)",
                }}
              >
                {t("closeModal.exitOptionTitle")}
              </span>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  marginTop: "3px",
                  lineHeight: 1.35,
                }}
              >
                {t("closeModal.exitOptionDesc")}
              </p>
            </div>
          </div>
        </div>

        {/* Remember choice checkbox */}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            cursor: "pointer",
            marginTop: "var(--space-1)",
            userSelect: "none",
          }}
        >
          <input
            type="checkbox"
            checked={rememberChoice}
            onChange={(e) => setRememberChoice(e.target.checked)}
            style={{
              width: "16px",
              height: "16px",
              cursor: "pointer",
              accentColor: "var(--accent)",
            }}
          />
          <span style={{ fontSize: "12.5px", color: "var(--text-primary)", fontWeight: 500 }}>
            {t("closeModal.rememberChoice")}
          </span>
        </label>

        {/* Footer actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "var(--space-3)",
            marginTop: "var(--space-2)",
          }}
        >
          <Button variant="secondary" onClick={onClose} type="button" disabled={isLoading}>
            {t("common.cancel")}
          </Button>
          <Button
            variant={selectedAction === "close-app" ? "danger" : "primary"}
            onClick={() => handleApplyAction()}
            isLoading={isLoading}
            leftIcon={<Check size={16} />}
          >
            {selectedAction === "close-app" ? t("closeModal.confirmExit") : t("closeModal.confirmMinimize")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
