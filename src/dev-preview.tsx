/**
 * Development-only screenshot harness. This entry point is never referenced by
 * index.html or the production bundle; it exists so documentation screenshots
 * can be captured from the same components the desktop app renders.
 */
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "./styles/global.css";

// Browser-only shell stubs so the desktop chrome can render for screenshots.
const mockResponses: Record<string, unknown> = {
  cloud_status: {
    connected: true,
    provider: "onedrive",
    folder: "C:\\Users\\demo\\OneDrive\\EnvVault",
    autoSync: true,
    lastSync: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    backupFiles: 7,
    summary: { projects: 4, documents: 12 },
    lastError: null,
  },
  cloud_providers: [
    { id: "onedrive", path: "C:\\Users\\demo\\OneDrive", available: true, isDefault: true },
    { id: "google-drive", path: "C:\\Users\\demo\\Google Drive", available: true, isDefault: false },
  ],
  cloud_detect_restore: { found: false, cloudDir: "", exportedAt: null, summary: null },
  get_system_info: {
    appVersion: "1.0.0",
    os: "Windows 11 Pro 24H2",
    arch: "x86_64",
    locale: "en-US",
    vaultState: "unlocked",
  },
  list_projects: [
    {
      id: "p1",
      name: "Atlas API",
      description: "Customer-facing API gateway",
      sourcePath: "C:\\work\\atlas-api",
      createdAt: "2026-01-04T09:20:00Z",
      updatedAt: "2026-02-11T14:05:00Z",
      favorite: true,
      sortOrder: 0,
    },
    {
      id: "p2",
      name: "Orbit Dashboard",
      description: "Internal analytics console",
      sourcePath: "C:\\work\\orbit-dashboard",
      createdAt: "2026-01-12T11:00:00Z",
      updatedAt: "2026-02-09T08:41:00Z",
      favorite: false,
      sortOrder: 1,
    },
    {
      id: "p3",
      name: "Relay Worker",
      description: "Background job processor",
      sourcePath: "C:\\work\\relay-worker",
      createdAt: "2026-01-20T16:30:00Z",
      updatedAt: "2026-02-02T19:12:00Z",
      favorite: false,
      sortOrder: 2,
    },
  ],
  list_env_documents: [
    {
      id: "d1",
      projectId: "p1",
      filename: ".env.production",
      sourceImportedAt: "2026-02-10T10:00:00Z",
      createdAt: "2026-02-10T10:00:00Z",
      updatedAt: "2026-02-11T14:05:00Z",
      byteLength: 812,
      keyCount: 14,
    },
    {
      id: "d2",
      projectId: "p1",
      filename: ".env.local",
      sourceImportedAt: "2026-02-10T10:02:00Z",
      createdAt: "2026-02-10T10:02:00Z",
      updatedAt: "2026-02-10T10:02:00Z",
      byteLength: 431,
      keyCount: 8,
    },
  ],
};

const internals = {
  metadata: { currentWindow: { label: "main" }, currentWebview: { label: "main" } },
  invoke: async (command: string) => mockResponses[command] ?? null,
  transformCallback: () => 1,
};
(window as unknown as { __TAURI_INTERNALS__: unknown }).__TAURI_INTERNALS__ = internals;

import { AppSidebar } from "./components/layout/AppSidebar";
import { WindowControls } from "./components/layout/WindowControls";
import { SettingsPage } from "./features/settings/SettingsPage";
import { DocsPage } from "./features/docs/DocsPage";
import { SupportPage } from "./features/support/SupportPage";
import { AboutPage } from "./features/about/AboutPage";
import { AssistantPage } from "./features/assistant/AssistantPage";
import { IntegrationsPage } from "./features/integrations/IntegrationsPage";
import { Onboarding } from "./features/onboarding/Onboarding";
import { VaultSetup } from "./features/vault/VaultSetup";
import { ProjectList } from "./features/projects/ProjectSidebar";
import { ProjectHeader } from "./features/projects/ProjectHeader";
import { EnvDocumentList } from "./features/env-documents/EnvDocumentList";
import { initializeI18n } from "./i18n";
import { applyTheme } from "./lib/theme";
import { useNavigationStore, SettingsSection, AppView } from "./stores/useNavigationStore";
import { useVaultSessionStore } from "./stores/useVaultSessionStore";
import { useProjectStore } from "./stores/useProjectStore";
import { useEnvStore } from "./stores/useEnvStore";

const params = new URLSearchParams(window.location.search);
const page = params.get("page") ?? "settings";
const section = (params.get("section") ?? "general") as SettingsSection;

const VaultPreview: React.FC = () => {
  const selectedProjectId = useProjectStore((s) => s.selectedProjectId);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const fetchDocuments = useEnvStore((s) => s.fetchDocuments);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (selectedProjectId) void fetchDocuments(selectedProjectId);
  }, [selectedProjectId, fetchDocuments]);

  return (
    <main className="page">
      <aside className="vault-sidebar">
        <ProjectList />
      </aside>
      <div className="vault-main">
        <ProjectHeader />
        <EnvDocumentList />
      </div>
    </main>
  );
};

const Page: React.FC = () => {
  switch (page) {
    case "vault":
      return <VaultPreview />;
    case "onboarding":
      return <Onboarding onComplete={() => {}} />;
    case "setup":
      return <VaultSetup />;
    case "docs":
      return <DocsPage />;
    case "support":
      return <SupportPage />;
    case "about":
      return <AboutPage />;
    case "assistant":
      return <AssistantPage />;
    case "integrations":
      return <IntegrationsPage />;
    default:
      return <SettingsPage />;
  }
};

const Shell: React.FC = () => {
  if (page === "onboarding" || page === "setup") {
    return (
      <div className="app-shell">
        <WindowControls />
        <Page />
      </div>
    );
  }
  return (
    <div className="app-shell">
      <WindowControls />
      <AppSidebar />
      <div className="app-main">
        <div className="app-drag-strip" />
        <Page />
      </div>
    </div>
  );
};

const Preview: React.FC = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    useVaultSessionStore.setState({ state: "unlocked", isLoading: false });
    const view = (page === "settings" ? "settings" : page) as AppView;
    useNavigationStore.setState({ view, settingsSection: section });
    applyTheme("koyu-mavi", "#0A84FF", true);
    document.documentElement.dir = "ltr";
    document.documentElement.lang = "en";
    initializeI18n("en").then(() => setReady(true));
  }, []);

  return ready ? <Shell /> : null;
};

ReactDOM.createRoot(document.getElementById("root")!).render(<Preview />);
