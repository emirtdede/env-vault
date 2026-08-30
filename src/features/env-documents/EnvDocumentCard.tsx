import React, { useState } from "react";
import {
  FileText,
  Download,
  Pencil,
  Trash2,
  GripVertical,
  MoreVertical,
  Key,
  Copy,
  FolderDown,
} from "lucide-react";
import { EnvDocument } from "../../types";
import { Button } from "../../components/primitives/Button";
import { IconButton } from "../../components/primitives/IconButton";
import { Badge } from "../../components/primitives/Badge";
import { GlassSurface } from "../../components/primitives/GlassSurface";
import { ContextMenu, ContextMenuItem } from "../../components/primitives/ContextMenu";
import { useEditorStore } from "../../stores/useEditorStore";
import { useEnvStore } from "../../stores/useEnvStore";
import { useDialogStore } from "../../stores/useDialogStore";
import { envApi } from "../../lib/tauri/env-api";
import { exportApi } from "../../lib/tauri/export-api";
import { usePreferencesStore } from "../../stores/usePreferencesStore";
import { useTranslation } from "../../i18n";

export interface EnvDocumentCardProps {
  document: EnvDocument;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  selectionMode?: boolean;
}

export const EnvDocumentCard: React.FC<EnvDocumentCardProps> = ({
  document,
  isSelected = false,
  onToggleSelect,
  selectionMode = false,
}) => {
  const { t, language } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const openDocument = useEditorStore((s) => s.openDocument);
  const deleteDocument = useEnvStore((s) => s.deleteDocument);
  const showConfirm = useDialogStore((s) => s.showConfirm);

  const askExportLocation = usePreferencesStore((s) => s.askExportLocation);
  const defaultExportDirectory = usePreferencesStore((s) => s.defaultExportDirectory);
  const exportCollisionPolicy = usePreferencesStore((s) => s.exportCollisionPolicy);
  const clearClipboardSeconds = usePreferencesStore((s) => s.clearClipboardSeconds);

  const handleEdit = () => {
    openDocument(document.id, document.filename);
  };

  const handleCopyAll = async () => {
    try {
      const payload = await envApi.readEnvDocument(document.id);
      await navigator.clipboard.writeText(payload.rawText);

      // Auto-clear clipboard after configured seconds
      if (clearClipboardSeconds > 0) {
        setTimeout(async () => {
          try {
            const current = await navigator.clipboard.readText();
            if (current === payload.rawText) {
              await navigator.clipboard.writeText("");
            }
          } catch {}
        }, clearClipboardSeconds * 1000);
      }
    } catch (err: unknown) {
      console.error("Kopyalama hatası:", err);
    }
  };

  const handleExport = async (forceSaveDialog: boolean = false) => {
    try {
      setIsExporting(true);
      let targetPath: string | undefined = undefined;
      let defaultDir: string | undefined = undefined;

      if (!forceSaveDialog && !askExportLocation && defaultExportDirectory) {
        defaultDir = defaultExportDirectory;
      } else {
        // Trigger Tauri save dialog
        const { save } = await import("@tauri-apps/plugin-dialog");
        const selected = await save({
          defaultPath: document.filename,
          filters: [
            { name: language === "tr" ? "Ortam Dosyaları (.env*)" : "Environment Files (.env*)", extensions: ["*"] },
            { name: language === "tr" ? "Tüm Dosyalar" : "All Files", extensions: ["*"] },
          ],
        });

        if (!selected) {
          setIsExporting(false);
          return;
        }
        targetPath = selected;
      }

      await exportApi.exportEnvDocument(
        document.id,
        targetPath,
        defaultDir,
        exportCollisionPolicy
      );
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = () => {
    showConfirm({
      title: t("envDocument.card.deleteConfirmTitle"),
      message: t("envDocument.card.deleteConfirmDesc", { name: document.filename }),
      confirmLabel: t("common.delete"),
      cancelLabel: t("common.cancel"),
      isDestructive: true,
      onConfirm: async () => {
        await deleteDocument(document.id);
      },
    });
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", document.filename);
    exportApi.startVirtualFileDrag(document.id).catch(() => {});
  };

  const contextMenuItems: ContextMenuItem[] = [
    {
      id: "edit",
      label: t("envDocument.card.editDocument"),
      icon: <Pencil size={14} />,
      onClick: handleEdit,
    },
    {
      id: "copy",
      label: t("envDocument.card.copyAll"),
      icon: <Copy size={14} />,
      onClick: handleCopyAll,
    },
    {
      id: "export",
      label: t("envDocument.card.exportDocument"),
      icon: <Download size={14} />,
      divider: true,
      onClick: () => handleExport(false),
    },
    {
      id: "export-custom",
      label: language === "tr" ? "Farklı Konuma İndir..." : "Export to Custom Location...",
      icon: <FolderDown size={14} />,
      onClick: () => handleExport(true),
    },
    {
      id: "delete",
      label: t("envDocument.card.deleteDocument"),
      icon: <Trash2 size={14} />,
      variant: "danger",
      divider: true,
      onClick: handleDelete,
    },
  ];

  return (
    <>
      <GlassSurface
        intensity="normal"
        blur="sm"
        borderRadius="var(--radius-lg)"
        onClick={() => {
          if (selectionMode && onToggleSelect) {
            onToggleSelect(document.id);
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setContextMenu({ x: e.clientX, y: e.clientY });
        }}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
          padding: "var(--space-4)",
          backgroundColor: isSelected ? "rgba(10, 132, 255, 0.08)" : "var(--surface)",
          border: isSelected ? "1px solid var(--accent)" : "1px solid var(--border)",
          transition: "all var(--duration-fast)",
          cursor: selectionMode ? "pointer" : "default",
        }}
        className="env-card"
      >
        {/* Top row: Filename, Drag handle, and actions */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            {selectionMode ? (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect && onToggleSelect(document.id)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: "16px",
                  height: "16px",
                  accentColor: "var(--accent)",
                  cursor: "pointer",
                  marginRight: "4px",
                }}
              />
            ) : (
              <div
                draggable
                onDragStart={handleDragStart}
                title={language === "tr" ? "Dosyayı dışa aktarmak için Explorer'a sürükleyin" : "Drag to File Explorer to export"}
                style={{
                  cursor: "grab",
                  display: "flex",
                  alignItems: "center",
                  color: "var(--text-tertiary)",
                  padding: "2px",
                }}
              >
                <GripVertical size={16} />
              </div>
            )}
            <FileText size={17} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
              {document.filename}
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
              ({document.byteLength} B)
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <Button variant="subtle" size="sm" leftIcon={<Pencil size={13} />} onClick={handleEdit}>
              {t("common.edit")}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              isLoading={isExporting}
              leftIcon={<Download size={13} />}
              onClick={() => handleExport(false)}
            >
              {language === "tr" ? "İndir" : "Export"}
            </Button>
            <div style={{ position: "relative" }}>
              <IconButton
                icon={<MoreVertical size={15} />}
                aria-label={t("common.actions")}
                size="sm"
                onClick={() => setShowMenu(!showMenu)}
              />
              {showMenu && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "100%",
                    backgroundColor: "var(--surface-strong)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    boxShadow: "var(--shadow-md)",
                    zIndex: 50,
                    minWidth: "160px",
                    padding: "4px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                  className="animate-scale-up"
                  onMouseLeave={() => setShowMenu(false)}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      handleCopyAll();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 10px",
                      fontSize: "12.5px",
                      color: "var(--text-primary)",
                      borderRadius: "var(--radius-sm)",
                      textAlign: "left",
                    }}
                    className="menu-item"
                  >
                    <Copy size={13} />
                    <span>{t("envDocument.card.copyAll")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      handleExport(true);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 10px",
                      fontSize: "12.5px",
                      color: "var(--text-primary)",
                      borderRadius: "var(--radius-sm)",
                      textAlign: "left",
                    }}
                    className="menu-item"
                  >
                    <FolderDown size={13} />
                    <span>{language === "tr" ? "Farklı Konuma İndir" : "Custom Export"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      handleDelete();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 10px",
                      fontSize: "12.5px",
                      color: "var(--danger)",
                      borderRadius: "var(--radius-sm)",
                      textAlign: "left",
                    }}
                    className="menu-item"
                  >
                    <Trash2 size={13} />
                    <span>{t("common.delete")}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Discovered Keys Badges Preview */}
        {document.keys && document.keys.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
            <Key size={12} style={{ color: "var(--text-tertiary)", marginRight: "2px" }} />
            {document.keys.slice(0, 6).map((key) => (
              <Badge key={key} variant="subtle" size="sm">
                {key}
              </Badge>
            ))}
            {document.keys.length > 6 && (
              <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                +{document.keys.length - 6} {t("common.keys")}
              </span>
            )}
          </div>
        ) : (
          <div style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
            {t("envDocument.card.noKeysFound")}
          </div>
        )}
      </GlassSurface>

      {/* Context Menu for right-click */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          title={document.filename}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
};
