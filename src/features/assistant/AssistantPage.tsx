import React, { useRef, useState } from "react";
import { Bot, Check, Copy, FolderLock, KeyRound, Send, Sparkles, SquareTerminal } from "lucide-react";
import { useTranslation } from "../../i18n";
import { usePreferencesStore } from "../../stores/usePreferencesStore";
import { useProjectStore } from "../../stores/useProjectStore";
import { useNavigationStore } from "../../stores/useNavigationStore";
import { aiApi } from "../../lib/tauri/ai-api";
import { Button } from "../../components/primitives/Button";
import { answer, AssistantResult } from "../../lib/assistant/engine";

interface Turn {
  id: number;
  role: "user" | "assistant";
  text?: string;
  result?: AssistantResult;
}

const SUGGESTIONS = [
  "assistant.suggestionList",
  "assistant.suggestionEnv",
  "assistant.suggestionFind",
  "assistant.suggestionHelp",
];

export const AssistantPage: React.FC = () => {
  const { t } = useTranslation();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const nextId = useRef(1);
  const aiEnabled = usePreferencesStore((state) => state.aiEnabled);
  const aiModel = usePreferencesStore((state) => state.aiModel);
  const selectProject = useProjectStore((state) => state.selectProject);
  const setView = useNavigationStore((state) => state.setView);

  const ask = async (question: string) => {
    if (!question.trim() || busy) return;
    setBusy(true);
    setTurns((current) => [
      ...current,
      { id: nextId.current++, role: "user", text: question },
    ]);
    setInput("");
    const result = await answer(question, {
      aiEnabled,
      aiModel,
      generate: aiEnabled
        ? (prompt, system) =>
            aiApi.generate(aiModel, prompt, system).then((value) => value.text)
        : undefined,
    });
    setTurns((current) => [
      ...current,
      { id: nextId.current++, role: "assistant", result },
    ]);
    setBusy(false);
  };

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const openProject = (projectId: string) => {
    selectProject(projectId);
    setView("vault");
  };

  const renderResult = (result: AssistantResult) => {
    switch (result.kind) {
      case "project-list":
        return (
          <div className="stack-sm">
            {result.projects.length === 0 && <p className="muted">{t("assistant.noProjects")}</p>}
            {result.projects.map((project) => (
              <button
                key={project.id}
                type="button"
                className="assistant-result-row"
                onClick={() => openProject(project.id)}
              >
                <FolderLock size={15} aria-hidden />
                <span>{project.name}</span>
              </button>
            ))}
          </div>
        );
      case "env-file":
        return (
          <div className="stack-sm">
            <div className="assistant-project">
              <FolderLock size={15} aria-hidden />
              <strong>{result.project.name}</strong>
              <span className="muted">
                {t("assistant.documentCount", { count: result.documents.length })}
              </span>
            </div>
            <div className="assistant-chips">
              {result.documents.map((document) => (
                <span className="badge badge-muted" key={document.id}>
                  {document.filename}
                </span>
              ))}
            </div>
            {result.active ? (
              <div className="stack-sm">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <span className="muted">{result.active.document.filename}</span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    leftIcon={copied ? <Check size={14} /> : <Copy size={14} />}
                    onClick={() => void copy(result.active?.payload.rawText ?? "")}
                  >
                    {copied ? t("common.copied") : t("common.copy")}
                  </Button>
                </div>
                <pre className="assistant-code">{result.active.payload.rawText}</pre>
              </div>
            ) : (
              <p className="muted">{t("assistant.chooseDocument")}</p>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => openProject(result.project.id)}
            >
              {t("assistant.openProject")}
            </Button>
          </div>
        );
      case "content-search":
        return (
          <div className="stack-sm">
            {result.hits.map((hit) => (
              <div className="assistant-hit" key={`${hit.projectName}-${hit.documentName}`}>
                <div className="assistant-hit-title">
                  <KeyRound size={14} aria-hidden />
                  {hit.projectName} / {hit.documentName}
                </div>
                <div className="assistant-chips">
                  {hit.keys.map((key) => (
                    <span className="badge badge-muted" key={key}>
                      {key}
                    </span>
                  ))}
                </div>
                <pre className="assistant-code">{hit.lines.join("\n")}</pre>
              </div>
            ))}
          </div>
        );
      case "search":
        return (
          <div className="stack-sm">
            {result.matches.map((match) => (
              <button
                key={match.id}
                type="button"
                className="assistant-result-row"
                onClick={() => match.projectId && openProject(match.projectId)}
              >
                <Sparkles size={14} aria-hidden />
                <span>
                  {match.projectName}
                  {match.documentName ? ` / ${match.documentName}` : ""}
                </span>
              </button>
            ))}
          </div>
        );
      case "ai":
        return <p className="assistant-text">{result.text}</p>;
      case "error":
        return (
          <p className="form-error">
            {result.code === "ai-failed" ? t("assistant.aiError") : t("assistant.readError")}
          </p>
        );
      default:
        return (
          <div className="stack-sm">
            <p className="assistant-text">{t("assistant.helpIntro")}</p>
            <ul className="assistant-list">
              <li>{t("assistant.helpEnv")}</li>
              <li>{t("assistant.helpFind")}</li>
              <li>{t("assistant.helpList")}</li>
            </ul>
            <p className="muted">{t("assistant.helpPrivacy")}</p>
          </div>
        );
    }
  };

  return (
    <div className="page" data-testid="assistant-page">
      <aside className="settings-sidebar" aria-label={t("nav.assistant")}>
        <div className="docs-nav-title">
          <Bot size={15} aria-hidden />
          {t("nav.assistant")}
        </div>
        {SUGGESTIONS.map((key) => (
          <button
            key={key}
            type="button"
            className="settings-nav-item"
            onClick={() => void ask(t(key))}
          >
            <Sparkles size={14} aria-hidden />
            <span>{t(key)}</span>
          </button>
        ))}
        <div className="sidebar-note">
          <SquareTerminal size={14} aria-hidden />
          <span>
            {aiEnabled ? t("assistant.aiOn", { model: aiModel }) : t("assistant.aiOff")}
          </span>
        </div>
      </aside>

      <div className="page-main">
        <div className="page-inner assistant-inner">
          <header className="page-header">
            <div>
              <h1 className="page-title">{t("assistant.title")}</h1>
              <p className="page-subtitle">{t("assistant.subtitle")}</p>
            </div>
          </header>

          <div className="assistant-thread" aria-live="polite">
            {turns.length === 0 && (
              <div className="center-state assistant-empty">
                <Bot size={28} aria-hidden />
                <p className="muted">{t("assistant.empty")}</p>
              </div>
            )}
            {turns.map((turn) => (
              <div
                key={turn.id}
                className={`assistant-turn${turn.role === "user" ? " is-user" : ""}`}
              >
                {turn.role === "user" ? (
                  <p className="assistant-text">{turn.text}</p>
                ) : (
                  <div className="assistant-answer">{turn.result && renderResult(turn.result)}</div>
                )}
              </div>
            ))}
            {busy && <div className="assistant-turn"><p className="muted">{t("common.loading")}</p></div>}
          </div>

          <form
            className="assistant-composer"
            onSubmit={(event) => {
              event.preventDefault();
              void ask(input);
            }}
          >
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t("assistant.placeholder")}
              aria-label={t("assistant.placeholder")}
              rows={2}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void ask(input);
                }
              }}
            />
            <Button type="submit" variant="primary" size="sm" disabled={busy || !input.trim()}>
              <Send size={14} aria-hidden />
              {t("assistant.send")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
