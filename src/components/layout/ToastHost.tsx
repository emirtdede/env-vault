import React from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { useToastStore } from "../../stores/useToastStore";
import { useTranslation } from "../../i18n";

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export const ToastHost: React.FC = () => {
  const { t } = useTranslation();
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  if (!toasts.length) return null;

  return (
    <div className="toast-host" role="status" aria-live="polite">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.tone];
        return (
          <div key={toast.id} className="toast">
            <Icon
              size={16}
              className={`toast-icon-${toast.tone}`}
              aria-hidden
            />
            <span>{toast.message}</span>
            <button
              type="button"
              className="toast-close"
              onClick={() => dismiss(toast.id)}
              aria-label={t("common.close")}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
};
