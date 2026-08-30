import React, { useEffect, useRef, useState } from "react";
import {
  Save,
  X,
  Copy,
  Check,
  FileText,
  AlertCircle,
} from "lucide-react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightActiveLine } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { useEditorStore } from "../../stores/useEditorStore";
import { useDialogStore } from "../../stores/useDialogStore";
import { usePreferencesStore } from "../../stores/usePreferencesStore";
import { Button } from "../../components/primitives/Button";
import { IconButton } from "../../components/primitives/IconButton";
import { useTranslation } from "../../i18n";

export const EnvEditor: React.FC = () => {
  const { t, language } = useTranslation();
  const activeDocId = useEditorStore((s) => s.activeDocId);
  const filename = useEditorStore((s) => s.filename);
  const rawContent = useEditorStore((s) => s.rawContent);
  const isDirty = useEditorStore((s) => s.isDirty);
  const isLoading = useEditorStore((s) => s.isLoading);
  const isSaving = useEditorStore((s) => s.isSaving);
  const error = useEditorStore((s) => s.error);
  const setContent = useEditorStore((s) => s.setContent);
  const save = useEditorStore((s) => s.save);
  const closeDocument = useEditorStore((s) => s.closeDocument);

  const showConfirm = useDialogStore((s) => s.showConfirm);
  const clearClipboardSeconds = usePreferencesStore((s) => s.clearClipboardSeconds);

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const [copied, setCopied] = useState(false);

  // Initialize CodeMirror 6 once loading completes
  useEffect(() => {
    if (!editorContainerRef.current || isLoading) return;

    const startState = EditorState.create({
      doc: rawContent,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        highlightSelectionMatches(),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...searchKeymap,
          {
            key: "Mod-s",
            run: () => {
              save().catch(() => {});
              return true;
            },
          },
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            setContent(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          "&": {
            height: "100%",
            fontSize: "13.5px",
            fontFamily: "var(--font-mono)",
            backgroundColor: "var(--editor-bg, var(--surface-strong))",
            color: "var(--text-primary)",
          },
          "&.cm-focused": {
            outline: "none",
          },
          ".cm-scroller": {
            height: "100%",
            fontFamily: "var(--font-mono)",
            lineHeight: "1.6",
          },
          ".cm-content": {
            padding: "16px 0",
            caretColor: "var(--accent)",
          },
          ".cm-gutters": {
            backgroundColor: "var(--surface)",
            color: "var(--editor-line-number, var(--text-tertiary))",
            borderRight: "1px solid var(--border-subtle)",
            paddingRight: "8px",
            userSelect: "none",
          },
          ".cm-activeLine": {
            backgroundColor: "var(--surface-hover)",
          },
          ".cm-activeLineGutter": {
            backgroundColor: "var(--surface-hover)",
            color: "var(--text-primary)",
          },
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: editorContainerRef.current,
    });

    editorViewRef.current = view;

    return () => {
      view.destroy();
      editorViewRef.current = null;
    };
  }, [activeDocId, isLoading]);

  // Synchronize document if content is updated externally while editor is open
  useEffect(() => {
    if (editorViewRef.current && !isLoading) {
      const currentDoc = editorViewRef.current.state.doc.toString();
      if (currentDoc !== rawContent && !isDirty) {
        editorViewRef.current.dispatch({
          changes: { from: 0, to: currentDoc.length, insert: rawContent },
        });
      }
    }
  }, [rawContent, isLoading, isDirty]);

  const handleClose = () => {
    if (isDirty) {
      showConfirm({
        title: t("editor.unsavedChanges"),
        message: t("editor.unsavedWarning"),
        confirmLabel: language === "tr" ? "Değişiklikleri Sil ve Çık" : "Discard & Close",
        cancelLabel: language === "tr" ? "Düzenlemeye Devam Et" : "Keep Editing",
        isDestructive: true,
        onConfirm: () => {
          closeDocument();
        },
      });
    } else {
      closeDocument();
    }
  };

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(rawContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // Auto-clear clipboard after configured seconds
      if (clearClipboardSeconds > 0) {
        setTimeout(async () => {
          try {
            const current = await navigator.clipboard.readText();
            if (current === rawContent) {
              await navigator.clipboard.writeText("");
            }
          } catch {}
        }, clearClipboardSeconds * 1000);
      }
    } catch {}
  };

  const handleCloseRef = useRef(handleClose);
  handleCloseRef.current = handleClose;

  // Global Escape key listener for the editor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleCloseRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!activeDocId) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "38px",
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--app-bg)",
        zIndex: 500,
      }}
      className="animate-fade-in"
    >
      {/* Editor Top Bar */}
      <header
        style={{
          height: "48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 var(--space-6)",
          borderBottom: "1px solid var(--border)",
          backgroundColor: "var(--surface)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <FileText size={18} style={{ color: "var(--accent)" }} />
          <span style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--text-primary)" }}>
            {filename}
          </span>
          {isDirty && (
            <span
              style={{
                fontSize: "12px",
                color: "var(--warning)",
                backgroundColor: "var(--warning-subtle)",
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
                fontWeight: 500,
              }}
            >
              {language === "tr" ? "Kaydedilmedi" : "Unsaved"}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <Button
            variant="subtle"
            size="sm"
            leftIcon={copied ? <Check size={14} /> : <Copy size={14} />}
            onClick={handleCopyAll}
          >
            {copied ? t("common.copied") : t("envDocument.card.copyAll")}
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Save size={14} />}
            isLoading={isSaving}
            disabled={!isDirty}
            onClick={() => save()}
          >
            {t("common.save")}
          </Button>
          <div style={{ width: "1px", height: "20px", backgroundColor: "var(--border)", margin: "0 4px" }} />
          <IconButton icon={<X size={16} />} aria-label={t("common.close")} size="sm" onClick={handleClose} />
        </div>
      </header>

      {error && (
        <div
          style={{
            padding: "var(--space-2) var(--space-6)",
            backgroundColor: "var(--danger-subtle)",
            color: "var(--danger)",
            fontSize: "12.5px",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
          }}
        >
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* CodeMirror Surface or Loading Skeleton */}
      {isLoading ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "14px",
            color: "var(--text-secondary)",
            backgroundColor: "var(--editor-bg, var(--surface-strong))",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              border: "3px solid var(--border)",
              borderTopColor: "var(--accent)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span style={{ fontSize: "13px", fontWeight: 500 }}>
            {language === "tr" ? "Şifreli ortam dosyası çözülüyor..." : "Decrypting environment file..."}
          </span>
        </div>
      ) : (
        <div
          ref={editorContainerRef}
          style={{
            flex: 1,
            overflow: "hidden",
          }}
        />
      )}
    </div>
  );
};
