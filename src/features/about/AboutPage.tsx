import React, { useState } from "react";
import {
  ExternalLink,
  GitBranch,
  Heart,
  Info,
  Scale,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useTranslation } from "../../i18n";
import { Button } from "../../components/primitives/Button";
import { Logo } from "../../components/brand/Logo";
import { openExternalUrl } from "../../lib/utils/open-url";
import {
  APP_VERSION,
  COMPANY_NAME,
  LICENSE_NAME,
  REPOSITORY_URL,
  SPONSOR_URL,
  WEBSITE_URL,
} from "../../lib/constants";
import { LegalAboutVellium } from "../settings/legal/LegalAboutVellium";
import { LegalPrivacyPolicy } from "../settings/legal/LegalPrivacyPolicy";
import { LegalTermsOfService } from "../settings/legal/LegalTermsOfService";
import { LegalSecurityDisclosure } from "../settings/legal/LegalSecurityDisclosure";
import { LegalLicenses } from "../settings/legal/LegalLicenses";

type LegalView = "vellium" | "privacy" | "terms" | "security" | "licenses";

const LEGAL_ITEMS: { id: LegalView; labelKey: string; icon: React.ElementType }[] = [
  { id: "vellium", labelKey: "legal.aboutVelliumTitle", icon: Sparkles },
  { id: "privacy", labelKey: "legal.privacyTitle", icon: ShieldCheck },
  { id: "terms", labelKey: "legal.termsTitle", icon: Scale },
  { id: "security", labelKey: "legal.securityTitle", icon: Info },
  { id: "licenses", labelKey: "legal.licensesTitle", icon: Info },
];

export const AboutPage: React.FC = () => {
  const { t } = useTranslation();
  const [legal, setLegal] = useState<LegalView | null>(null);

  const renderLegal = () => {
    switch (legal) {
      case "vellium":
        return <LegalAboutVellium />;
      case "privacy":
        return <LegalPrivacyPolicy />;
      case "terms":
        return <LegalTermsOfService />;
      case "security":
        return <LegalSecurityDisclosure />;
      case "licenses":
        return <LegalLicenses />;
      default:
        return null;
    }
  };

  return (
    <div className="page" data-testid="about-page">
      <div className="page-main">
        <div className="page-inner">
          <section className="about-hero">
            <Logo size={56} showText={false} />
            <div>
              <h1 className="page-title">{t("about.title")}</h1>
              <p className="page-subtitle">{t("about.tagline")}</p>
            </div>
            <span className="badge badge-accent">v{APP_VERSION}</span>
          </section>

          <section className="card">
            <p className="muted about-description">{t("about.description")}</p>
            <div className="info-grid">
              <div className="info-tile">
                <div className="info-label">{t("about.developerLabel")}</div>
                <div className="info-value">{COMPANY_NAME}</div>
              </div>
              <div className="info-tile">
                <div className="info-label">{t("about.publisherLabel")}</div>
                <div className="info-value">{COMPANY_NAME}</div>
              </div>
              <div className="info-tile">
                <div className="info-label">{t("about.versionLabel")}</div>
                <div className="info-value">{APP_VERSION}</div>
              </div>
              <div className="info-tile">
                <div className="info-label">{t("about.licenseLabel")}</div>
                <div className="info-value">{LICENSE_NAME}</div>
              </div>
              <div className="info-tile">
                <div className="info-label">{t("about.technologiesLabel")}</div>
                <div className="info-value">{t("about.technologiesValue")}</div>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-title">{t("support.quickLinks")}</div>
            <div className="link-list">
              <button type="button" className="link-row" onClick={() => openExternalUrl(WEBSITE_URL)}>
                <ExternalLink size={15} aria-hidden />
                <span>{t("about.websiteLabel")}</span>
              </button>
              <button type="button" className="link-row" onClick={() => openExternalUrl(REPOSITORY_URL)}>
                <GitBranch size={15} aria-hidden />
                <span>{t("about.githubLabel")}</span>
              </button>
              <button type="button" className="link-row" onClick={() => openExternalUrl(SPONSOR_URL)}>
                <Heart size={15} aria-hidden />
                <span>{t("about.sponsorLabel")}</span>
              </button>
            </div>
          </section>

          <section className="card">
            <div className="card-title">{t("about.legalTitle")}</div>
            <div className="inline">
              {LEGAL_ITEMS.map(({ id, labelKey, icon: Icon }) => (
                <Button
                  key={id}
                  variant="secondary"
                  size="sm"
                  leftIcon={<Icon size={14} />}
                  onClick={() => setLegal(id)}
                >
                  {t(labelKey)}
                </Button>
              ))}
            </div>
            <p className="tiny">{t("about.copyright")}</p>
          </section>
        </div>
      </div>

      {legal && (
        <div className="legal-overlay" role="dialog" aria-modal="true">
          <div className="legal-panel">
            <div className="legal-panel-header">
              <div className="card-title">
                {t(LEGAL_ITEMS.find((item) => item.id === legal)?.labelKey ?? "about.legalTitle")}
              </div>
              <button
                type="button"
                className="tb-window-button"
                onClick={() => setLegal(null)}
                aria-label={t("common.close")}
              >
                <X size={16} aria-hidden />
              </button>
            </div>
            <div className="legal-panel-body">{renderLegal()}</div>
          </div>
        </div>
      )}
    </div>
  );
};
