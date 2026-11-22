import { create } from "zustand";
import { detectSystemLanguage, usePreferencesStore } from "../stores/usePreferencesStore";
import { Language } from "../types";
import { en as enDictionary } from "./locales/en";
import { tr as trDictionary } from "./locales/tr";
import catalog from "./languages.json";

export interface LanguageDescriptor {
  code: string;
  englishName: string;
  nativeName: string;
  rtl: boolean;
}

export const LANGUAGES: LanguageDescriptor[] = catalog.languages;
export const LANGUAGE_CODES = LANGUAGES.map((language) => language.code);
export const RTL_LANGUAGES = new Set(
  LANGUAGES.filter((language) => language.rtl).map((language) => language.code)
);
export const TRANSLATED_LANGUAGES = new Set(["en", "tr"]);

export type Dictionary = Record<string, unknown>;

const localeModules = import.meta.glob("./locales/*.json") as Record<
  string,
  () => Promise<{ default: Dictionary }>
>;

interface I18nState {
  language: Language;
  dictionary: Dictionary;
  ready: boolean;
  version: number;
  setLanguage: (language: Language) => Promise<void>;
  load: (language: Language) => Promise<void>;
}

const bundledFallback = enDictionary as unknown as Dictionary;

export const useI18nStore = create<I18nState>((set, get) => ({
  language: "en",
  dictionary: bundledFallback,
  ready: false,
  version: 0,
  setLanguage: async (language) => {
    await get().load(language);
  },
  load: async (language) => {
    const module = localeModules[`./locales/${language}.json`];
    if (!module) {
      set((state) => ({
        language,
        dictionary: bundledFallback,
        ready: true,
        version: state.version + 1,
      }));
      return;
    }
    try {
      const loaded = await module();
      set((state) => ({
        language,
        dictionary: loaded.default ?? bundledFallback,
        ready: true,
        version: state.version + 1,
      }));
    } catch {
      set((state) => ({
        language,
        dictionary: bundledFallback,
        ready: true,
        version: state.version + 1,
      }));
    }
  },
}));

function getNestedValue(obj: Dictionary, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === undefined || current === null || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  return Object.entries(params).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    text
  );
}

/**
 * Synchronous translation for a known dictionary. Used outside React (tests,
 * stores) where the hook cannot run.
 */
export function translate(
  language: Language,
  key: string,
  params?: Record<string, string | number>
): string {
  const dictionary =
    language === "tr" ? (trDictionary as unknown as Dictionary) : (useI18nStore.getState().dictionary);
  const value = getNestedValue(dictionary, key) ?? getNestedValue(bundledFallback, key);
  return interpolate(value ?? key, params);
}

export function useTranslation() {
  const language = usePreferencesStore((state) => state.language);
  // Subscribing to `version` keeps consumers re-rendering when a lazy locale
  // finishes loading.
  useI18nStore((state) => state.version);
  const activeLanguage = useI18nStore((state) => state.language);
  const dictionary = useI18nStore((state) => state.dictionary);

  const t = (key: string, params?: Record<string, string | number>): string => {
    const value =
      getNestedValue(dictionary, key) ?? getNestedValue(bundledFallback, key);
    return interpolate(value ?? key, params);
  };

  const setLanguage = (next: Language) => {
    usePreferencesStore.getState().updateSettings({ language: next });
    void useI18nStore.getState().load(next);
    // Persist so the choice survives a restart. Failure falls back to the
    // in-memory preference, which is still correct for this session.
    void import("../lib/settings-sync")
      .then(({ persistSettingsPatch }) => persistSettingsPatch({ language: next }))
      .catch(() => {});
  };

  return {
    t,
    language,
    activeLanguage,
    setLanguage,
    languages: LANGUAGES,
    isRtl: RTL_LANGUAGES.has(language),
  };
}

/**
 * Resolves the initial language: explicit user choice first, then the Windows
 * display locale, then English.
 */
export async function initializeI18n(preferred?: Language | null): Promise<Language> {
  const candidate =
    preferred && LANGUAGE_CODES.includes(preferred)
      ? preferred
      : detectSystemLanguage(LANGUAGE_CODES);
  await useI18nStore.getState().load(candidate);
  return candidate;
}

export { enDictionary as en, trDictionary as tr };
export type TranslationKey = string;
