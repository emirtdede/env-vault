import React, { useState } from "react";
import { KeyRound } from "lucide-react";
import { Dialog } from "../../components/primitives/Dialog";
import { PasswordInput } from "../../components/primitives/PasswordInput";
import { Button } from "../../components/primitives/Button";
import { useDialogStore } from "../../stores/useDialogStore";
import { useVaultSessionStore } from "../../stores/useVaultSessionStore";
import { useTranslation } from "../../i18n";

export const ChangePasswordModal: React.FC = () => {
  const { t, language } = useTranslation();
  const isOpen = useDialogStore((s) => s.isChangePasswordOpen);
  const onClose = useDialogStore((s) => s.closeChangePassword);
  const changePassword = useVaultSessionStore((s) => s.changePassword);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!currentPassword) {
      setError(language === "tr" ? "Mevcut parolanızı girmelisiniz." : "You must enter your current password.");
      return;
    }

    if (newPassword.length < 8) {
      setError(t("vault.setup.passwordTooShort"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("vault.setup.passwordsMismatch"));
      return;
    }

    try {
      setIsLoading(true);
      await changePassword(currentPassword, newPassword);
      setSuccess(true);
      setTimeout(() => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || t("vault.changePassword.currentPasswordWrong");
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={t("vault.changePassword.title")} maxWidth="420px">
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <PasswordInput
          label={t("vault.changePassword.currentPasswordLabel")}
          placeholder={t("vault.changePassword.currentPasswordPlaceholder")}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          disabled={isLoading || success}
          autoFocus
        />

        <PasswordInput
          label={t("vault.changePassword.newPasswordLabel")}
          placeholder={t("vault.changePassword.newPasswordPlaceholder")}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={isLoading || success}
        />

        <PasswordInput
          label={t("vault.changePassword.confirmNewPasswordLabel")}
          placeholder={t("vault.changePassword.confirmNewPasswordPlaceholder")}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading || success}
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
            {t("vault.changePassword.successMessage")}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
          <Button variant="secondary" onClick={onClose} type="button" disabled={isLoading}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading} leftIcon={<KeyRound size={15} />}>
            {t("vault.changePassword.changeButton")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
