import React, { useEffect, useState } from "react";
import { Copy, Minus, Square, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useDialogStore } from "../../stores/useDialogStore";
import { usePreferencesStore } from "../../stores/usePreferencesStore";
import { useTranslation } from "../../i18n";
import { windowApi } from "../../lib/tauri/window-api";

/**
 * The window is frameless, so these three buttons are the only window
 * controls. They float above every layer and stay reachable during onboarding
 * and full-screen dialogs.
 */
export const WindowControls: React.FC = () => {
  const { t } = useTranslation();
  const openCloseAction = useDialogStore((state) => state.openCloseAction);
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    const appWindow = getCurrentWindow();
    let disposed = false;
    const sync = () => {
      appWindow
        .isMaximized()
        .then((value) => {
          if (!disposed) setMaximized(value);
        })
        .catch(() => {});
    };
    sync();
    let unlisten: (() => void) | undefined;
    appWindow
      .onResized(sync)
      .then((fn) => {
        unlisten = fn;
      })
      .catch(() => {});
    return () => {
      disposed = true;
      unlisten?.();
    };
  }, []);

  const close = async () => {
    const action = usePreferencesStore.getState().closeAction;
    if (action === "minimize-to-tray") {
      await windowApi.hideToTray();
      return;
    }
    if (action === "close-app") {
      await windowApi.closeOrExit();
      return;
    }
    openCloseAction();
  };

  return (
    <div className="window-controls">
      <button
        type="button"
        className="window-control"
        onClick={() => {
          void getCurrentWindow().minimize();
        }}
        title={t("titlebar.minimize")}
        aria-label={t("titlebar.minimize")}
      >
        <Minus size={15} aria-hidden />
      </button>
      <button
        type="button"
        className="window-control"
        onClick={() => {
          const appWindow = getCurrentWindow();
          if (maximized) {
            void appWindow.unmaximize();
          } else {
            void appWindow.maximize();
          }
        }}
        title={maximized ? t("titlebar.restore") : t("titlebar.maximize")}
        aria-label={maximized ? t("titlebar.restore") : t("titlebar.maximize")}
      >
        {maximized ? <Copy size={13} aria-hidden /> : <Square size={12} aria-hidden />}
      </button>
      <button
        type="button"
        className="window-control is-close"
        onClick={() => {
          void close();
        }}
        title={t("titlebar.close")}
        aria-label={t("titlebar.close")}
      >
        <X size={15} aria-hidden />
      </button>
    </div>
  );
};
