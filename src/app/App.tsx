import React, { useEffect, useRef, useState } from "react";
import { useVaultSessionStore } from "../stores/useVaultSessionStore";
import { useProjectStore } from "../stores/useProjectStore";
import { usePreferencesStore } from "../stores/usePreferencesStore";
import { useDialogStore } from "../stores/useDialogStore";
import { useEditorStore } from "../stores/useEditorStore";
import { useEnvStore } from "../stores/useEnvStore";
import { useNavigationStore } from "../stores/useNavigationStore";
import { useRestorePromptStore } from "../stores/useRestorePromptStore";
import { settingsApi } from "../lib/tauri/settings-api";
import { cloudApi } from "../lib/tauri/cloud-api";
import { systemApi } from "../lib/tauri/system-api";
import { initializeI18n, useTranslation } from "../i18n";
import { RTL_LANGUAGES } from "../i18n";
import { applyTheme, applyUiScale, resolveDisplayTheme } from "../lib/theme";
import { toastOnCloudChange } from "../lib/cloud-autosync";

import { AppSidebar } from "../components/layout/AppSidebar";
import { WindowControls } from "../components/layout/WindowControls";
import { Logo } from "../components/brand/Logo";
import { ToastHost } from "../components/layout/ToastHost";
import { WindowResizeHandles } from "../components/layout/WindowResizeHandles";
import { VaultSetup } from "../features/vault/VaultSetup";
import { VaultLockScreen } from "../features/vault/VaultLockScreen";
import { ProjectHeader } from "../features/projects/ProjectHeader";
import { ProjectList } from "../features/projects/ProjectSidebar";
import { CreateProjectModal } from "../features/projects/CreateProjectModal";
import { EditProjectModal } from "../features/projects/EditProjectModal";
import { EnvDocumentList } from "../features/env-documents/EnvDocumentList";
import { AddEnvModal } from "../features/env-documents/AddEnvModal";
import { EnvEditor } from "../features/editor/EnvEditor";
import { ImportDropOverlay } from "../features/import/ImportDropOverlay";
import { BackupModal } from "../features/backup/BackupModal";
import { RestoreModal } from "../features/backup/RestoreModal";
import { ChangePasswordModal } from "../features/vault/ChangePasswordModal";
import { CloseActionModal } from "../components/layout/CloseActionModal";
import { EnvDiffModal } from "../features/env-documents/EnvDiffModal";
import { ConfirmDialog } from "../components/primitives/ConfirmDialog";
import { Onboarding } from "../features/onboarding/Onboarding";
import { SettingsPage } from "../features/settings/SettingsPage";
import { DocsPage } from "../features/docs/DocsPage";
import { AssistantPage } from "../features/assistant/AssistantPage";
import { IntegrationsPage } from "../features/integrations/IntegrationsPage";
import { SupportPage } from "../features/support/SupportPage";
import { AboutPage } from "../features/about/AboutPage";
import { CloudRestoreBanner } from "../features/cloud/CloudRestoreBanner";

