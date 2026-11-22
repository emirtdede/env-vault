import { AppSettings, BuiltInTheme, ThemeType } from "../types";

export const DARK_THEMES: BuiltInTheme[] = [
  "siyah",
  "koyu-gri",
  "koyu-mavi",
  "koyu-mor",
  "koyu-yesil",
  "koyu-kirmizi",
  "koyu-turuncu",
  "koyu-sari",
];

export const LIGHT_THEMES: BuiltInTheme[] = [
  "beyaz",
  "acik-gri",
  "acik-mavi",
  "acik-mor",
  "acik-yesil",
  "acik-kirmizi",
  "acik-turuncu",
  "acik-sari",
];

/** Dark <-> light counterparts used when following the Windows app mode. */
export const THEME_PAIRS: Record<string, string> = {
  siyah: "beyaz",
  "koyu-gri": "acik-gri",
  "koyu-mavi": "acik-mavi",
  "koyu-mor": "acik-mor",
  "koyu-yesil": "acik-yesil",
  "koyu-kirmizi": "acik-kirmizi",
  "koyu-turuncu": "acik-turuncu",
  "koyu-sari": "acik-sari",
};

export function isDarkTheme(theme: ThemeType): boolean {
  return theme === "ozel" || DARK_THEMES.includes(theme);
}

export function pairTheme(theme: ThemeType): ThemeType {
  if (theme === "ozel") return theme;
  if (THEME_PAIRS[theme]) return THEME_PAIRS[theme] as ThemeType;
  const dark = Object.entries(THEME_PAIRS).find(([, light]) => light === theme)?.[0];
  return (dark as ThemeType) ?? theme;
}

export function isValidHex(value: string): boolean {
  return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
}

