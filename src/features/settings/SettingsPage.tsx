import React from "react";
import {
  Accessibility,
  Bell,
  BookOpen,
  Database,
  Info,
  Palette,
  Settings2,
  ShieldCheck,
  SquareTerminal,
} from "lucide-react";
import { useNavigationStore, SettingsSection } from "../../stores/useNavigationStore";
import { useTranslation } from "../../i18n";
import { GeneralSection } from "./sections/GeneralSection";
import { AppearanceSection } from "./sections/AppearanceSection";
import { SecuritySection } from "./sections/SecuritySection";
import { NotificationsSection } from "./sections/NotificationsSection";
import { DataSection } from "./sections/DataSection";
import { AccessibilitySection } from "./sections/AccessibilitySection";
import { Button } from "../../components/primitives/Button";

const NAV_ITEMS: {
  id: SettingsSection;
  labelKey: string;
  icon: React.ElementType;
}[] = [
  { id: "general", labelKey: "settings.navGeneral", icon: Settings2 },
  { id: "appearance", labelKey: "settings.navAppearance", icon: Palette },
  { id: "security", labelKey: "settings.navSecurity", icon: ShieldCheck },
  { id: "notifications", labelKey: "settings.navNotifications", icon: Bell },
  { id: "data", labelKey: "settings.navData", icon: Database },
  { id: "accessibility", labelKey: "settings.navAccessibility", icon: Accessibility },
  { id: "developer", labelKey: "settings.navDeveloper", icon: SquareTerminal },
  { id: "docs", labelKey: "settings.navDocs", icon: BookOpen },
  { id: "about", labelKey: "settings.navAbout", icon: Info },
];

const SECTION_TITLES: Record<SettingsSection, string> = {
  general: "settings.title",
  appearance: "settings.navAppearance",
  security: "settings.navSecurity",
  notifications: "settings.navNotifications",
  data: "settings.navData",
  accessibility: "settings.navAccessibility",
  developer: "settings.navDeveloper",
  docs: "docs.title",
  about: "about.title",
};

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const section = useNavigationStore((state) => state.settingsSection);
  const setSection = useNavigationStore((state) => state.setSettingsSection);
  const setView = useNavigationStore((state) => state.setView);

  const renderSection = () => {
    switch (section) {
      case "general":
        return <GeneralSection />;
      case "appearance":
        return <AppearanceSection />;
      case "security":
        return <SecuritySection />;
      case "notifications":
        return <NotificationsSection />;
      case "data":
        return <DataSection />;
      case "accessibility":
        return <AccessibilitySection />;
      case "developer":
        return (
          <section className="card">
            <div className="card-title">{t("integrations.title")}</div>
            <p className="card-subtitle">{t("integrations.subtitle")}</p>
            <div>
              <Button variant="primary" size="sm" onClick={() => setView("integrations")}>
                {t("nav.integrations")}
              </Button>
            </div>
          </section>
        );
      case "docs":
        return (
          <section className="card">
            <div className="card-title">{t("docs.title")}</div>
            <p className="card-subtitle">{t("docs.subtitle")}</p>
            <div>
              <Button variant="primary" size="sm" onClick={() => setView("docs")}>
                {t("support.openDocs")}
              </Button>
            </div>
          </section>
        );
      case "about":
        return (
          <section className="card">
            <div className="card-title">{t("about.title")}</div>
            <p className="card-subtitle">{t("about.description")}</p>
            <div>
              <Button variant="primary" size="sm" onClick={() => setView("about")}>
                {t("nav.about")}
              </Button>
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className="page" data-testid="settings-page">
      <aside className="settings-sidebar" aria-label={t("settings.title")}>
        {NAV_ITEMS.map(({ id, labelKey, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`settings-nav-item${section === id ? " is-active" : ""}`}
            onClick={() => setSection(id)}
            aria-current={section === id ? "page" : undefined}
          >
            <Icon size={15} aria-hidden />
            <span>{t(labelKey)}</span>
          </button>
        ))}
      </aside>

      <div className="page-main">
        <div className="page-inner">
          <header className="page-header">
            <div>
              <h1 className="page-title">{t(SECTION_TITLES[section])}</h1>
              <p className="page-subtitle">{t("settings.subtitle")}</p>
            </div>
          </header>
          {renderSection()}
        </div>
      </div>
    </div>
  );
};
