import React, { useState } from "react";
import { FolderOpen, FilePlus2, FileCode, FolderSearch, CheckCircle2, AlertTriangle, Layers, FileText } from "lucide-react";
import { Dialog } from "../../components/primitives/Dialog";
import { Button } from "../../components/primitives/Button";
import { Input } from "../../components/primitives/Input";
import { useDialogStore } from "../../stores/useDialogStore";
import { useProjectStore } from "../../stores/useProjectStore";
import { useEnvStore } from "../../stores/useEnvStore";
import { importApi } from "../../lib/tauri/import-api";
import { BatchImportReport, CollisionPolicy } from "../../types";
import { useTranslation } from "../../i18n";

export const AddEnvModal: React.FC = () => {
  const { t, language } = useTranslation();
  const isOpen = useDialogStore((s) => s.isAddEnvOpen);
  const onClose = useDialogStore((s) => s.closeAddEnv);
  const selectedProjectId = useProjectStore((s) => s.selectedProjectId);
  const fetchDocuments = useEnvStore((s) => s.fetchDocuments);
  const createDocument = useEnvStore((s) => s.createDocument);

  const [tab, setTab] = useState<"file" | "folder" | "raw-batch" | "manual">("file");
  const [filename, setFilename] = useState(".env");
  const [initialContent, setInitialContent] = useState(
    language === "tr" ? "# Ortam Değişkenleri\nPORT=3000\n" : "# Environment Variables\nPORT=3000\n"
  );
  const [rawBatchText, setRawBatchText] = useState(
    `# === .env ===\nPORT=3000\nDB_HOST=localhost\n\n# === .env.development ===\nPORT=3001\nNODE_ENV=development\n\n# === .env.production ===\nPORT=8080\nNODE_ENV=production\n`
  );
  const [collisionPolicy, setCollisionPolicy] = useState<CollisionPolicy>("rename");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchReport, setBatchReport] = useState<BatchImportReport | null>(null);

  const parseRawBatchEntries = (text: string): { filename: string; content: string }[] => {
    const lines = text.split(/\r?\n/);
    const entries: { filename: string; content: string[] }[] = [];
    let currentEntry: { filename: string; content: string[] } | null = null;

    const headerRegex = /^(?:#|\/\/|---|\/\*|\[)\s*===\s*([a-zA-Z0-9_.\-]+(?:\.env|\.env\.[a-zA-Z0-9_.\-]+|\.env))\s*===/i;
    const fallbackHeaderRegex = /^(?:#|\/\/|---)\s*(?:\[|Dosya:\s*|File:\s*)?([a-zA-Z0-9_.\-]*\.env[a-zA-Z0-9_.\-]*)/i;

    for (const line of lines) {
      const match = line.match(headerRegex) || line.match(fallbackHeaderRegex);
      if (match && match[1]) {
        if (currentEntry) {
          entries.push(currentEntry);
        }
        currentEntry = { filename: match[1].trim(), content: [] };
      } else if (currentEntry) {
        currentEntry.content.push(line);
      } else {
        currentEntry = { filename: ".env", content: [line] };
      }
    }

    if (currentEntry) {
      entries.push(currentEntry);
    }

    return entries
      .map((e) => ({
        filename: e.filename,
        content: e.content.join("\n").trim() + "\n",
      }))
      .filter((e) => e.filename.length > 0);
  };

  const detectedEntries = parseRawBatchEntries(rawBatchText);

  const handlePickFiles = async () => {
    if (!selectedProjectId) return;

    try {
      setIsLoading(true);
      setError(null);
      setBatchReport(null);

      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        multiple: true,
        filters: [
          { name: language === "tr" ? "Ortam Dosyaları (.env*)" : "Environment Files (.env*)", extensions: ["*"] },
          { name: language === "tr" ? "Tüm Dosyalar" : "All Files", extensions: ["*"] },
        ],
      });

      if (!selected) {
        setIsLoading(false);
        return;
      }

      const paths = Array.isArray(selected) ? selected : [selected];
      if (paths.length === 0) {
        setIsLoading(false);
        return;
      }

      if (paths.length === 1 && paths[0]) {
        await importApi.importEnvFile(selectedProjectId, paths[0], collisionPolicy);
        await fetchDocuments(selectedProjectId);
        onClose();
      } else {
        const validPaths = paths.filter((p): p is string => typeof p === "string");
        const report = await importApi.importEnvFiles(selectedProjectId, validPaths, collisionPolicy);
        setBatchReport(report);
        await fetchDocuments(selectedProjectId);
        if (report.failedCount === 0 && report.skippedCount === 0) {
          setTimeout(() => {
            onClose();
            setBatchReport(null);
          }, 1500);
        }
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || t("errors.importFailed");
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickFolder = async () => {
    if (!selectedProjectId) return;

    try {
      setIsLoading(true);
      setError(null);
      setBatchReport(null);

      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        directory: true,
        multiple: false,
        title: language === "tr" ? "İçinde .env Dosyaları Olan Klasörü Seçin" : "Select Folder Containing .env Files",
      });

      if (!selected || typeof selected !== "string") {
        setIsLoading(false);
        return;
      }

      const report = await importApi.importDirectoryEnvFiles(selectedProjectId, selected, true, collisionPolicy);
      setBatchReport(report);
      await fetchDocuments(selectedProjectId);

      if (report.importedCount > 0 && report.failedCount === 0) {
        setTimeout(() => {
          onClose();
          setBatchReport(null);
        }, 1800);
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || t("errors.importFailed");
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportRawBatch = async () => {
    if (!selectedProjectId || detectedEntries.length === 0) return;

    try {
      setIsLoading(true);
      setError(null);
      setBatchReport(null);

      const report = await importApi.importBatchRawDocuments(selectedProjectId, detectedEntries, collisionPolicy);
      setBatchReport(report);
      await fetchDocuments(selectedProjectId);

      if (report.importedCount > 0 && report.failedCount === 0) {
        setTimeout(() => {
          onClose();
          setBatchReport(null);
        }, 1800);
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || t("errors.importFailed");
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;

    try {
      setIsLoading(true);
      setError(null);
      await createDocument(selectedProjectId, filename, initialContent);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || t("errors.generic");
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setBatchReport(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title={t("addEnvModal.titleSingle")} maxWidth="580px">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {/* Tab Selector */}
        <div
          style={{
            display: "flex",
            backgroundColor: "var(--surface-subtle)",
            padding: "3px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            gap: "2px",
          }}
        >
          <button
            type="button"
            onClick={() => { setTab("file"); setBatchReport(null); setError(null); }}
            style={{
              flex: 1,
              padding: "6px 8px",
              fontSize: "11.5px",
              fontWeight: 500,
              borderRadius: "var(--radius-sm)",
              backgroundColor: tab === "file" ? "var(--surface-strong)" : "transparent",
              color: tab === "file" ? "var(--text-primary)" : "var(--text-secondary)",
              boxShadow: tab === "file" ? "var(--shadow-sm)" : "none",
              transition: "all var(--duration-fast)",
            }}
          >
            {language === "tr" ? "Dosya Seç (Tek/Toplu)" : "Select Files (Single/Batch)"}
          </button>
          <button
            type="button"
            onClick={() => { setTab("folder"); setBatchReport(null); setError(null); }}
            style={{
              flex: 1,
              padding: "6px 8px",
              fontSize: "11.5px",
              fontWeight: 500,
              borderRadius: "var(--radius-sm)",
              backgroundColor: tab === "folder" ? "var(--surface-strong)" : "transparent",
              color: tab === "folder" ? "var(--text-primary)" : "var(--text-secondary)",
              boxShadow: tab === "folder" ? "var(--shadow-sm)" : "none",
              transition: "all var(--duration-fast)",
            }}
          >
            {language === "tr" ? "Klasör Tara (Otomatik)" : "Scan Folder (Auto)"}
          </button>
          <button
            type="button"
            onClick={() => { setTab("raw-batch"); setBatchReport(null); setError(null); }}
            style={{
              flex: 1,
              padding: "6px 8px",
              fontSize: "11.5px",
              fontWeight: 500,
              borderRadius: "var(--radius-sm)",
              backgroundColor: tab === "raw-batch" ? "var(--surface-strong)" : "transparent",
              color: tab === "raw-batch" ? "var(--text-primary)" : "var(--text-secondary)",
              boxShadow: tab === "raw-batch" ? "var(--shadow-sm)" : "none",
              transition: "all var(--duration-fast)",
            }}
          >
            {language === "tr" ? "Toplu Metin / Bloklar" : "Batch Text / Blocks"}
          </button>
          <button
            type="button"
            onClick={() => { setTab("manual"); setBatchReport(null); setError(null); }}
            style={{
              flex: 1,
              padding: "6px 8px",
              fontSize: "11.5px",
              fontWeight: 500,
              borderRadius: "var(--radius-sm)",
              backgroundColor: tab === "manual" ? "var(--surface-strong)" : "transparent",
              color: tab === "manual" ? "var(--text-primary)" : "var(--text-secondary)",
              boxShadow: tab === "manual" ? "var(--shadow-sm)" : "none",
              transition: "all var(--duration-fast)",
            }}
          >
            {language === "tr" ? "Sıfırdan Oluştur" : "Create from Scratch"}
          </button>
        </div>

        {/* Collision Policy Option for Batch Operations */}
        {tab !== "manual" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 12px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--surface-subtle)",
              border: "1px solid var(--border-subtle)",
              fontSize: "12px",
            }}
          >
            <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
              {language === "tr" ? "Aynı İsimli Dosya Varsa:" : "If File Already Exists:"}
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-primary)", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="collision"
                  checked={collisionPolicy === "rename"}
                  onChange={() => setCollisionPolicy("rename")}
                />
                {language === "tr" ? "Yeniden Adlandır (.1)" : "Auto-Rename (.1)"}
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-primary)", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="collision"
                  checked={collisionPolicy === "overwrite"}
                  onChange={() => setCollisionPolicy("overwrite")}
                />
                {t("addEnvModal.policyOverwrite")}
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-primary)", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="collision"
                  checked={collisionPolicy === "cancel"}
                  onChange={() => setCollisionPolicy("cancel")}
                />
                {t("addEnvModal.policyCancel")}
              </label>
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "var(--space-3)",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--danger-subtle)",
              color: "var(--danger)",
              fontSize: "12.5px",
            }}
          >
            {error}
          </div>
        )}

        {batchReport && (
          <div
            style={{
              padding: "var(--space-3) var(--space-4)",
              borderRadius: "var(--radius-md)",
              backgroundColor: batchReport.failedCount === 0 ? "rgba(48, 209, 88, 0.12)" : "rgba(255, 159, 10, 0.12)",
              border: `1px solid ${batchReport.failedCount === 0 ? "rgba(48, 209, 88, 0.3)" : "rgba(255, 159, 10, 0.3)"}`,
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              {batchReport.failedCount === 0 ? (
                <CheckCircle2 size={16} style={{ color: "var(--success)" }} />
              ) : (
                <AlertTriangle size={16} style={{ color: "var(--warning)" }} />
              )}
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                {t("addEnvModal.importSuccessBatch", { count: batchReport.importedCount })}
              </span>
            </div>
            {batchReport.errors.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "var(--text-secondary)" }}>
                {batchReport.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === "file" ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "var(--space-8) var(--space-4)",
              border: "1px dashed var(--border)",
              borderRadius: "var(--radius-lg)",
              gap: "var(--space-3)",
              textAlign: "center",
            }}
          >
            <FolderOpen size={32} style={{ color: "var(--accent)" }} />
            <div>
              <p style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text-primary)" }}>
                {language === "tr" ? "Bir veya birden fazla .env dosyası seçin" : "Select one or multiple .env files"}
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                {language === "tr" ? "Ctrl veya Shift ile çoklu seçim yapabilirsiniz. Dosyalar şifrelenerek kasaya depolanır." : "Use Ctrl or Shift for multi-selection. Files are encrypted and stored in the vault."}
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              leftIcon={<FilePlus2 size={16} />}
              onClick={handlePickFiles}
              isLoading={isLoading}
              style={{ marginTop: "var(--space-2)" }}
            >
              {language === "tr" ? "Dosyaları Seç ve İçe Aktar" : "Select Files & Import"}
            </Button>
          </div>
        ) : tab === "folder" ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "var(--space-8) var(--space-4)",
              border: "1px dashed var(--border)",
              borderRadius: "var(--radius-lg)",
              gap: "var(--space-3)",
              textAlign: "center",
            }}
          >
            <FolderSearch size={32} style={{ color: "var(--accent)" }} />
            <div>
              <p style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text-primary)" }}>
                {language === "tr" ? "Proje klasörünü seçin" : "Select project folder"}
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                {language === "tr" ? "Klasördeki tüm alt .env dosyaları taranacak ve otomatik olarak bu projeye eklenecektir." : "All nested .env files in the directory will be discovered and imported."}
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              leftIcon={<FolderSearch size={16} />}
              onClick={handlePickFolder}
              isLoading={isLoading}
              style={{ marginTop: "var(--space-2)" }}
            >
              {language === "tr" ? "Klasör Seç ve Otomatik Tara" : "Select Folder & Auto-Scan"}
            </Button>
          </div>
        ) : tab === "raw-batch" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-primary)" }}>
                {language === "tr" ? "Birden Fazla Dosya Bloğu Yapıştırın:" : "Paste Multiple File Blocks:"}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: detectedEntries.length > 0 ? "rgba(10, 132, 255, 0.15)" : "var(--surface-subtle)",
                  color: detectedEntries.length > 0 ? "var(--accent)" : "var(--text-tertiary)",
                  fontWeight: 600,
                }}
              >
                {detectedEntries.length} {language === "tr" ? "dosya algılandı" : "files detected"}
              </span>
            </div>

            <textarea
              value={rawBatchText}
              onChange={(e) => setRawBatchText(e.target.value)}
              placeholder={`# === .env ===\nPORT=3000\n\n# === .env.production ===\nPORT=8080`}
              style={{
                width: "100%",
                height: "160px",
                padding: "var(--space-3)",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--text-primary)",
                backgroundColor: "var(--input-bg, var(--surface))",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                outline: "none",
                resize: "vertical",
              }}
            />

            {detectedEntries.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {detectedEntries.map((e, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "11px",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      backgroundColor: "var(--surface-active)",
                      color: "var(--text-primary)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    <FileText size={11} style={{ opacity: 0.7 }} />
                    {e.filename}
                  </span>
                ))}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", marginTop: "4px" }}>
              <Button variant="secondary" onClick={handleClose} type="button">
                {t("common.cancel")}
              </Button>
              <Button
                variant="primary"
                onClick={handleImportRawBatch}
                isLoading={isLoading}
                disabled={detectedEntries.length === 0}
                leftIcon={<Layers size={16} />}
              >
                {language === "tr" ? `${detectedEntries.length} Dosyayı Toplu İçe Aktar` : `Import ${detectedEntries.length} Files`}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateManual} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <Input
              label={t("addEnvModal.filenameLabel")}
              placeholder=".env veya .env.production"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              disabled={isLoading}
              autoFocus
            />

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
              <label style={{ fontSize: "12.5px", fontWeight: 500, color: "var(--text-secondary)" }}>
                {language === "tr" ? "Başlangıç İçeriği" : "Initial Content"}
              </label>
              <textarea
                value={initialContent}
                onChange={(e) => setInitialContent(e.target.value)}
                style={{
                  width: "100%",
                  height: "120px",
                  padding: "var(--space-3)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12.5px",
                  color: "var(--text-primary)",
                  backgroundColor: "var(--input-bg, var(--surface))",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)" }}>
              <Button variant="secondary" onClick={handleClose} type="button">
                {t("common.cancel")}
              </Button>
              <Button variant="primary" type="submit" isLoading={isLoading} leftIcon={<FileCode size={16} />}>
                {language === "tr" ? "Ortam Dosyası Oluştur" : "Create Environment File"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Dialog>
  );
};