export function normalizeHex(value: string): string {
  const raw = value.trim().replace(/^#/, "");
  if (raw.length === 3) {
    return `#${raw
      .split("")
      .map((char) => char + char)
      .join("")
      .toUpperCase()}`;
  }
  return `#${raw.toUpperCase()}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = normalizeHex(hex).slice(1);
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
}

function mix(hex: string, target: string, weight: number): string {
  const source = hexToRgb(hex);
  const destination = hexToRgb(target);
  const channel = source.map((value, index) =>
    Math.round(value + ((destination[index] ?? value) - value) * weight)
  );
  return `#${channel.map((value) => value.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r ?? 0}, ${g ?? 0}, ${b ?? 0}, ${alpha})`;
}

function relativeLuminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = hexToRgb(hex).map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function accentTextColor(accent: string): string {
  return relativeLuminance(accent) > 0.55 ? "#0B0B0F" : "#FFFFFF";
}

/**
 * Builds a complete custom theme from a single accent color. Surface colors are
 * derived from the accent so the result never looks like a stock palette with a
 * swapped highlight.
 */
export function buildCustomTheme(accentColor: string, dark: boolean): Record<string, string> {
  const accent = normalizeHex(accentColor);
  if (!dark) {
    const base = mix(accent, "#FFFFFF", 0.94);
    return {
      "--app-bg": mix(base, "#FFFFFF", 0.55),
      "--surface": mix(base, "#FFFFFF", 0.3),
      "--surface-strong": mix(base, "#FFFFFF", 0.15),
      "--surface-subtle": rgba(accent, 0.05),
      "--surface-hover": rgba(accent, 0.09),
      "--surface-active": rgba(accent, 0.14),
      "--text-primary": mix(accent, "#111827", 0.88),
      "--text-secondary": mix(accent, "#374151", 0.68),
      "--text-tertiary": mix(accent, "#6B7280", 0.5),
      "--border": rgba(accent, 0.14),
      "--border-subtle": rgba(accent, 0.07),
      "--border-strong": rgba(accent, 0.26),
      "--separator": rgba(accent, 0.1),
      "--glass-bg": rgba(mix(base, "#FFFFFF", 0.4), 0.9),
      "--glass-bg-strong": rgba(mix(base, "#FFFFFF", 0.2), 0.97),
      "--glass-border": rgba(accent, 0.16),
      "--input-bg": mix(base, "#FFFFFF", 0.2),
      "--editor-bg": mix(base, "#FFFFFF", 0.45),
      "--editor-line-number": mix(accent, "#9CA3AF", 0.55),
      "--accent": accent,
      "--accent-hover": mix(accent, "#000000", 0.12),
      "--accent-active": mix(accent, "#000000", 0.2),
      "--accent-subtle": rgba(accent, 0.14),
      "--accent-text": accentTextColor(accent),
    };
  }
  const base = mix(accent, "#0A0A0C", 0.88);
  return {
    "--app-bg": mix(base, "#050507", 0.5),
    "--surface": mix(base, "#0D0D11", 0.3),
    "--surface-strong": mix(base, "#15151B", 0.15),
    "--surface-subtle": rgba(accent, 0.06),
    "--surface-hover": rgba(accent, 0.1),
    "--surface-active": rgba(accent, 0.15),
    "--text-primary": mix(accent, "#F8FAFC", 0.92),
    "--text-secondary": mix(accent, "#CBD5E1", 0.72),
    "--text-tertiary": mix(accent, "#94A3B8", 0.55),
    "--border": rgba(accent, 0.18),
    "--border-subtle": rgba(accent, 0.1),
    "--border-strong": rgba(accent, 0.3),
    "--separator": rgba(accent, 0.12),
    "--glass-bg": rgba(mix(base, "#111118", 0.35), 0.88),
    "--glass-bg-strong": rgba(mix(base, "#17171F", 0.2), 0.96),
    "--glass-border": rgba(accent, 0.2),
    "--input-bg": mix(base, "#12121A", 0.3),
    "--editor-bg": mix(base, "#0A0A0E", 0.45),
    "--editor-line-number": mix(accent, "#6B7280", 0.45),
    "--accent": accent,
    "--accent-hover": mix(accent, "#FFFFFF", 0.14),
    "--accent-active": mix(accent, "#FFFFFF", 0.24),
    "--accent-subtle": rgba(accent, 0.16),
    "--accent-text": accentTextColor(accent),
  };
}

const CUSTOM_KEYS = Object.keys(buildCustomTheme("#0A84FF", true));

export function resolveDisplayTheme(
  settings: Pick<AppSettings, "theme" | "customAccent" | "followSystemTheme">,
  systemPrefersDark: boolean
): ThemeType {
  if (!settings.followSystemTheme) return settings.theme;
  if (settings.theme === "ozel") return "ozel";
  const dark = isDarkTheme(settings.theme);
  if (dark === systemPrefersDark) return settings.theme;
  return pairTheme(settings.theme);
}

export function applyTheme(theme: ThemeType, customAccent: string, systemPrefersDark: boolean): void {
  const root = document.documentElement;
  if (theme === "ozel") {
    const dark = systemPrefersDark;
    const tokens = buildCustomTheme(customAccent, dark);
    for (const key of CUSTOM_KEYS) {
      root.style.setProperty(key, tokens[key] ?? "");
    }
    root.setAttribute("data-theme", dark ? "ozel-koyu" : "ozel-acik");
    root.setAttribute("data-color-scheme", dark ? "dark" : "light");
    return;
  }
  for (const key of CUSTOM_KEYS) root.style.removeProperty(key);
  root.setAttribute("data-theme", theme);
  root.setAttribute("data-color-scheme", isDarkTheme(theme) ? "dark" : "light");
}

export function applyUiScale(scale: number): void {
  const clamped = Math.min(200, Math.max(80, Math.round(scale)));
  document.documentElement.style.setProperty("--ui-scale", String(clamped / 100));
}

export const THEME_LABELS: Record<BuiltInTheme, { en: string; tr: string }> = {
  siyah: { en: "Black", tr: "Siyah" },
  "koyu-gri": { en: "Dark Gray", tr: "Koyu Gri" },
  "koyu-mavi": { en: "Dark Blue", tr: "Koyu Mavi" },
  "koyu-mor": { en: "Dark Purple", tr: "Koyu Mor" },
  "koyu-yesil": { en: "Dark Green", tr: "Koyu Yeşil" },
  "koyu-kirmizi": { en: "Dark Red", tr: "Koyu Kırmızı" },
  "koyu-turuncu": { en: "Dark Orange", tr: "Koyu Turuncu" },
  "koyu-sari": { en: "Dark Yellow", tr: "Koyu Sarı" },
  beyaz: { en: "White", tr: "Beyaz" },
  "acik-gri": { en: "Light Gray", tr: "Açık Gri" },
  "acik-mavi": { en: "Light Blue", tr: "Açık Mavi" },
  "acik-mor": { en: "Light Purple", tr: "Açık Mor" },
  "acik-yesil": { en: "Light Green", tr: "Açık Yeşil" },
  "acik-kirmizi": { en: "Light Red", tr: "Açık Kırmızı" },
  "acik-turuncu": { en: "Light Orange", tr: "Açık Turuncu" },
  "acik-sari": { en: "Light Yellow", tr: "Açık Sarı" },
  ozel: { en: "Custom", tr: "Özel" },
};

export const THEME_SWATCHES: Record<BuiltInTheme, string> = {
  siyah: "#0A84FF",
  "koyu-gri": "#38BDF8",
  "koyu-mavi": "#00A3FF",
  "koyu-mor": "#A855F7",
  "koyu-yesil": "#10B981",
  "koyu-kirmizi": "#EF4444",
  "koyu-turuncu": "#F97316",
  "koyu-sari": "#EAB308",
  beyaz: "#0A84FF",
  "acik-gri": "#4B5563",
  "acik-mavi": "#0284C7",
  "acik-mor": "#9333EA",
  "acik-yesil": "#16A34A",
  "acik-kirmizi": "#E11D48",
  "acik-turuncu": "#EA580C",
  "acik-sari": "#CA8A04",
  ozel: "#22D3EE",
};
