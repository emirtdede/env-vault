import React, { useState } from "react";
import { Monitor, Power, Check } from "lucide-react";
import { Dialog } from "../primitives/Dialog";
import { Button } from "../primitives/Button";
import { useDialogStore } from "../../stores/useDialogStore";
import { persistSettingsPatch } from "../../lib/settings-sync";
import { windowApi } from "../../lib/tauri/window-api";
import { useTranslation } from "../../i18n";

type CloseAction = "minimize-to-tray" | "close-app";

const OPTIONS: {
  id: CloseAction;
  titleKey: string;
  descKey: string;
  icon: React.ElementType;
}[] = [
  {
    id: "minimize-to-tray",
    titleKey: "closeModal.minimizeOptionTitle",
    descKey: "closeModal.minimizeOptionDesc",
    icon: Monitor,
  },
  {
    id: "close-app",
    titleKey: "closeModal.exitOptionTitle",
    descKey: "closeModal.exitOptionDesc",
    icon: Power,
  },
];

export const CloseActionModal: React.FC = () => {
  const { t } = useTranslation();
  const isOpen = useDialogStore((s) => s.isCloseActionOpen);
  const onClose = useDialogStore((s) => s.closeCloseAction);

  const [selectedAction, setSelectedAction] = useState<CloseAction>("minimize-to-tray");
  const [rememberChoice, setRememberChoice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleApplyAction = async (actionToRun?: CloseAction) => {
    const action = actionToRun ?? selectedAction;
    try {
      setIsLoading(true);
      if (rememberChoice) {
        await persistSettingsPatch({ closeAction: action }).catch(() => {});
      }
      onClose();
      if (action === "minimize-to-tray") {
        await windowApi.hideToTray();
      } else {
        await windowApi.closeOrExit();
      }
    } catch {
      // The window stays open when the native call fails; the user can retry.
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={t("closeModal.title")} maxWidth="480px">
      <div className="close-modal">
        <p className="close-modal-question">{t("closeModal.question")}</p>

        <div className="close-modal-options" role="radiogroup" aria-label={t("closeModal.question")}>
          {OPTIONS.map(({ id, titleKey, descKey, icon: Icon }) => {
            const selected = selectedAction === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`close-modal-option${selected ? " is-selected" : ""}${
                  id === "close-app" ? " is-destructive" : ""
                }`}
                onClick={() => setSelectedAction(id)}
              >
                <span className="close-modal-option-icon">
                  <Icon size={18} aria-hidden />
                </span>
                <span className="close-modal-option-body">
                  <span className="close-modal-option-title">
                    {t(titleKey)}
                    {id === "minimize-to-tray" && (
                      <span className="close-modal-badge">{t("closeModal.recommended")}</span>
                    )}
                  </span>
                  <span className="close-modal-option-desc">{t(descKey)}</span>
                </span>
              </button>
            );
          })}
        </div>

        <label className="close-modal-remember">
          <input
            type="checkbox"
            checked={rememberChoice}
            onChange={(event) => setRememberChoice(event.target.checked)}
          />
          <span>{t("closeModal.rememberChoice")}</span>
        </label>

        <div className="close-modal-footer">
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
