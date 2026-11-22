import React, { useEffect, useState } from "react";
import {
  Bot,
  Check,
  Copy,
  Database,
  FolderOpen,
  Plug,
  RefreshCw,
  Save,
  SquareTerminal,
  Trash2,
  Webhook,
  Workflow,
} from "lucide-react";
import { useTranslation } from "../../i18n";
import { usePreferencesStore } from "../../stores/usePreferencesStore";
import { useToastStore } from "../../stores/useToastStore";
import { persistSettingsPatch } from "../../lib/settings-sync";
import { devApi, BridgeInfo } from "../../lib/tauri/dev-api";
import { aiApi, AiStatus } from "../../lib/tauri/ai-api";
import { buildIndex } from "../../lib/assistant/rag";
import { Button } from "../../components/primitives/Button";
import { ToggleRow } from "../settings/sections/ToggleRow";

type Section = "mcp" | "cli" | "webhook" | "ai" | "search";

const SECTIONS: { id: Section; labelKey: string; icon: React.ElementType }[] = [
  { id: "mcp", labelKey: "developer.mcpTitle", icon: Workflow },
  { id: "cli", labelKey: "developer.cliTitle", icon: SquareTerminal },
  { id: "webhook", labelKey: "integrations.webhookTitle", icon: Webhook },
  { id: "ai", labelKey: "integrations.aiTitle", icon: Bot },
  { id: "search", labelKey: "integrations.searchTitle", icon: Database },
];

