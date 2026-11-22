import React from "react";
import { Accessibility, Eye, ZoomIn } from "lucide-react";
import { usePreferencesStore } from "../../../stores/usePreferencesStore";
import { useTranslation } from "../../../i18n";
import { usePreferencesPersistence } from "../../../lib/settings-sync";
import { ToggleRow } from "./ToggleRow";

const ZOOM_STEPS = [80, 90, 100, 110, 125, 150, 175, 200];

export const AccessibilitySection: React.FC = () => {
  const { t } = useTranslation();
  const uiScale = usePreferencesStore((state) => state.uiScale);
  const reduceMotion = usePreferencesStore((state) => state.reduceMotion);
  const persist = usePreferencesPersistence();

  return (
    <div className="stack">
      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <ZoomIn size={16} aria-hidden />
              {t("settings.zoomTitle")}
            </div>
            <p className="card-subtitle">{t("settings.zoomDesc")}</p>
          </div>
          <span className="badge badge-accent">{uiScale}%</span>
        </div>

        <div className="zoom-row">
          <input
            className="zoom-slider"
            type="range"
            min={80}
            max={200}
            step={5}
            value={uiScale}
            onChange={(event) => persist({ uiScale: Number(event.target.value) })}
            aria-label={t("settings.zoomTitle")}
          />
          <span className="zoom-value">{uiScale}%</span>
          <button
            type="button"
            className="link"
            onClick={() => persist({ uiScale: 100 })}
          >
            {t("settings.zoomReset")}
          </button>
        </div>

        <div className="inline">
          {ZOOM_STEPS.map((step) => (
            <button
              key={step}
              type="button"
              className={`chip${uiScale === step ? " is-selected" : ""}`}
              onClick={() => persist({ uiScale: step })}
            >
              {step}%
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Accessibility size={16} aria-hidden />
              {t("settings.reduceMotionTitle")}
            </div>
            <p className="card-subtitle">{t("settings.reduceMotionDesc")}</p>
          </div>
        </div>
        <ToggleRow
          icon={Eye}
          label={t("settings.reduceMotion")}
          description={t("settings.reduceMotionDesc")}
          checked={reduceMotion}
          onChange={(checked) => persist({ reduceMotion: checked })}
        />
      </section>
    </div>
  );
};
