import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  FileText,
  CheckSquare,
  Square,
  FolderDown,
  Trash2,
  X,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { useEnvStore } from "../../stores/useEnvStore";
import { useProjectStore } from "../../stores/useProjectStore";
import { useDialogStore } from "../../stores/useDialogStore";
import { EnvDocumentCard } from "./EnvDocumentCard";
import { EmptyState } from "../../components/primitives/EmptyState";
import { SearchField } from "../../components/primitives/SearchField";
import { Button } from "../../components/primitives/Button";
import { exportApi } from "../../lib/tauri/export-api";
import { useTranslation } from "../../i18n";

export const EnvDocumentList: React.FC = () => {
  const { t, language } = useTranslation();
  const selectedProjectId = useProjectStore((s) => s.selectedProjectId);
  const documents = useEnvStore((s) => s.documents);
  const fetchDocuments = useEnvStore((s) => s.fetchDocuments);
  const deleteDocumentsBatch = useEnvStore((s) => s.deleteDocumentsBatch);
  const searchQuery = useEnvStore((s) => s.searchQuery);
  const setSearchQuery = useEnvStore((s) => s.setSearchQuery);

  const openAddEnv = useDialogStore((s) => s.openAddEnv);
  const showConfirm = useDialogStore((s) => s.showConfirm);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = null;
      }
    };
  }, []);

  const triggerFeedback = useCallback((msg: string) => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    setFeedback(msg);
    feedbackTimerRef.current = setTimeout(() => {
      setFeedback(null);
      feedbackTimerRef.current = null;
    }, 3000);
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchDocuments(selectedProjectId);
      setSelectedIds(new Set());
      setSelectionMode(false);
    }
  }, [selectedProjectId, fetchDocuments]);

  const filteredDocs = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return q ? documents.filter((d) => d.filename.toLowerCase().includes(q)) : documents;
  }, [documents, searchQuery]);

  if (!selectedProjectId) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <EmptyState
          icon={<FileText size={24} />}
          title={language === "tr" ? "Bir Proje Seçin" : "Select a Project"}
          description={language === "tr" ? "Sol menüden bir proje seçerek ortam dosyalarını görüntüleyebilir veya yeni dosya ekleyebilirsiniz." : "Select a project from the sidebar to view environment files or add a new one."}
        />
      </div>
    );
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredDocs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDocs.map((d) => d.id)));
    }
  };

  const handleBatchExport = async () => {
    if (selectedIds.size === 0) return;

    try {
      setIsExporting(true);
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        directory: true,
        multiple: false,
        title: language === "tr" ? "Seçilen Ortam Dosyalarının Kaydedileceği Klasörü Seçin" : "Select Folder to Export Selected Environment Files",
      });

      if (!selected || typeof selected !== "string") {
        setIsExporting(false);
        return;
      }

      const report = await exportApi.exportMultipleEnvDocuments(
        Array.from(selectedIds),
        selected,
        "overwrite"
      );

      triggerFeedback(language === "tr" ? `${report.exportedCount} ortam dosyası dışa aktarıldı` : `${report.exportedCount} environment files exported`);
      setSelectionMode(false);
      setSelectedIds(new Set());
    } catch {
      triggerFeedback(language === "tr" ? "Dışa aktarma sırasında hata oluştu" : "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;

    const idsToDelete = Array.from(selectedIds);
    showConfirm({
      title: language === "tr" ? `${idsToDelete.length} Ortam Dosyası Silinsin mi?` : `Delete ${idsToDelete.length} Environment Files?`,
      message: language === "tr"
        ? `Seçilen ${idsToDelete.length} adet ortam dosyası şifreli kasadan silinecektir. Bu işlem geri alınamaz.`
        : `Selected ${idsToDelete.length} environment files will be permanently deleted from the vault. This action cannot be undone.`,
      confirmLabel: language === "tr" ? "Seçilenleri Sil" : "Delete Selected",
      cancelLabel: t("common.cancel"),
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteDocumentsBatch(idsToDelete);
          triggerFeedback(language === "tr" ? `${idsToDelete.length} dosya kasadan silindi` : `${idsToDelete.length} files deleted from vault`);
        } catch {
          triggerFeedback(language === "tr" ? "Dosyalar silinirken hata oluştu" : "Failed to delete files");
        }
        setSelectedIds(new Set());
        setSelectionMode(false);
      },
    });
  };



  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Search and filters bar */}
      {documents.length > 0 && (
        <div
          style={{
            padding: "var(--space-3) var(--space-6)",
            borderBottom: "1px solid var(--separator)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: selectionMode ? "var(--surface-subtle)" : "transparent",
            transition: "all var(--duration-fast)",
          }}
        >
          {selectionMode ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <Button
                  variant="subtle"
                  size="sm"
                  leftIcon={selectedIds.size === filteredDocs.length ? <CheckSquare size={14} /> : <Square size={14} />}
                  onClick={handleSelectAll}
                >
                  {selectedIds.size === filteredDocs.length ? (language === "tr" ? "Tüm Seçimi Kaldır" : "Deselect All") : t("common.selectAll")}
                </Button>
                <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--accent)" }}>
                  {selectedIds.size} / {filteredDocs.length} {language === "tr" ? "seçildi" : "selected"}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<FolderDown size={14} />}
                  disabled={selectedIds.size === 0}
                  isLoading={isExporting}
                  onClick={handleBatchExport}
                >
                  {t("envDocument.list.exportSelected")} ({selectedIds.size})
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<Trash2 size={14} />}
                  disabled={selectedIds.size === 0}
                  onClick={handleBatchDelete}
                >
                  {t("envDocument.list.deleteSelected")} ({selectedIds.size})
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<X size={14} />}
                  onClick={() => {
                    setSelectionMode(false);
                    setSelectedIds(new Set());
                  }}
                >
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <div style={{ width: "240px" }}>
                  <SearchField
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder={t("envDocument.list.searchPlaceholder")}
                    ariaLabel={t("envDocument.list.searchPlaceholder")}
                  />
                </div>
                {documents.length > 1 && (
                  <Button
                    variant="subtle"
                    size="sm"
                    leftIcon={<Layers size={13} />}
                    onClick={() => setSelectionMode(true)}
                    title={language === "tr" ? "Birden fazla dosyayı seçip toplu dışa aktarın veya silin" : "Select multiple files for batch export or delete"}
                  >
                    {language === "tr" ? "Toplu Seçim" : "Batch Select"}
                  </Button>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                {feedback && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "3px 8px",
                      borderRadius: "var(--radius-full)",
                      backgroundColor: "rgba(48, 209, 88, 0.15)",
                      color: "var(--success)",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                    className="animate-fade-in"
                  >
                    <CheckCircle2 size={13} />
                    <span>{feedback}</span>
                  </div>
                )}
                <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                  {filteredDocs.length} {t("common.files")}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Documents List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "var(--space-6)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
        }}
      >
        {filteredDocs.length === 0 ? (
          <EmptyState
            icon={<FileText size={24} />}
            title={searchQuery ? t("envDocument.list.emptyFilter") : t("project.noEnvFiles")}
            description={
              searchQuery
                ? (language === "tr" ? "Arama kriterinize uygun bir .env dosyası bulunamadı." : "No .env files matched your search criteria.")
                : t("project.noEnvFilesDesc")
            }
            actionLabel={!searchQuery ? t("project.addEnvFile") : undefined}
            onAction={!searchQuery ? openAddEnv : undefined}
          />
        ) : (
          filteredDocs.map((doc) => (
            <EnvDocumentCard
              key={doc.id}
              document={doc}
              selectionMode={selectionMode}
              isSelected={selectedIds.has(doc.id)}
              onToggleSelect={toggleSelect}
            />
          ))
        )}
      </div>
    </div>
  );
};