export const IntegrationsPage: React.FC = () => {
  const { t } = useTranslation();
  const pushToast = useToastStore((state) => state.push);
  const devBridgeEnabled = usePreferencesStore((state) => state.devBridgeEnabled);
  const aiEnabled = usePreferencesStore((state) => state.aiEnabled);
  const aiModel = usePreferencesStore((state) => state.aiModel);
  const webhookEnabled = usePreferencesStore((state) => state.webhookEnabled);
  const webhookUrl = usePreferencesStore((state) => state.webhookUrl);
  const webhookToken = usePreferencesStore((state) => state.webhookToken);

  const [section, setSection] = useState<Section>("mcp");
  const [bridge, setBridge] = useState<BridgeInfo | null>(null);
  const [ai, setAi] = useState<AiStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState(webhookUrl);
  const [tokenDraft, setTokenDraft] = useState(webhookToken);
  const [modelDraft, setModelDraft] = useState(aiModel);
  const [downloadDraft, setDownloadDraft] = useState("");
  const [indexCount, setIndexCount] = useState<number | null>(null);

  useEffect(() => {
    devApi.bridgeInfo().then(setBridge).catch(() => setError(t("common.error")));
    aiApi.status().then(setAi).catch(() => setAi(null));
  }, [t]);

  const copy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setError(t("common.error"));
    }
  };

  const toggleBridge = async (enabled: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const next = enabled ? await devApi.startBridge() : await devApi.stopBridge();
      setBridge(next);
      await persistSettingsPatch({ devBridgeEnabled: enabled });
    } catch {
      setError(t("developer.bridgeError"));
    } finally {
      setBusy(false);
    }
  };

  const saveWebhook = async () => {
    setBusy(true);
    setError(null);
    try {
      await persistSettingsPatch({ webhookUrl: urlDraft.trim(), webhookToken: tokenDraft.trim() });
      pushToast(t("integrations.saved"), "success");
    } catch {
      setError(t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  const testWebhook = async () => {
    setBusy(true);
    setError(null);
    try {
      await aiApi.sendWebhook("test", "Env Vault webhook test");
      pushToast(t("integrations.webhookSent"), "success");
    } catch {
      setError(t("integrations.webhookFailed"));
    } finally {
      setBusy(false);
    }
  };

  const saveModel = async () => {
    const value = modelDraft.trim() || "llama3.2";
    try {
      await persistSettingsPatch({ aiModel: value });
      pushToast(t("integrations.saved"), "success");
    } catch {
      setError(t("common.error"));
    }
  };

  const refreshAi = async () => {
    try {
      setAi(await aiApi.status());
    } catch {
      setAi(null);
    }
  };

  const pullModel = async () => {
    if (!downloadDraft.trim()) return;
    setBusy(true);
    setError(null);
    try {
      setAi(await aiApi.pull(downloadDraft.trim()));
      setDownloadDraft("");
      pushToast(t("integrations.modelDownloaded"), "success");
    } catch {
      setError(t("integrations.aiError"));
    } finally {
      setBusy(false);
    }
  };

  const removeModel = async (model: string) => {
    setBusy(true);
    setError(null);
    try {
      setAi(await aiApi.remove(model));
      pushToast(t("integrations.modelRemoved"), "success");
    } catch {
      setError(t("integrations.aiError"));
    } finally {
      setBusy(false);
    }
  };

  const rebuildIndex = async () => {
    setBusy(true);
    try {
      const chunks = await buildIndex();
      setIndexCount(chunks.length);
      pushToast(t("integrations.indexReady", { count: chunks.length }), "success");
    } catch {
      setError(t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  const cliCommand = bridge ? `node "${bridge.cliPath}" projects` : "";
  const mcpConfig = bridge
    ? JSON.stringify(
        {
          mcpServers: {
            "env-vault": { command: "node", args: [bridge.cliPath, "mcp"] },
          },
        },
        null,
        2
      )
    : "";
  const copyButton = (value: string, key: string) => (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      leftIcon={copied === key ? <Check size={14} /> : <Copy size={14} />}
      disabled={!value}
      onClick={() => void copy(value, key)}
    >
      {copied === key ? t("common.copied") : t("common.copy")}
    </Button>
  );

  return (
    <div className="page" data-testid="integrations-page">
      <aside className="settings-sidebar" aria-label={t("nav.integrations")}>
        <div className="docs-nav-title">
          <Plug size={15} aria-hidden />
          {t("nav.integrations")}
        </div>
        {SECTIONS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={`settings-nav-item${section === entry.id ? " is-active" : ""}`}
            onClick={() => setSection(entry.id)}
          >
            <entry.icon size={15} aria-hidden />
            <span>{t(entry.labelKey)}</span>
          </button>
        ))}
      </aside>

      <div className="page-main">
        <div className="page-inner">
          <header className="page-header">
            <div>
              <h1 className="page-title">{t("integrations.title")}</h1>
              <p className="page-subtitle">{t("integrations.subtitle")}</p>
            </div>
          </header>

          {error && <p className="form-error">{error}</p>}

          {section === "mcp" && (
            <section className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">
                    <Workflow size={16} aria-hidden />
                    {t("developer.bridgeTitle")}
                  </div>
                  <p className="card-subtitle">{t("developer.bridgeDesc")}</p>
                </div>
                {bridge?.running && <span className="badge badge-accent">{t("developer.running")}</span>}
              </div>
              <ToggleRow
                label={t("developer.bridgeToggle")}
                description={t("developer.bridgeToggleDesc")}
                checked={devBridgeEnabled}
                disabled={busy}
                onChange={(checked) => void toggleBridge(checked)}
              />
              {bridge?.running && (
                <div className="kv-list">
                  <div className="kv-row">
                    <span className="kv-key">{t("developer.endpoint")}</span>
                    <span className="kv-value mono">{bridge.endpoint}</span>
                  </div>
                  <div className="kv-row">
                    <span className="kv-key">{t("developer.cliPath")}</span>
                    <span className="kv-value mono">{bridge.cliPath}</span>
                  </div>
                </div>
              )}
              <div className="card-footer">
                <div className="code-block">
                  <code>{mcpConfig || t("developer.bridgeOff")}</code>
                  {copyButton(mcpConfig, "mcp")}
                </div>
              </div>
            </section>
          )}

          {section === "cli" && (
            <section className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">
                    <SquareTerminal size={16} aria-hidden />
                    {t("developer.cliTitle")}
                  </div>
                  <p className="card-subtitle">{t("developer.cliDesc")}</p>
                </div>
              </div>
              <div className="code-block">
                <code>{cliCommand || t("developer.bridgeOff")}</code>
                {copyButton(cliCommand, "cli")}
              </div>
              <div className="card-footer inline">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<SquareTerminal size={14} />}
                  onClick={() => {
                    void devApi.openTerminal(bridge?.dataDir ?? null).catch(() => {
                      setError(t("developer.terminalError"));
                    });
                  }}
                >
                  {t("developer.openTerminal")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<FolderOpen size={14} />}
                  onClick={() => {
                    void devApi.openDataFolder().catch(() => {
                      setError(t("developer.terminalError"));
                    });
                  }}
                >
                  {t("developer.openDataFolder")}
                </Button>
              </div>
            </section>
          )}

          {section === "webhook" && (
            <section className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">
                    <Webhook size={16} aria-hidden />
                    {t("integrations.webhookTitle")}
                  </div>
                  <p className="card-subtitle">{t("integrations.webhookDesc")}</p>
                </div>
              </div>
              <ToggleRow
                label={t("integrations.webhookToggle")}
                description={t("integrations.webhookToggleDesc")}
                checked={webhookEnabled}
                onChange={(checked) => void persistSettingsPatch({ webhookEnabled: checked })}
              />
              <div className="form-grid">
                <label className="field-label" htmlFor="webhook-url">
                  {t("integrations.webhookUrl")}
                </label>
                <input
                  id="webhook-url"
                  className="text-input"
                  type="url"
                  value={urlDraft}
                  spellCheck={false}
                  placeholder="https://example.com/hooks/env-vault"
                  onChange={(event) => setUrlDraft(event.target.value)}
                />
                <label className="field-label" htmlFor="webhook-token">
                  {t("integrations.webhookToken")}
                </label>
                <input
                  id="webhook-token"
                  className="text-input"
                  type="password"
                  value={tokenDraft}
                  spellCheck={false}
                  onChange={(event) => setTokenDraft(event.target.value)}
                />
              </div>
              <div className="card-footer inline">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  leftIcon={<Save size={14} />}
                  disabled={busy}
                  onClick={() => void saveWebhook()}
                >
                  {t("common.save")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={busy}
                  onClick={() => void testWebhook()}
                >
                  {t("integrations.webhookTest")}
                </Button>
              </div>
            </section>
          )}

          {section === "ai" && (
            <section className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">
                    <Bot size={16} aria-hidden />
                    {t("integrations.aiTitle")}
                  </div>
                  <p className="card-subtitle">{t("integrations.aiDesc")}</p>
                </div>
                <span className={`badge ${ai?.available ? "badge-success" : "badge-muted"}`}>
                  {ai?.available ? t("integrations.aiOnline") : t("integrations.aiOffline")}
                </span>
              </div>
              <ToggleRow
                label={t("integrations.aiToggle")}
                description={t("integrations.aiToggleDesc")}
                checked={aiEnabled}
                onChange={(checked) => void persistSettingsPatch({ aiEnabled: checked })}
              />
              <div className="form-grid">
                <label className="field-label" htmlFor="ai-model">
                  {t("integrations.aiModel")}
                </label>
                <div className="inline">
                  <input
                    id="ai-model"
                    className="text-input"
                    type="text"
                    value={modelDraft}
                    spellCheck={false}
                    onChange={(event) => setModelDraft(event.target.value)}
                  />
                  <Button type="button" variant="secondary" size="sm" onClick={() => void saveModel()}>
                    {t("common.save")}
                  </Button>
                </div>
              </div>

              <div className="stack-sm">
                <div className="section-title">{t("integrations.aiInstalled")}</div>
                {ai && ai.models.length > 0 ? (
                  <div className="stack-sm">
                    {ai.models.map((model) => (
                      <div className="row" key={model.name}>
                        <span className="mono">{model.name}</span>
                        <div className="inline">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setModelDraft(model.name);
                              void persistSettingsPatch({ aiModel: model.name });
                            }}
                          >
                            {t("integrations.aiUse")}
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            leftIcon={<Trash2 size={14} />}
                            disabled={busy}
                            onClick={() => void removeModel(model.name)}
                          >
                            {t("common.delete")}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted">{t("integrations.aiNone")}</p>
                )}
              </div>

              <div className="form-grid">
                <label className="field-label" htmlFor="ai-download">
                  {t("integrations.aiDownload")}
                </label>
                <div className="inline">
                  <input
                    id="ai-download"
                    className="text-input"
                    type="text"
                    value={downloadDraft}
                    spellCheck={false}
                    placeholder="qwen2.5-coder:7b"
                    onChange={(event) => setDownloadDraft(event.target.value)}
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={busy || !downloadDraft.trim()}
                    onClick={() => void pullModel()}
                  >
                    {t("integrations.aiDownloadButton")}
                  </Button>
                </div>
              </div>
              <div className="card-footer inline">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<RefreshCw size={14} />}
                  onClick={() => void refreshAi()}
                >
                  {t("common.refresh")}
                </Button>
                <span className="muted mono">{ai?.endpoint ?? "http://127.0.0.1:11434"}</span>
              </div>
            </section>
          )}

          {section === "search" && (
            <section className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">
                    <Database size={16} aria-hidden />
                    {t("integrations.searchTitle")}
                  </div>
                  <p className="card-subtitle">{t("integrations.searchDesc")}</p>
                </div>
              </div>
              <p className="muted">{t("integrations.searchPrivacy")}</p>
              <div className="card-footer inline">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<RefreshCw size={14} />}
                  disabled={busy}
                  onClick={() => void rebuildIndex()}
                >
                  {t("integrations.searchRebuild")}
                </Button>
                {indexCount !== null && (
                  <span className="badge badge-muted">
                    {t("integrations.indexReady", { count: indexCount })}
                  </span>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
