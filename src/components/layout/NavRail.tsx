import React, { useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Heart,
  Info,
  LifeBuoy,
  LockKeyhole,
  Settings as SettingsIcon,
} from "lucide-react";
import { Logo } from "../brand/Logo";
import { useNavigationStore } from "../../stores/useNavigationStore";
import { useTranslation } from "../../i18n";
import { REPOSITORY_URL, SPONSOR_URL } from "../../lib/constants";
import { openExternalUrl } from "../../lib/utils/open-url";

interface RailEntry {
  view: "vault" | "settings" | "docs" | "support" | "about";
  labelKey: string;
  icon: React.ElementType;
}

const ENTRIES: RailEntry[] = [
  { view: "vault", labelKey: "nav.vault", icon: LockKeyhole },
  { view: "settings", labelKey: "nav.settings", icon: SettingsIcon },
  { view: "docs", labelKey: "nav.docs", icon: BookOpen },
  { view: "support", labelKey: "nav.support", icon: LifeBuoy },
  { view: "about", labelKey: "nav.about", icon: Info },
];

export const NavRail: React.FC = () => {
  const { t } = useTranslation();
  const view = useNavigationStore((state) => state.view);
  const setView = useNavigationStore((state) => state.setView);
  const [expanded, setExpanded] = useState(false);

  return (
    <nav
      className={`nav-rail${expanded ? " is-expanded" : ""}`}
      aria-label={t("nav.railLabel")}
    >
      <div className="rail-brand">
        <Logo size={expanded ? 28 : 30} showText={expanded} showBadge={false} />
      </div>

      {ENTRIES.map(({ view: target, labelKey, icon: Icon }) => (
        <button
          key={target}
          type="button"
          className={`rail-item${view === target ? " is-active" : ""}`}
          onClick={() => setView(target)}
          aria-current={view === target ? "page" : undefined}
          title={expanded ? undefined : t(labelKey)}
        >
          <Icon size={19} strokeWidth={1.9} aria-hidden />
          <span className="rail-item-label">{t(labelKey)}</span>
        </button>
      ))}

      <div className="rail-spacer" />
      <div className="rail-divider" />

      <button
        type="button"
        className="rail-item"
        onClick={() => openExternalUrl(REPOSITORY_URL)}
        title={t("support.github")}
      >
        <GitBranch size={18} aria-hidden />
        <span className="rail-item-label">{t("support.github")}</span>
      </button>
      <button
        type="button"
        className="rail-item"
        onClick={() => openExternalUrl(SPONSOR_URL)}
        title={t("support.sponsor")}
      >
        <Heart size={18} aria-hidden />
        <span className="rail-item-label">{t("support.sponsor")}</span>
      </button>

      <button
        type="button"
        className="rail-item rail-toggle"
        onClick={() => setExpanded((value) => !value)}
        title={expanded ? t("nav.collapse") : t("nav.expand")}
        aria-expanded={expanded}
      >
        {expanded ? <ChevronLeft size={18} aria-hidden /> : <ChevronRight size={18} aria-hidden />}
        <span className="rail-item-label">
          {expanded ? t("nav.collapse") : t("nav.expand")}
        </span>
      </button>
    </nav>
  );
};