export const App: React.FC = () => {
  const { t } = useTranslation();
  const vaultState = useVaultSessionStore((s) => s.state);
  const fetchVaultState = useVaultSessionStore((s) => s.fetchState);
  const lockVault = useVaultSessionStore((s) => s.lock);

  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const theme = usePreferencesStore((s) => s.theme);
  const customAccent = usePreferencesStore((s) => s.customAccent);
  const language = usePreferencesStore((s) => s.language);
  const followSystemTheme = usePreferencesStore((s) => s.followSystemTheme);
  const uiScale = usePreferencesStore((s) => s.uiScale);
  const reduceMotion = usePreferencesStore((s) => s.reduceMotion);
  const onboardingCompleted = usePreferencesStore((s) => s.onboardingCompleted);
  const updateSettings = usePreferencesStore((s) => s.updateSettings);
  const openCreateProject = useDialogStore((s) => s.openCreateProject);
  const openAddEnv = useDialogStore((s) => s.openAddEnv);
  const openCloseAction = useDialogStore((s) => s.openCloseAction);
  const confirmDialog = useDialogStore((s) => s.confirmDialog);
  const closeConfirm = useDialogStore((s) => s.closeConfirm);
  const view = useNavigationStore((s) => s.view);
  const setView = useNavigationStore((s) => s.setView);
  const restoreProposal = useRestorePromptStore((s) => s.proposal);

  const activeDocId = useEditorStore((s) => s.activeDocId);
  const saveEditor = useEditorStore((s) => s.save);
  const closeEditor = useEditorStore((s) => s.closeDocument);

  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : true
  );
  const initializedRef = useRef(false);

  // Load settings and language before the shell paints its content.
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const init = async () => {
      let language: string | null = null;
      try {
        const stored = await settingsApi.getSettings();
        updateSettings(stored);
        language = stored.language;
      } catch {
        // First run or backend unavailable: fall back to the Windows locale.
      }
      await initializeI18n(language);
      setSettingsLoaded(true);
      await fetchVaultState();
    };
    void init();
  }, [fetchVaultState, updateSettings]);

  // Follow the Windows app theme live.
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  // Apply the resolved theme, custom accent and accessibility scale.
  useEffect(() => {
    applyTheme(
      resolveDisplayTheme(
        { theme, customAccent, followSystemTheme },
        systemDark
      ),
      customAccent,
      systemDark
    );
  }, [theme, customAccent, followSystemTheme, systemDark]);

  useEffect(() => {
    applyUiScale(uiScale);
  }, [uiScale]);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-reduce-motion",
      reduceMotion ? "true" : "false"
    );
  }, [reduceMotion]);

  // Keep the document language and text direction aligned with the UI locale.
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = RTL_LANGUAGES.has(language) ? "rtl" : "ltr";
  }, [language]);

  // Re-apply the runtime icon pack after settings are loaded.
  useEffect(() => {
    if (!settingsLoaded) return;
    const iconTheme = usePreferencesStore.getState().iconTheme;
    systemApi.applyIcon(iconTheme).catch(() => {});
  }, [settingsLoaded]);

  useEffect(() => {
    if (vaultState !== "unlocked") {
      closeEditor();
      useEnvStore.getState().clearDocuments();
    }
  }, [vaultState, closeEditor]);

  useEffect(() => {
    if (vaultState === "unlocked") void fetchProjects();
  }, [vaultState, fetchProjects]);

  // Cloud auto-sync: debounce writes to a user-owned folder.
  useEffect(() => {
    if (vaultState !== "unlocked") return;
    return toastOnCloudChange();
  }, [vaultState]);

  // Native tray actions route into the shell.
  useEffect(() => {
    let unlisten: Array<() => void> = [];
    let cancelled = false;
    import("@tauri-apps/api/event").then(({ listen }) => {
      Promise.all([
        listen("navigate-settings", () => setView("settings")),
        listen("navigate-new-project", () => openCreateProject()),
        listen("lock-vault", () => {
          setView("vault");
          void fetchVaultState();
        }),
        listen("close-requested", () => openCloseAction()),
      ])
        .then((fns) => {
          if (cancelled) {
            fns.forEach((fn) => fn());
          } else {
            unlisten = fns;
          }
        })
        .catch(() => {});
    });
    return () => {
      cancelled = true;
      unlisten.forEach((fn) => fn());
    };
  }, [setView, openCreateProject, openCloseAction, fetchVaultState]);

  useEffect(() => {
    if (vaultState === "unlocked") {
      cloudApi.detectRestore().catch(() => {});
    }
  }, [vaultState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (vaultState !== "unlocked") return;
      if (e.ctrlKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        openCreateProject();
      } else if (e.ctrlKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        openAddEnv();
      } else if (e.ctrlKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        void lockVault();
      } else if (e.ctrlKey && e.key.toLowerCase() === "s" && activeDocId) {
        e.preventDefault();
        saveEditor().catch(() => {});
      } else if (e.ctrlKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        document
          .querySelector<HTMLInputElement>("input[data-search-field]")
          ?.focus();
      } else if (e.ctrlKey && e.key === ",") {
        e.preventDefault();
        setView("settings");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [vaultState, openCreateProject, openAddEnv, lockVault, activeDocId, saveEditor, setView]);

  const showOnboarding =
    settingsLoaded &&
    vaultState === "uninitialized" &&
    !onboardingCompleted &&
    !restoreProposal?.found;

  return (
    <div className="app-shell" data-testid="app-root">
      <WindowResizeHandles />
      <WindowControls />

      {!settingsLoaded ? (
        <div className="app-boot">
          <Logo size={30} showText showBadge={false} />
        </div>
      ) : showOnboarding ? (
        <Onboarding onComplete={() => updateSettings({ onboardingCompleted: true })} />
      ) : (
        <>
          <AppSidebar />

          <div className="app-main">
            <div className="app-drag-strip" data-tauri-drag-region />

            {vaultState === "uninitialized" && <VaultSetup />}
            {vaultState === "locked" && <VaultLockScreen />}
            {vaultState === "error" && (
              <div className="center-state">
                <div className="stack-sm" style={{ maxWidth: 420, textAlign: "center" }}>
                  <h2 className="page-title">{t("common.error")}</h2>
                  <p className="muted">{t("common.error")}</p>
                  <button
                    type="button"
                    className="link"
                    onClick={() => void fetchVaultState()}
                  >
                    {t("common.refresh")}
                  </button>
                </div>
              </div>
            )}

            {vaultState === "unlocked" && (
              <>
                {view === "vault" && (
                  <>
                    <main className="page">
                      <aside className="vault-sidebar" aria-label={t("common.projects")}>
                        <ProjectList />
                      </aside>
                      <div className="vault-main">
                        <ProjectHeader />
                        <EnvDocumentList />
                      </div>
                    </main>
                  </>
                )}
                {view === "settings" && <SettingsPage />}
                {view === "assistant" && <AssistantPage />}
                {view === "integrations" && <IntegrationsPage />}
                {view === "docs" && <DocsPage />}
                {view === "support" && <SupportPage />}
                {view === "about" && <AboutPage />}
              </>
            )}
          </div>
        </>
      )}

      <CloudRestoreBanner />

      {activeDocId && <EnvEditor />}
      {vaultState === "unlocked" && <ImportDropOverlay />}

      <CreateProjectModal />
      <EditProjectModal />
      <AddEnvModal />
      <BackupModal />
      <RestoreModal />
      <ChangePasswordModal />
      <CloseActionModal />
      <EnvDiffModal />
      <ToastHost />

      {confirmDialog && (
        <ConfirmDialog
          isOpen
          onClose={closeConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          cancelLabel={confirmDialog.cancelLabel}
          isDestructive={confirmDialog.isDestructive}
          onConfirm={async () => {
            await confirmDialog.onConfirm();
            closeConfirm();
          }}
        />
      )}
    </div>
  );
};
