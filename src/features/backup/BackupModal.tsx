import React, { useState } from "react";
import { ShieldCheck, Download, FolderSync } from "lucide-react";
import { Dialog } from "../../components/primitives/Dialog";
import { PasswordInput } from "../../components/primitives/PasswordInput";
import { Button } from "../../components/primitives/Button";
import { useDialogStore } from "../../stores/useDialogStore";
import { backupApi } from "../../lib/tauri/backup-api";
import { useTranslation } from "../../i18n";

export const BackupModal: React.FC = () => {
  const { t, language } = useTranslation();
  const isOpen = useDialogStore((s) => s.isBackupOpen);
  const onClose = useDialogStore((s) => s.closeBackup);
  const openRestore = useDialogStore((s) => s.openRestore);

  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleCreateBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError(language === "tr" ? "Yedek şifrelemesi için bir parola girmelisiniz." : "Enter a password to encrypt your backup file.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const defaultFilename = `EnvVault-${dateStr}.vaultbak`;

      const { save } = await import("@tauri-apps/plugin-dialog");
      const selected = await save({
        defaultPath: defaultFilename,
        filters: [{ name: language === "tr" ? "Env Vault Yedeği (*.vaultbak, *.evault)" : "Env Vault Backup (*.vaultbak, *.evault)", extensions: ["vaultbak", "evault"] }],
      });

      if (!selected) {
        setIsLoading(false);
        return;
      }

      await backupApi.createBackup(selected, password);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setPassword("");
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || t("backup.invalidBackupFile");
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={t("backup.modalTitle")} maxWidth="500px">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--accent-subtle)",
              color: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={20} />
          </div>
          <div>
            <p style={{ fontSize: "13.5px", color: "var(--text-primary)", fontWeight: 500 }}>
              {language === "tr" ? "Tam Şifreli Taşınabilir Yedek" : "Fully Encrypted Portable Backup"}
            </p>
            <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginTop: "2px", lineHeight: 1.4 }}>
              {t("backup.modalSubtitle")}
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateBackup} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <PasswordInput
            label={t("backup.masterPasswordLabel")}
            placeholder={t("backup.masterPasswordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading || success}
            autoFocus
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
              {t("backup.backupSuccess")}
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--space-3)",
              marginTop: "var(--space-2)",
            }}
          >
            <Button
              variant="secondary"
              leftIcon={<FolderSync size={14} />}
              type="button"
              onClick={() => {
                onClose();
                openRestore();
              }}
              style={{ whiteSpace: "nowrap" }}
            >
              {t("backup.restoreTitle")}
            </Button>

            <Button
              variant="primary"
              type="submit"
              isLoading={isLoading}
              leftIcon={<Download size={15} />}
              style={{ whiteSpace: "nowrap" }}
            >
              {t("backup.exportButton")}
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
};
