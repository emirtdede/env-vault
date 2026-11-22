import React, { useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Cloud,
  Download,
  Keyboard,
  Search,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { useTranslation } from "../../i18n";

interface DocSection {
  id: string;
  title: string;
  description: string;
  steps: string[];
  icon: React.ElementType;
}

export const DocsPage: React.FC = () => {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);

  const sections: DocSection[] = useMemo(
    () => [
      {
        id: "quick-start",
        title: t("docs.quickStartTitle"),
        description: t("docs.quickStartDesc"),
        steps: [
          t("docs.quickStartStep1"),
          t("docs.quickStartStep2"),
          t("docs.quickStartStep3"),
          t("docs.quickStartStep4"),
        ],
        icon: Workflow,
      },
      {
        id: "security",
        title: t("docs.securityTitle"),
        description: t("docs.securityDesc"),
        steps: [
          t("docs.securityStep1"),
          t("docs.securityStep2"),
          t("docs.securityStep3"),
        ],
        icon: ShieldCheck,
      },
      {
        id: "import-export",
        title: t("docs.importExportTitle"),
        description: t("docs.importExportDesc"),
        steps: [
          t("docs.importExportStep1"),
          t("docs.importExportStep2"),
          t("docs.importExportStep3"),
        ],
        icon: Download,
      },
      {
        id: "backup",
        title: t("docs.backupTitle"),
        description: t("docs.backupDesc"),
        steps: [
          t("docs.backupStep1"),
          t("docs.backupStep2"),
          t("docs.backupStep3"),
        ],
        icon: Cloud,
      },
    ],
    [t]
  );

  const shortcuts = [
    { keys: ["Ctrl", "N"], label: t("docs.shortcutNewProject") },
    { keys: ["Ctrl", "O"], label: t("docs.shortcutAddEnv") },
    { keys: ["Ctrl", "S"], label: t("docs.shortcutSave") },
    { keys: ["Ctrl", "F"], label: t("docs.shortcutSearch") },
    { keys: ["Ctrl", "L"], label: t("docs.shortcutLock") },
  ];

  const faqs = [
    { question: t("docs.faq1Q"), answer: t("docs.faq1A") },
    { question: t("docs.faq2Q"), answer: t("docs.faq2A") },
    { question: t("docs.faq3Q"), answer: t("docs.faq3A") },
    { question: t("docs.faq4Q"), answer: t("docs.faq4A") },
  ];

  const normalized = query.trim().toLowerCase();
  const matches = (text: string) => !normalized || text.toLowerCase().includes(normalized);
  const visibleSections = sections.filter(
    (section) =>
      matches(section.title) ||
      matches(section.description) ||
      section.steps.some((step) => matches(step))
  );
  const visibleFaqs = faqs.filter(
    (faq) => matches(faq.question) || matches(faq.answer)
  );
  const hasResults = visibleSections.length > 0 || visibleFaqs.length > 0;

  const scrollTo = (id: string) => {
    const target = bodyRef.current?.querySelector<HTMLElement>(`#doc-${id}`);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="page" data-testid="docs-page">
      <aside className="docs-sidebar" aria-label={t("docs.title")}>
        <div className="docs-nav-title">
          <BookOpen size={15} aria-hidden />
          {t("docs.title")}
        </div>
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            className="settings-nav-item"
            onClick={() => scrollTo(section.id)}
          >
            <section.icon size={15} aria-hidden />
            <span>{section.title}</span>
          </button>
        ))}
        <button
          type="button"
          className="settings-nav-item"
          onClick={() => scrollTo("shortcuts")}
        >
          <Keyboard size={15} aria-hidden />
          <span>{t("docs.shortcutsTitle")}</span>
        </button>
        <button
          type="button"
          className="settings-nav-item"
          onClick={() => scrollTo("faq")}
        >
          <Search size={15} aria-hidden />
          <span>{t("docs.faqTitle")}</span>
        </button>
      </aside>

      <div className="page-main" ref={bodyRef}>
        <div className="page-inner">
          <header className="page-header">
            <div>
              <h1 className="page-title">{t("docs.title")}</h1>
              <p className="page-subtitle">{t("docs.subtitle")}</p>
            </div>
          </header>

          <div className="search-box">
            <Search size={15} aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("docs.searchPlaceholder")}
              aria-label={t("docs.searchPlaceholder")}
            />
          </div>

          {!hasResults && (
            <div className="empty-note">{t("docs.noResults")}</div>
          )}

          {visibleSections.map((section) => (
            <section className="card doc-card" id={`doc-${section.id}`} key={section.id}>
              <div className="card-header">
                <div>
                  <div className="card-title">
                    <section.icon size={16} aria-hidden />
                    {section.title}
                  </div>
                  <p className="card-subtitle">{section.description}</p>
                </div>
              </div>
              <div className="doc-section">
                {section.steps.map((step, index) => (
                  <div className="doc-step" key={`${section.id}-${index}`}>
                    <span className="doc-step-index">{index + 1}</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </section>
          ))}

          <section className="card" id="doc-shortcuts">
            <div className="card-title">
              <Keyboard size={16} aria-hidden />
              {t("docs.shortcutsTitle")}
            </div>
            <p className="card-subtitle">{t("docs.shortcutsDesc")}</p>
            <div>
              {shortcuts.map((shortcut) => (
                <div className="shortcut-row" key={shortcut.label}>
                  <span>{shortcut.label}</span>
                  <span className="kbd-group">
                    {shortcut.keys.map((key) => (
                      <kbd key={key}>{key}</kbd>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="card" id="doc-faq">
            <div className="card-title">{t("docs.faqTitle")}</div>
            <div className="stack-sm">
              {visibleFaqs.map((faq) => (
                <div className="faq-item" key={faq.question}>
                  <div className="faq-question">{faq.question}</div>
                  <div className="faq-answer">{faq.answer}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
