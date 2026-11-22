import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FolderPlus,
  HardDrive,
  KeyRound,
  Languages,
  Palette,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { useTranslation } from "../../i18n";
import { Button } from "../../components/primitives/Button";
import { usePreferencesStore } from "../../stores/usePreferencesStore";
import { persistSettingsPatch } from "../../lib/settings-sync";
import { systemApi } from "../../lib/tauri/system-api";
import {
  DARK_THEMES,
  LIGHT_THEMES,
  THEME_LABELS,
  THEME_SWATCHES,
  isValidHex,
  normalizeHex,
} from "../../lib/theme";
import { AppIconTheme, BuiltInTheme } from "../../types";
import iconObsidian from "../../assets/icons/icon-obsidian.png";
import iconPorcelain from "../../assets/icons/icon-porcelain.png";
import iconContrast from "../../assets/icons/icon-contrast.png";
import iconCyan from "../../assets/icons/icon-cyan.png";

const ICONS: { id: AppIconTheme; labelKey: string; source: string }[] = [
  { id: "obsidian", labelKey: "settings.iconDark", source: iconObsidian },
  { id: "porcelain", labelKey: "settings.iconLight", source: iconPorcelain },
  { id: "contrast", labelKey: "settings.iconContrast", source: iconContrast },
  { id: "cyan", labelKey: "settings.iconCyan", source: iconCyan },
];

interface OnboardingProps {
  onComplete: () => void;
}

