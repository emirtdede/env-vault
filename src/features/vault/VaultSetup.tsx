import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Zap,
  FolderLock,
  Cpu,
} from "lucide-react";
import { GlassSurface } from "../../components/primitives/GlassSurface";
import { PasswordInput } from "../../components/primitives/PasswordInput";
import { Button } from "../../components/primitives/Button";
import { useVaultSessionStore } from "../../stores/useVaultSessionStore";
import { Logo } from "../../components/brand/Logo";
import { useTranslation } from "../../i18n";

export const VaultSetup: React.FC = () => {
  const { t, language } = useTranslation();
  const [step, setStep] = useState<"welcome" | "create-password">("welcome");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const { initialize, isLoading, error } = useVaultSessionStore();

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: language === "tr" ? "Parola Girin" : "Enter Password", color: "var(--text-tertiary)" };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, label: t("vault.setup.strengthWeak"), color: "#E5484D" };
    if (score <= 3) return { score: 2, label: t("vault.setup.strengthMedium"), color: "#D99028" };
    if (score <= 4) return { score: 3, label: t("vault.setup.strengthStrong"), color: "#2E9B63" };
    return { score: 4, label: t("vault.setup.strengthVeryStrong"), color: "#0A84FF" };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        overflowY: "auto",
        background: "radial-gradient(ellipse 70% 50% at 50% 35%, var(--accent-subtle), transparent 70%), var(--app-bg)",
      }}
      className="animate-fade-in"
    >
      {step === "welcome" ? (
        /* STEP 1: HOŞ GELDİNİZ VE UYGULAMA TANITIM EKRANI */
        <GlassSurface
          intensity="normal"
          blur="lg"
          borderRadius="var(--radius-2xl)"
          style={{
            width: "100%",
            maxWidth: "740px",
            padding: "var(--space-8)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-6)",
            margin: "auto",
            border: "1px solid var(--border)",
            boxShadow: "0 20px 48px -12px rgba(0, 0, 0, 0.45)",
          }}
        >
          {/* Header & Logo */}
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-3)" }}>
            <Logo size={68} showText={false} />

            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
              <h1 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
                {t("vault.setup.welcomeTitle")}
              </h1>
            </div>

            <p style={{ fontSize: "14px", color: "var(--text-secondary)", maxWidth: "540px", lineHeight: 1.5 }}>
              {t("vault.setup.welcomeSubtitle")}
            </p>
          </div>

          {/* 3 Core Architecture Pillars */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "var(--space-4)" }}>
            {/* Pillar 1 */}
            <div
              style={{
                padding: "var(--space-5)",
                borderRadius: "var(--radius-xl)",
                backgroundColor: "var(--surface-subtle)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(10, 132, 255, 0.12)",
                  color: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FolderLock size={20} />
              </div>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                {t("vault.setup.pillar1Title")}
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.45 }}>
                {t("vault.setup.pillar1Desc")}
              </p>
            </div>

            {/* Pillar 2 */}
            <div
              style={{
                padding: "var(--space-5)",
                borderRadius: "var(--radius-xl)",
                backgroundColor: "var(--surface-subtle)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(46, 155, 99, 0.12)",
                  color: "#2E9B63",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Cpu size={20} />
              </div>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                {t("vault.setup.pillar2Title")}
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.45 }}>
                {t("vault.setup.pillar2Desc")}
              </p>
            </div>

            {/* Pillar 3 */}
            <div
              style={{
                padding: "var(--space-5)",
                borderRadius: "var(--radius-xl)",
                backgroundColor: "var(--surface-subtle)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(217, 144, 40, 0.12)",
                  color: "#D99028",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Zap size={20} />
              </div>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                {t("vault.setup.pillar3Title")}
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.45 }}>
                {t("vault.setup.pillar3Desc")}
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setStep("create-password")}
              rightIcon={<ArrowRight size={18} />}
              style={{ width: "100%", justifyContent: "center" }}
            >
              {language === "tr" ? "Kasayı Kurun ve Başlayın" : "Set Up Vault & Get Started"}
            </Button>
          </div>
        </GlassSurface>
      ) : (
        /* STEP 2: ANA PAROLA OLUŞTURMA EKRANI */
        <GlassSurface
          intensity="normal"
          blur="lg"
          borderRadius="var(--radius-2xl)"
          style={{
            width: "100%",
            maxWidth: "460px",
            padding: "var(--space-8)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-6)",
            margin: "auto",
            border: "1px solid var(--border)",
            boxShadow: "0 20px 48px -12px rgba(0, 0, 0, 0.45)",
          }}
        >
          {/* Back button */}
          <button
            type="button"
            onClick={() => setStep("welcome")}
            style={{
              alignSelf: "flex-start",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              color: "var(--text-secondary)",
              padding: "4px 8px",
              borderRadius: "6px",
              backgroundColor: "var(--surface-subtle)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <ArrowLeft size={14} />
            <span>{language === "tr" ? "Genel Bakışa Dön" : "Back to Overview"}</span>
          </button>

          {/* Step Header */}
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-2)" }}>
            <Logo size={52} showText={false} />
            <h2 style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>
              {t("vault.setup.step1Title")}
            </h2>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.45 }}>
              {t("vault.setup.step1Desc")}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div>
              <PasswordInput
                label={t("vault.setup.passwordLabel")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("vault.setup.passwordPlaceholder")}
                required
                autoFocus
              />

              {/* Password strength meter */}
              {password && (
                <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", gap: "4px", height: "4px" }}>
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: "100%",
                          borderRadius: "2px",
                          backgroundColor: i <= strength.score ? strength.color : "var(--border)",
                          transition: "all 0.2s ease",
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-tertiary)" }}>
                    <span>{language === "tr" ? "Parola Gücü:" : "Strength:"}</span>
                    <span style={{ color: strength.color, fontWeight: 600 }}>{strength.label}</span>
                  </div>
                </div>
              )}
            </div>

            <PasswordInput
              label={t("vault.setup.confirmLabel")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("vault.setup.confirmPlaceholder")}
              required
            />

            {(validationError || error) && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  padding: "var(--space-3)",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--danger-subtle)",
                  color: "var(--danger)",
                  fontSize: "13px",
                }}
              >
                <ShieldAlert size={16} />
                <span>{validationError || error}</span>
              </div>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "var(--space-2)",
                padding: "var(--space-3)",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--warning-subtle)",
                color: "var(--warning)",
                fontSize: "12px",
                lineHeight: 1.4,
              }}
            >
              <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>
                <strong>{t("common.warning")}:</strong> {language === "tr" ? "Ana parolanız kurtarılamaz. Parolanızı unutursanız Vault içeriğinize tekrar erişemezsiniz." : "Your master password cannot be recovered. If forgotten, you will lose access to vault files."}
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              style={{ width: "100%", marginTop: "var(--space-2)", justifyContent: "center" }}
              leftIcon={<ShieldCheck size={18} />}
            >
              {t("vault.setup.initButton")}
            </Button>
          </form>
        </GlassSurface>
      )}
    </div>
  );
};
