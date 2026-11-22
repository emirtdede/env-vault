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
};

const internals = {
  metadata: { currentWindow: { label: "main" }, currentWebview: { label: "main" } },
  invoke: async (command: string) => mockResponses[command] ?? null,
  transformCallback: () => 1,
};
(window as unknown as { __TAURI_INTERNALS__: unknown }).__TAURI_INTERNALS__ = internals;

import { TitleBar } from "./components/layout/TitleBar";
import { NavRail } from "./components/layout/NavRail";
import { SettingsPage } from "./features/settings/SettingsPage";
import { DocsPage } from "./features/docs/DocsPage";
import { SupportPage } from "./features/support/SupportPage";
import { AboutPage } from "./features/about/AboutPage";
import { Onboarding } from "./features/onboarding/Onboarding";
import { VaultSetup } from "./features/vault/VaultSetup";
import { initializeI18n } from "./i18n";
import { applyTheme } from "./lib/theme";
import { useNavigationStore, SettingsSection } from "./stores/useNavigationStore";
import { useVaultSessionStore } from "./stores/useVaultSessionStore";

const params = new URLSearchParams(window.location.search);
const page = params.get("page") ?? "settings";
const section = (params.get("section") ?? "general") as SettingsSection;

const Page: React.FC = () => {
  switch (page) {
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
    default:
      return <SettingsPage />;
  }
};

const Shell: React.FC = () => {
  if (page === "onboarding" || page === "setup") return <Page />;
  return (
    <div className="app-shell">
      <TitleBar />
      <div className="app-body">
        <NavRail />
        <Page />
      </div>
    </div>
  );
};

const Preview: React.FC = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    useVaultSessionStore.setState({ state: "unlocked", isLoading: false });
    useNavigationStore.setState({ view: "settings", settingsSection: section });
    applyTheme("koyu-mavi", "#0A84FF", true);
    document.documentElement.dir = "ltr";
    document.documentElement.lang = "en";
    initializeI18n("en").then(() => setReady(true));
  }, []);

  return ready ? <Shell /> : null;
};

ReactDOM.createRoot(document.getElementById("root")!).render(<Preview />);
