import { usePreferencesStore } from "../stores/usePreferencesStore";
import { Language } from "../types";
import { tr, TranslationDictionary } from "./locales/tr";
import { en } from "./locales/en";

const dictionaries: Record<Language, TranslationDictionary> = {
  tr,
  en,
};

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<TranslationDictionary>;

function getNestedValue(obj: any, path: string): string {
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return path;
    current = current[part];
  }
  return typeof current === "string" ? current : path;
}

export function translate(
  lang: Language,
  key: string,
  params?: Record<string, string | number>
): string {
  const dictionary = dictionaries[lang] || dictionaries.tr;
  let text = getNestedValue(dictionary, key);

  if (params) {
    Object.entries(params).forEach(([paramKey, paramVal]) => {
      text = text.replaceAll(`{${paramKey}}`, String(paramVal));
    });
  }

  return text;
}

export function useTranslation() {
  const language = usePreferencesStore((state) => state.language);
  const setLanguage = usePreferencesStore((state) => state.setLanguage);

  const t = (key: TranslationKey | string, params?: Record<string, string | number>): string => {
    return translate(language, key, params);
  };

  return {
    t,
    language,
    setLanguage,
  };
}

export { tr, en };