const STEPS = ["language", "theme", "welcome", "tour"] as const;
type Step = (typeof STEPS)[number];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { t, language, setLanguage, languages } = useTranslation();
  const theme = usePreferencesStore((state) => state.theme);
  const customAccent = usePreferencesStore((state) => state.customAccent);
  const iconTheme = usePreferencesStore((state) => state.iconTheme);
  const [stepIndex, setStepIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [colorDraft, setColorDraft] = useState(customAccent);
  const [colorError, setColorError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  const step: Step = STEPS[stepIndex] ?? "language";

  const filteredLanguages = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return languages;
    return languages.filter(
      (entry) =>
        entry.nativeName.toLowerCase().includes(normalized) ||
        entry.englishName.toLowerCase().includes(normalized) ||
        entry.code.includes(normalized)
    );
  }, [languages, query]);

  const themeLabel = (value: BuiltInTheme) =>
    language === "tr" ? THEME_LABELS[value].tr : THEME_LABELS[value].en;

  const applyTheme = (value: BuiltInTheme) => {
    void persistSettingsPatch({ theme: value }).catch(() => {});
  };

  const next = () => setStepIndex((index) => Math.min(STEPS.length - 1, index + 1));
  const back = () => setStepIndex((index) => Math.max(0, index - 1));

  const selectIcon = async (icon: AppIconTheme) => {
    try {
      await systemApi.applyIcon(icon);
      await persistSettingsPatch({ iconTheme: icon });
    } catch {
      // The icon pack could not be applied; the theme step stays usable and
      // the failure is reported from Settings later.
    }
  };

  const applyColor = async () => {
    if (!isValidHex(colorDraft)) {
      setColorError(t("onboarding.invalidColor"));
      return;
    }
    setColorError(null);
    const normalized = normalizeHex(colorDraft);
    setColorDraft(normalized);
    await persistSettingsPatch({ theme: "ozel", customAccent: normalized });
  };

  const finish = async () => {
    setFinishing(true);
    try {
      await persistSettingsPatch({ onboardingCompleted: true });
    } finally {
      setFinishing(false);
      onComplete();
    }
  };

  const footer = (
    <div className="onboarding-footer">
      <span className="onboarding-step-label">
        {t("onboarding.stepIndicator", {
          current: stepIndex + 1,
          total: STEPS.length,
        })}
      </span>
      <div className="inline">
        {stepIndex > 0 && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<ArrowLeft size={14} />}
            onClick={back}
          >
            {t("onboarding.back")}
          </Button>
        )}
        {step === "tour" ? (
          <Button
            variant="primary"
            size="sm"
            isLoading={finishing}
            rightIcon={<Check size={14} />}
            onClick={finish}
          >
            {t("onboarding.finish")}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            rightIcon={<ArrowRight size={14} />}
            onClick={next}
          >
            {t("onboarding.next")}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="onboarding" data-testid="onboarding">
      <div className="onboarding-panel">
        <header className="onboarding-header">
          <div className="onboarding-progress" aria-hidden>
            {STEPS.map((value, index) => (
              <span
                key={value}
                className={`onboarding-step-dot${
                  index < stepIndex ? " is-done" : index === stepIndex ? " is-current" : ""
                }`}
              />
            ))}
          </div>
          <span className="badge badge-muted">Env Vault</span>
        </header>

        <div className="onboarding-body">
          {step === "language" && (
            <>
              <div>
                <h2 className="onboarding-title">
                  <Languages size={20} aria-hidden /> {t("onboarding.languageTitle")}
                </h2>
                <p className="onboarding-subtitle">{t("onboarding.languageSubtitle")}</p>
              </div>
              <div className="search-box">
                <Search size={15} aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("common.search")}
                  aria-label={t("common.search")}
                />
              </div>
              <div className="lang-grid" role="listbox" aria-label={t("onboarding.languageTitle")}>
                {filteredLanguages.map((entry) => (
                  <button
                    key={entry.code}
                    type="button"
                    role="option"
                    aria-selected={language === entry.code}
                    className={`lang-option${language === entry.code ? " is-selected" : ""}`}
                    onClick={() => setLanguage(entry.code)}
                  >
                    <span className="lang-code">{entry.code}</span>
                    <span className="lang-name">{entry.nativeName}</span>
                    {language === entry.code && <Check size={14} aria-hidden />}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === "theme" && (
            <>
              <div>
                <h2 className="onboarding-title">
                  <Palette size={20} aria-hidden /> {t("onboarding.themeTitle")}
                </h2>
                <p className="onboarding-subtitle">{t("onboarding.themeSubtitle")}</p>
              </div>

              <div className="stack-sm">
                <div className="section-title">{t("settings.darkThemes")}</div>
                <div className="grid-themes">
                  {DARK_THEMES.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`theme-option${theme === value ? " is-selected" : ""}`}
                      onClick={() => applyTheme(value)}
                    >
                      <span className="theme-preview" style={{ background: THEME_SWATCHES[value] }} />
                      <span className="theme-option-label">{themeLabel(value)}</span>
                    </button>
                  ))}
                </div>
                <div className="section-title">{t("settings.lightThemes")}</div>
                <div className="grid-themes">
                  {LIGHT_THEMES.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`theme-option${theme === value ? " is-selected" : ""}`}
                      onClick={() => applyTheme(value)}
                    >
                      <span className="theme-preview" style={{ background: THEME_SWATCHES[value] }} />
                      <span className="theme-option-label">{themeLabel(value)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="card card-flat">
                <div className="card-title">
                  <Sparkles size={15} aria-hidden />
                  {t("onboarding.customThemeTitle")}
                </div>
                <p className="card-subtitle">{t("onboarding.customThemeDesc")}</p>
                <div className="color-field">
                  <input
                    type="color"
                    className="color-input"
                    value={isValidHex(colorDraft) ? normalizeHex(colorDraft) : customAccent}
                    onChange={(event) => setColorDraft(event.target.value)}
                    aria-label={t("onboarding.customColorLabel")}
                  />
                  <input
                    type="text"
                    className={`color-text${colorError ? " is-invalid" : ""}`}
                    value={colorDraft}
                    spellCheck={false}
                    onChange={(event) => {
                      setColorDraft(event.target.value);
                      setColorError(null);
                    }}
                    placeholder="#0A84FF"
                    aria-label={t("onboarding.customColorLabel")}
                  />
                  <Button variant="secondary" size="sm" onClick={applyColor}>
                    {t("onboarding.customColorApply")}
                  </Button>
                </div>
                {colorError && <p className="form-error">{colorError}</p>}
              </div>

              <div className="stack-sm">
                <div className="section-title">{t("settings.appIconTitle")}</div>
                <div className="icon-grid">
                  {ICONS.map((icon) => (
                    <button
                      key={icon.id}
                      type="button"
                      className={`icon-option${iconTheme === icon.id ? " is-selected" : ""}`}
                      onClick={() => void selectIcon(icon.id)}
                      aria-pressed={iconTheme === icon.id}
                    >
                      <img className="icon-preview" src={icon.source} alt="" aria-hidden />
                      <span className="theme-option-label">{t(icon.labelKey)}</span>
                      {iconTheme === icon.id && <Check size={14} aria-hidden />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === "welcome" && (
            <>
              <div>
                <h2 className="onboarding-title">{t("onboarding.welcomeTitle")}</h2>
                <p className="onboarding-subtitle">{t("onboarding.welcomeSubtitle")}</p>
              </div>
              <div className="welcome-points">
                {[
                  { icon: ShieldCheck, title: "welcomePoint1Title", desc: "welcomePoint1Desc" },
                  { icon: HardDrive, title: "welcomePoint2Title", desc: "welcomePoint2Desc" },
                  { icon: KeyRound, title: "welcomePoint3Title", desc: "welcomePoint3Desc" },
                ].map(({ icon: Icon, title, desc }) => (
                  <div className="welcome-point" key={title}>
                    <span className="welcome-point-icon">
                      <Icon size={16} aria-hidden />
                    </span>
                    <div className="welcome-point-title">{t(`onboarding.${title}`)}</div>
                    <p className="welcome-point-desc">{t(`onboarding.${desc}`)}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === "tour" && (
            <>
              <div>
                <h2 className="onboarding-title">{t("onboarding.tourTitle")}</h2>
                <p className="onboarding-subtitle">{t("onboarding.tourSubtitle")}</p>
              </div>
              <div className="stack-sm">
                {[
                  { icon: FolderPlus, title: "tour1Title", desc: "tour1Desc" },
                  { icon: UploadCloud, title: "tour2Title", desc: "tour2Desc" },
                  { icon: KeyRound, title: "tour3Title", desc: "tour3Desc" },
                  { icon: HardDrive, title: "tour4Title", desc: "tour4Desc" },
                ].map(({ icon: Icon, title, desc }, index) => (
                  <div className="tour-step" key={title}>
                    <span className="tour-index">
                      {index + 1}
                    </span>
                    <div>
                      <div className="welcome-point-title">
                        <Icon size={14} aria-hidden /> {t(`onboarding.${title}`)}
                      </div>
                      <p className="welcome-point-desc">{t(`onboarding.${desc}`)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="card card-flat">
                <div className="card-title">{t("onboarding.readyTitle")}</div>
                <p className="card-subtitle">{t("onboarding.readySubtitle")}</p>
              </div>
            </>
          )}
        </div>

        {footer}
      </div>
    </div>
  );
};
