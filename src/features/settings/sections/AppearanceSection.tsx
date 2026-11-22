import React, { useEffect, useState } from "react";
import { Check, Monitor, Palette, Sparkles } from "lucide-react";
import { usePreferencesStore } from "../../../stores/usePreferencesStore";
import { useTranslation } from "../../../i18n";
import { AppIconTheme, BuiltInTheme, ThemeType } from "../../../types";
import {
  DARK_THEMES,
  LIGHT_THEMES,
  THEME_LABELS,
  THEME_SWATCHES,
  isValidHex,
  normalizeHex,
} from "../../../lib/theme";
import { usePreferencesPersistence } from "../../../lib/settings-sync";
import { systemApi } from "../../../lib/tauri/system-api";
import { ToggleRow } from "./ToggleRow";
import { Button } from "../../../components/primitives/Button";
import iconObsidian from "../../../assets/icons/icon-obsidian.png";
import iconPorcelain from "../../../assets/icons/icon-porcelain.png";
import iconContrast from "../../../assets/icons/icon-contrast.png";
import iconCyan from "../../../assets/icons/icon-cyan.png";

const ICONS: { id: AppIconTheme; labelKey: string; source: string }[] = [
  { id: "obsidian", labelKey: "settings.iconDark", source: iconObsidian },
  { id: "porcelain", labelKey: "settings.iconLight", source: iconPorcelain },
  { id: "contrast", labelKey: "settings.iconContrast", source: iconContrast },
  { id: "cyan", labelKey: "settings.iconCyan", source: iconCyan },
];

export const AppearanceSection: React.FC = () => {
  const { t, language } = useTranslation();
  const theme = usePreferencesStore((state) => state.theme);
  const customAccent = usePreferencesStore((state) => state.customAccent);
  const followSystemTheme = usePreferencesStore((state) => state.followSystemTheme);
  const iconTheme = usePreferencesStore((state) => state.iconTheme);
  const persist = usePreferencesPersistence();

  const [colorDraft, setColorDraft] = useState(customAccent);
  const [colorError, setColorError] = useState<string | null>(null);
  const [iconError, setIconError] = useState<string | null>(null);

  useEffect(() => setColorDraft(customAccent), [customAccent]);

  const selectTheme = async (next: ThemeType) => {
    await persist({ theme: next });
  };

  const applyCustomColor = async (value: string) => {
    if (!isValidHex(value)) {
      setColorError(t("settings.invalidColor"));
      return;
    }
    setColorError(null);
    const normalized = normalizeHex(value);
    setColorDraft(normalized);
    await persist({ theme: "ozel", customAccent: normalized });
  };

  const selectIcon = async (icon: AppIconTheme) => {
    setIconError(null);
    try {
      await systemApi.applyIcon(icon);
      await persist({ iconTheme: icon });
    } catch {
      setIconError(t("common.error"));
    }
  };

  const themeLabel = (value: BuiltInTheme) =>
    language === "tr" ? THEME_LABELS[value].tr : THEME_LABELS[value].en;

  const renderThemeGrid = (values: BuiltInTheme[], sectionKey: string) => (
    <div className="stack-sm">
      <div className="section-title">{t(sectionKey)}</div>
      <div className="grid-themes">
        {values.map((value) => (
          <button
            key={value}
            type="button"
            className={`theme-option${theme === value ? " is-selected" : ""}`}
            onClick={() => selectTheme(value)}
            aria-pressed={theme === value}
          >
            <span
              className="theme-preview"
              style={{ background: THEME_SWATCHES[value] }}
              aria-hidden
            />
            <span className="theme-option-label">{themeLabel(value)}</span>
            {theme === value && <Check size={14} aria-hidden />}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="stack">
      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Palette size={16} aria-hidden />
              {t("settings.themeTitle")}
            </div>
            <p className="card-subtitle">{t("settings.themeDesc")}</p>
          </div>
        </div>

        <ToggleRow
          label={t("settings.followSystem")}
          description={t("settings.followSystemDesc")}
          icon={Monitor}
          checked={followSystemTheme}
          onChange={(checked) => persist({ followSystemTheme: checked })}
        />

        {renderThemeGrid(DARK_THEMES, "settings.darkThemes")}
        {renderThemeGrid(LIGHT_THEMES, "settings.lightThemes")}
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Sparkles size={16} aria-hidden />
              {t("settings.customThemeTitle")}
            </div>
            <p className="card-subtitle">{t("settings.customThemeDesc")}</p>
          </div>
          {theme === "ozel" && <span className="badge badge-accent">{themeLabel("ozel")}</span>}
        </div>

        <div className="color-field">
          <input
            type="color"
            className="color-input"
            value={isValidHex(colorDraft) ? normalizeHex(colorDraft) : customAccent}
            onChange={(event) => setColorDraft(event.target.value)}
            aria-label={t("settings.customColorLabel")}
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
            onKeyDown={(event) => {
              if (event.key === "Enter") void applyCustomColor(colorDraft);
            }}
            placeholder="#0A84FF"
            aria-label={t("settings.customColorLabel")}
          />
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => applyCustomColor(colorDraft)}
          >
            {t("settings.customColorApply")}
          </Button>
        </div>
        {colorError && <p className="form-error">{colorError}</p>}
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">{t("settings.appIconTitle")}</div>
            <p className="card-subtitle">{t("settings.appIconDesc")}</p>
          </div>
        </div>
        <div className="icon-grid">
          {ICONS.map((icon) => (
            <button
              key={icon.id}
              type="button"
              className={`icon-option${iconTheme === icon.id ? " is-selected" : ""}`}
              onClick={() => selectIcon(icon.id)}
              aria-pressed={iconTheme === icon.id}
            >
              <img className="icon-preview" src={icon.source} alt="" aria-hidden />
              <span className="theme-option-label">{t(icon.labelKey)}</span>
              {iconTheme === icon.id && <Check size={14} aria-hidden />}
            </button>
          ))}
        </div>
        {iconError && <p className="form-error">{iconError}</p>}
      </section>
    </div>
  );
};
