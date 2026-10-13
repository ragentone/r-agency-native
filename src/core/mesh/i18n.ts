import { useCallback, useMemo } from 'react';

import de from './locales/de.json';
import en from './locales/en.json';
import ru from './locales/ru.json';

/**
 * Minimale Übersetzung für das Mesh-Modul (Namespace `mesh` der Web-App).
 * Sprache kommt vom Gerät; Fallback ist Englisch.
 */

type Dictionary = typeof en;
const dictionaries: Record<string, Dictionary> = { de, en, ru };

const detectLanguage = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale.split('-')[0].toLowerCase();
  } catch {
    return 'en';
  }
};

const lookup = (dictionary: unknown, key: string): string | undefined => {
  const value = key
    .split('.')
    .reduce<unknown>(
      (node, part) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined),
      dictionary
    );
  return typeof value === 'string' ? value : undefined;
};

export const useMeshTranslation = () => {
  const language = useMemo(detectLanguage, []);
  const t = useCallback(
    (key: string) => lookup(dictionaries[language], key) ?? lookup(en, key) ?? key,
    [language]
  );
  return { t, language };
};
