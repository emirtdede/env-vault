import React, { useState } from "react";
import { Unlock, ShieldAlert } from "lucide-react";
import { GlassSurface } from "../../components/primitives/GlassSurface";
import { PasswordInput } from "../../components/primitives/PasswordInput";
import { Button } from "../../components/primitives/Button";
import { useVaultSessionStore } from "../../stores/useVaultSessionStore";
import { Logo } from "../../components/brand/Logo";
import { useTranslation } from "../../i18n";

export const VaultLockScreen: React.FC = () => {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const { unlock, isLoading, error, clearError } = useVaultSessionStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    try {
      await unlock(password);
    } catch {
      // Error handled by store
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        padding: "var(--space-6)",
        background: "radial-gradient(ellipse 70% 50% at 50% 35%, var(--accent-subtle), transparent 70%), var(--app-bg)",
      }}
      className="animate-fade-in"
    >
      <GlassSurface
        intensity="normal"
        blur="lg"
        borderRadius="var(--radius-2xl)"
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "var(--space-8)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-6)",
          border: "1px solid var(--border)",
          boxShadow: "0 20px 48px -12px rgba(0, 0, 0, 0.45)",
        }}
      >
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-3)" }}>
          <Logo size={60} showText={false} />
          <div>
            <h1 style={{ fontSize: "19px", fontWeight: 700, letterSpacing: "-0.02em" }}>
              {t("vault.lock.title")}
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px", lineHeight: 1.45 }}>
              {t("vault.lock.subtitleLine1")}
              <br />
              {t("vault.lock.subtitleLine2")}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <PasswordInput
            label={t("vault.lock.passwordLabel")}
            placeholder={t("vault.lock.passwordPlaceholder")}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) clearError();
            }}
            disabled={isLoading}
            autoFocus
          />

          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                padding: "var(--space-3)",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--danger-subtle)",
                color: "var(--danger)",
                fontSize: "12.5px",
              }}
            >
              <ShieldAlert size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            leftIcon={<Unlock size={16} />}
            style={{ marginTop: "var(--space-2)", width: "100%" }}
          >
            {t("vault.lock.unlockButton")}
          </Button>
        </form>
      </GlassSurface>
    </div>
  );
};
