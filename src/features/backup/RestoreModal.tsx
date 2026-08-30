import React, { useState } from "react";
import { ArchiveRestore, FolderOpen, ShieldCheck } from "lucide-react";
import { Dialog } from "../../components/primitives/Dialog";
import { PasswordInput } from "../../components/primitives/PasswordInput";
import { Button } from "../../components/primitives/Button";
import { useDialogStore } from "../../stores/useDialogStore";
import { useProjectStore } from "../../stores/useProjectStore";
import { backupApi } from "../../lib/tauri/backup-api";
import { BackupPreview } from "../../types";
import { useTranslation } from "../../i18n";

export const RestoreModal: React.FC = () => {
  const { t, language } = useTranslation();
  const isOpen = useDialogStore((s) => s.isRestoreOpen);
  const onClose = useDialogStore((s) => s.closeRestore);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);

  const [filePath, setFilePath] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSelectFile = async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        multiple: false,
        filters: [{ name: language === "tr" ? "Env Vault Yedeği (*.evault)" : "Env Vault Backup (*.evault)", extensions: ["evault"] }],
      });

      if (selected && typeof selected === "string") {
        setFilePath(selected);
        setPreview(null);
        setError(null);
      }
    } catch {}
  };

  const handleInspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filePath || !password) {
      setError(language === "tr" ? "Lütfen bir yedek dosyası seçin ve şifreleme parolasını girin." : "Please select a backup file and enter the password.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await backupApi.inspectBackup(filePath, password);
      setPreview(res);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || t("backup.invalidBackupFile");
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteRestore = async () => {
    if (!filePath || !password) return;

    try {
      setIsLoading(true);
      setError(null);
      await backupApi.restoreBackup(filePath, password, mode);
      await fetchProjects();
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFilePath(null);
        setPassword("");
        setPreview(null);
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || t("errors.generic");
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={t("backup.restoreTitle")} maxWidth="480px">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
        {!preview ? (
          <form onSubmit={handleInspect} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <label style={{ fontSize: "12.5px", fontWeight: 500, color: "var(--text-secondary)" }}>
                {t("backup.selectBackupFile")}
              </label>
              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                <input
                  type="text"
                  readOnly
                  placeholder={language === "tr" ? "Yedek dosyası seçilmedi" : "No backup file selected"}
                  value={filePath || ""}
                  style={{
                    flex: 1,
                    height: "36px",
                    padding: "0 10px",
                    fontSize: "12.5px",
                    color: filePath ? "var(--text-primary)" : "var(--text-tertiary)",
                    backgroundColor: "var(--surface-subtle)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    outline: "none",
                  }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<FolderOpen size={14} />}
                  type="button"
                  onClick={handleSelectFile}
                >
                  {t("common.browse")}
                </Button>
              </div>
            </div>

            <PasswordInput
              label={t("backup.masterPasswordLabel")}
              placeholder={t("backup.masterPasswordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />

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

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
              <Button variant="secondary" onClick={onClose} type="button">
                {t("common.cancel")}
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={isLoading}
                disabled={!filePath || !password}
                leftIcon={<ArchiveRestore size={15} />}
              >
                {language === "tr" ? "Yedek İçeriğini İncele" : "Inspect Backup Contents"}
              </Button>
            </div>
          </form>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                padding: "var(--space-3) var(--space-4)",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--surface-subtle)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <ShieldCheck size={20} style={{ color: "var(--success)" }} />
              <div>
                <span style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {preview.projectCount} {t("common.projects")} &bull; {preview.envDocumentCount} {t("common.files")}
                </span>
                <p style={{ fontSize: "11.5px", color: "var(--text-tertiary)" }}>
                  {t("backup.backupDate")}: {new Date(preview.createdAt).toLocaleString(language === "tr" ? "tr-TR" : "en-US")}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>
                {language === "tr" ? "Geri Yükleme Stratejisi" : "Restore Strategy"}
              </span>

              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "var(--space-2)",
                  padding: "var(--space-3)",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${mode === "merge" ? "var(--accent)" : "var(--border)"}`,
                  backgroundColor: mode === "merge" ? "var(--accent-subtle)" : "transparent",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="restore-mode"
                  checked={mode === "merge"}
                  onChange={() => setMode("merge")}
                  style={{ marginTop: "3px" }}
                />
                <div>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {language === "tr" ? "Mevcut Verilerle Birleştir (Tavsiye Edilen)" : "Merge with Current Data (Recommended)"}
                  </span>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    {language === "tr" ? "Mevcut projelerinize dokunulmaz, yedekteki projeler listeye eklenir." : "Existing projects remain intact; backup projects are added."}
                  </p>
                </div>
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "var(--space-2)",
                  padding: "var(--space-3)",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${mode === "replace" ? "var(--danger)" : "var(--border)"}`,
                  backgroundColor: mode === "replace" ? "var(--danger-subtle)" : "transparent",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="restore-mode"
                  checked={mode === "replace"}
                  onChange={() => setMode("replace")}
                  style={{ marginTop: "3px" }}
                />
                <div>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--danger)" }}>
                    {language === "tr" ? "Tüm Vault'un Üzerine Yaz (Tam Değiştirme)" : "Overwrite Entire Vault (Full Replacement)"}
                  </span>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    {language === "tr" ? "Mevcut tüm projeleriniz silinir ve tamamen yedek dosyasındaki veriler yüklenir." : "All existing projects are removed and replaced by backup data."}
                  </p>
                </div>
              </label>
            </div>

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

            {success && (
              <div
                style={{
                  padding: "var(--space-3)",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--success-subtle)",
                  color: "var(--success)",
                  fontSize: "12.5px",
                }}
              >
                {t("backup.restoreSuccess")}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
              <Button variant="secondary" onClick={() => setPreview(null)} disabled={isLoading}>
                {t("common.back")}
              </Button>
              <Button
                variant={mode === "replace" ? "danger" : "primary"}
                onClick={handleExecuteRestore}
                isLoading={isLoading}
              >
                {t("backup.restoreButton")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};
