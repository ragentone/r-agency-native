import { useCallback, useMemo } from 'react';

/**
 * Kleine i18n-Hilfe (statt i18next), kompatibel zu den Locale-Dateien der Web-App:
 * verschachtelte Keys (`form.title`), Platzhalter (`{{name}}`), Plural (`key_one`/`key_other`)
 * und `defaultValue`. Sprache vom Gerät, Fallback Englisch.
 */

type Dictionary = Record<string, unknown>;
export type TranslateOptions = Record<string, unknown> & { defaultValue?: string; count?: number };
export type Translate = (key: string, options?: TranslateOptions) => string;

export const detectLanguage = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale.split('-')[0].toLowerCase();
  } catch {
    return 'en';
  }
};

const lookup = (dictionary: Dictionary | undefined, key: string): unknown => {
  if (!dictionary) return undefined;
  // Flache Keys mit Punkt (z. B. "admin.user_updated") zuerst.
  if (key in dictionary) return dictionary[key];
  return key
    .split('.')
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === 'object' ? (node as Dictionary)[part] : undefined,
      dictionary
    );
};

const interpolate = (text: string, options?: TranslateOptions) =>
  options
    ? text.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name: string) =>
        options[name] !== undefined ? String(options[name]) : match
      )
    : text;

export const createTranslator = (dictionaries: Record<string, Dictionary>, language: string) => {
  const primary = dictionaries[language];
  const fallback = dictionaries.en;

  const resolve = (key: string): unknown => lookup(primary, key) ?? lookup(fallback, key);

  const t: Translate = (key, options) => {
    let value: unknown;
    if (typeof options?.count === 'number') {
      value = resolve(`${key}_${options.count === 1 ? 'one' : 'other'}`);
    }
    value ??= resolve(key);
    if (typeof value !== 'string') return options?.defaultValue ?? key;
    return interpolate(value, options);
  };

  /** Prüft, ob es für einen Key (z. B. Backend-Fehlercode) eine Übersetzung gibt. */
  const has = (key: string) => typeof resolve(key) === 'string';

  /** Liste von Texten (Arrays in den Locale-Dateien, z. B. Begrüßungs-Varianten). */
  const list = (key: string): string[] => {
    const value = resolve(key);
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  };

  return { t, has, list, language };
};

export const useTranslator = (dictionaries: Record<string, Dictionary>) => {
  const language = useMemo(detectLanguage, []);
  const translator = useMemo(
    () => createTranslator(dictionaries, language),
    [dictionaries, language]
  );
  const t = useCallback<Translate>((key, options) => translator.t(key, options), [translator]);
  return { t, has: translator.has, list: translator.list, language };
};
