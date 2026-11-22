import React, { useState } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { PasswordInput } from "../../components/primitives/PasswordInput";
import { Button } from "../../components/primitives/Button";
import { useVaultSessionStore } from "../../stores/useVaultSessionStore";
import { Logo } from "../../components/brand/Logo";
import { useTranslation } from "../../i18n";

export const VaultSetup: React.FC = () => {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const { initialize, isLoading, error } = useVaultSessionStore();

  const strengthScore = (() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return Math.min(4, Math.max(1, score - 1));
  })();

  const strengthLabel = () => {
    if (!password) return t("vault.setup.strengthWeak");
    if (strengthScore <= 1) return t("vault.setup.strengthWeak");
    if (strengthScore === 2) return t("vault.setup.strengthMedium");
    if (strengthScore === 3) return t("vault.setup.strengthStrong");
    return t("vault.setup.strengthVeryStrong");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setValidationError(null);
    if (password.length < 8) {
      setValidationError(t("vault.setup.passwordTooShort"));
      return;
    }
    if (password !== confirmPassword) {
      setValidationError(t("vault.setup.passwordsMismatch"));
      return;
    }
    try {
      await initialize(password);
    } catch {
      // Store surfaces the localized error below.
    }
  };

  return (
    <div className="center-state setup-screen">
      <div className="setup-panel">
        <div className="setup-header">
          <Logo size={52} showText={false} />
          <h1 className="page-title">{t("vault.setup.step1Title")}</h1>
          <p className="page-subtitle">{t("vault.setup.step1Desc")}</p>
        </div>

        <form onSubmit={handleSubmit} className="stack">
          <div>
            <PasswordInput
              label={t("vault.setup.passwordLabel")}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("vault.setup.passwordPlaceholder")}
              required
              autoFocus
            />
            <div className="strength-meter" aria-hidden>
              {[1, 2, 3, 4].map((step) => (
                <span
                  key={step}
                  className={`strength-segment${
                    step <= strengthScore ? " is-filled" : ""
                  }`}
                />
              ))}
            </div>
            <div className="strength-label">
              <span>{t("vault.setup.passwordLabel")}</span>
              <span>{strengthLabel()}</span>
            </div>
          </div>

          <PasswordInput
            label={t("vault.setup.confirmLabel")}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder={t("vault.setup.confirmPlaceholder")}
            required
          />

          {(validationError || error) && (
            <div className="inline-alert is-danger">
              <ShieldAlert size={16} aria-hidden />
              <span>{validationError || error}</span>
            </div>
          )}

          <div className="inline-alert is-warning">
            <ShieldAlert size={16} aria-hidden />
            <span>{t("vault.setup.passwordWarning")}</span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            leftIcon={<ShieldCheck size={18} />}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {t("vault.setup.initButton")}
          </Button>
        </form>
      </div>
    </div>
  );
};
