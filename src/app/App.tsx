import React, { useEffect } from "react";
import { useVaultSessionStore } from "../stores/useVaultSessionStore";
import { useProjectStore } from "../stores/useProjectStore";
import { usePreferencesStore } from "../stores/usePreferencesStore";
import { useDialogStore } from "../stores/useDialogStore";
import { useEditorStore } from "../stores/useEditorStore";
import { settingsApi } from "../lib/tauri/settings-api";
import { useTranslation } from "../i18n";

// Layout components
import { TitleBar } from "../components/layout/TitleBar";
import { WindowResizeHandles } from "../components/layout/WindowResizeHandles";

// Sub-components
import { VaultSetup } from "../features/vault/VaultSetup";
import { VaultLockScreen } from "../features/vault/VaultLockScreen";
import { ProjectSidebar } from "../features/projects/ProjectSidebar";
import { ProjectHeader } from "../features/projects/ProjectHeader";
import { CreateProjectModal } from "../features/projects/CreateProjectModal";
import { EditProjectModal } from "../features/projects/EditProjectModal";
import { EnvDocumentList } from "../features/env-documents/EnvDocumentList";
import { AddEnvModal } from "../features/env-documents/AddEnvModal";
import { EnvEditor } from "../features/editor/EnvEditor";
import { ImportDropOverlay } from "../features/import/ImportDropOverlay";
import { SettingsModal } from "../features/settings/SettingsModal";
import { BackupModal } from "../features/backup/BackupModal";
import { RestoreModal } from "../features/backup/RestoreModal";
import { ChangePasswordModal } from "../features/vault/ChangePasswordModal";
import { CloseActionModal } from "../components/layout/CloseActionModal";
import { EnvDiffModal } from "../features/env-documents/EnvDiffModal";
import { ConfirmDialog } from "../components/primitives/ConfirmDialog";


export const App: React.FC = () => {
  const { t, language } = useTranslation();
  const vaultState = useVaultSessionStore((s) => s.state);
  const fetchVaultState = useVaultSessionStore((s) => s.fetchState);
  const lockVault = useVaultSessionStore((s) => s.lock);

  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const theme = usePreferencesStore((s) => s.theme);
  const updateSettings = usePreferencesStore((s) => s.updateSettings);

  const openCreateProject = useDialogStore((s) => s.openCreateProject);
  const openAddEnv = useDialogStore((s) => s.openAddEnv);
  const confirmDialog = useDialogStore((s) => s.confirmDialog);
  const closeConfirm = useDialogStore((s) => s.closeConfirm);

  const activeDocId = useEditorStore((s) => s.activeDocId);
  const saveEditor = useEditorStore((s) => s.save);
  const closeEditor = useEditorStore((s) => s.closeDocument);

  // Apply theme to html data-theme attribute
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Purge editor memory immediately whenever vault is locked or uninitialized
  useEffect(() => {
    if (vaultState !== "unlocked") {
      closeEditor();
    }
  }, [vaultState, closeEditor]);

  // Load initial vault status and settings
  useEffect(() => {
    const init = async () => {
      try {
        const storedSettings = await settingsApi.getSettings();
        updateSettings(storedSettings);
      } catch {}
      await fetchVaultState();
    };
    init();
  }, [fetchVaultState, updateSettings]);

  // Fetch projects when unlocked
  useEffect(() => {
    if (vaultState === "unlocked") {
      fetchProjects();
    }
  }, [vaultState, fetchProjects]);

  // Global Keyboard Shortcuts
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
        lockVault();
      } else if (e.ctrlKey && e.key.toLowerCase() === "s" && activeDocId) {
        e.preventDefault();
        saveEditor().catch(() => {});
      } else if (e.ctrlKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          "input[type='search'], input[placeholder*='Ara'], input[placeholder*='Search']"
        );
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    };


    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [vaultState, openCreateProject, openAddEnv, lockVault, activeDocId, saveEditor]);

  return (
    <div
      data-testid="app-root"
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: "var(--app-bg)",
        color: "var(--text-primary)",
        overflow: "hidden",
      }}
    >
      {/* Invisible Native Window Edge and Corner Resizing Handles */}
      <WindowResizeHandles />

      {/* Custom Unified Header with Brand, Live Theme Switcher and Window Controls */}
      <TitleBar />

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          width: "100%",
          height: "calc(100% - 38px)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {vaultState === "uninitialized" && <VaultSetup />}
        {vaultState === "locked" && <VaultLockScreen />}
        {vaultState === "error" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", padding: "var(--space-6)" }}>
            <div style={{ maxWidth: "440px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600 }}>
                {language === "tr" ? "Vault Durumu Alınamadı" : "Could Not Retrieve Vault State"}
              </h2>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                {language === "tr" ? "Uygulama arka plan servisiyle iletişim kurulamadı." : "Could not communicate with the application backend service."}
              </p>
              <button
                onClick={() => fetchVaultState()}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "var(--accent)",
                  color: "#FFF",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                }}
              >
                {t("common.refresh")}
              </button>
            </div>
          </div>
        )}
        {vaultState === "unlocked" && (
          <div style={{ display: "flex", width: "100%", height: "100%", overflow: "hidden" }}>
            <ProjectSidebar />
            <main style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
              <ProjectHeader />
              <EnvDocumentList />
            </main>
          </div>
        )}
      </div>

      {/* Editor Full Overlay */}
      {activeDocId && <EnvEditor />}

      {/* Explorer Drag-in Overlay */}
      {vaultState === "unlocked" && <ImportDropOverlay />}

      {/* Global Modals */}
      <CreateProjectModal />
      <EditProjectModal />
      <AddEnvModal />
      <SettingsModal />
      <BackupModal />
      <RestoreModal />
      <ChangePasswordModal />
      <CloseActionModal />
      <EnvDiffModal />

      {/* Reusable Confirm Dialog */}

      {confirmDialog && (
        <ConfirmDialog
          isOpen={true}
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
