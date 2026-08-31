import React from "react";
import { ExternalLink, Globe, Sparkles, Shield, Cpu, HeartHandshake } from "lucide-react";
import { VelliumLogo } from "../../../components/brand/VelliumLogo";
import { Button } from "../../../components/primitives/Button";
import { useTranslation } from "../../../i18n";
import { openExternalUrl } from "../../../lib/utils/open-url";

export const LegalAboutVellium: React.FC = () => {
  const { t, language } = useTranslation();
  const isTr = language === "tr";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)", color: "var(--text-primary)" }}>
      {/* Brand Hero Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "var(--space-6) var(--space-4)",
          borderRadius: "var(--radius-xl)",
          backgroundColor: "var(--surface-subtle)",
          border: "1px solid var(--border)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-50%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "280px",
            height: "280px",
            borderRadius: "50%",
            backgroundColor: "var(--accent)",
            opacity: 0.08,
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />

        <VelliumLogo size={54} showText={true} style={{ marginBottom: "var(--space-3)" }} />

        <h3
          style={{
            fontSize: "17px",
            fontWeight: 800,
            color: "var(--text-primary)",
            margin: "0 0 6px 0",
            letterSpacing: "-0.02em",
          }}
        >
          {t("vellium.heroTitle")}
        </h3>

        <p
          style={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            maxWidth: "480px",
            margin: "0 0 var(--space-4) 0",
            lineHeight: 1.5,
          }}
        >
          {t("vellium.heroSubtitle")}
        </p>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Globe size={14} />}
          rightIcon={<ExternalLink size={13} />}
          onClick={(e) => openExternalUrl("https://vellium.dev", e)}
        >
          {t("legal.visitWebsite")}
        </Button>
      </div>

      {/* Manifesto Text Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Sparkles size={16} style={{ color: "var(--accent)" }} />
          <h4 style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}>
            {isTr ? "Vellium Mühendislik Manifestosu" : "The Vellium Manifesto"}
          </h4>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-3)",
            fontSize: "13px",
            lineHeight: "1.7",
            color: "var(--text-secondary)",
            padding: "var(--space-4)",
            borderRadius: "var(--radius-lg)",
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <p style={{ margin: 0, fontWeight: 600, color: "var(--text-primary)" }}>
            {t("vellium.manifestoP1")}
          </p>
          <p style={{ margin: 0 }}>
            {t("vellium.manifestoP2")}
          </p>
          <p style={{ margin: 0 }}>
            {t("vellium.manifestoP3")}
          </p>
          <p style={{ margin: 0 }}>
            {t("vellium.manifestoP4")}
          </p>
          <p style={{ margin: 0, fontWeight: 600, color: "var(--accent)" }}>
            {t("vellium.manifestoP5")}
          </p>
        </div>
      </div>

      {/* Core Principles Grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <h4 style={{ fontSize: "13.5px", fontWeight: 700, margin: 0 }}>
          {t("vellium.principlesTitle")}
        </h4>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
          <div
            style={{
              padding: "var(--space-3)",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--surface-subtle)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <Shield size={16} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--text-primary)" }}>
              {t("vellium.principle1Title")}
            </span>
            <span style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
              {t("vellium.principle1Desc")}
            </span>
          </div>

          <div
            style={{
              padding: "var(--space-3)",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--surface-subtle)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <Cpu size={16} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--text-primary)" }}>
              {t("vellium.principle2Title")}
            </span>
            <span style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
              {t("vellium.principle2Desc")}
            </span>
          </div>

          <div
            style={{
              padding: "var(--space-3)",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--surface-subtle)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <HeartHandshake size={16} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--text-primary)" }}>
              {t("vellium.principle3Title")}
            </span>
            <span style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
              {t("vellium.principle3Desc")}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--space-3) var(--space-4)",
          borderRadius: "var(--radius-md)",
          backgroundColor: "var(--surface-subtle)",
          border: "1px solid var(--border-subtle)",
          fontSize: "12px",
          color: "var(--text-secondary)",
        }}
      >
        <span>© 2026 Vellium</span>
        <a
          href="https://vellium.dev"
          target="_blank"
          rel="noreferrer"
          onClick={(e) => openExternalUrl("https://vellium.dev", e)}
          style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600, cursor: "pointer" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = "underline")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = "none")}
        >
          https://vellium.dev
        </a>
      </div>
    </div>
  );
};
