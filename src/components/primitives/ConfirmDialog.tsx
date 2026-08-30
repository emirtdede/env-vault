import React from "react";
import { Dialog } from "./Dialog";
import { Button } from "./Button";
import { useTranslation } from "../../i18n";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  title,
  message,
  confirmLabel,
  cancelLabel,
  isDestructive = false,
  onConfirm,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const actualConfirmLabel = confirmLabel || t("common.confirm");
  const actualCancelLabel = cancelLabel || t("common.cancel");

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title} maxWidth="420px">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
        <p
          style={{
            fontSize: "13.5px",
            lineHeight: 1.6,
            color: "var(--text-secondary)",
          }}
        >
          {message}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "var(--space-3)",
            marginTop: "var(--space-2)",
          }}
        >
          <Button variant="secondary" onClick={onClose} disabled={isLoading} autoFocus={isDestructive}>
            {actualCancelLabel}
          </Button>
          <Button
            variant={isDestructive ? "danger" : "primary"}
            onClick={onConfirm}
            isLoading={isLoading}
            autoFocus={!isDestructive}
          >
            {actualConfirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
