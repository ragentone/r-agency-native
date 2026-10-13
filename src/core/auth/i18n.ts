import { type Translate, useTranslator } from '@/core/i18n/create.translator';

import de from './locales/de.json';
import en from './locales/en.json';
import ru from './locales/ru.json';

const dictionaries = { de, en, ru };

/** Übersetzungen des Auth-Moduls (Namespace `auth` der Web-App). */
export const useAuthTranslation = () => useTranslator(dictionaries);

/**
 * Fehlermeldung für die Anzeige: Backend-Fehler kommen als Übersetzungs-Key
 * (z. B. `user_invalid_password`) – dann übersetzen, sonst Text oder Fallback.
 */
export const toErrorMessage = (
  error: unknown,
  t: Translate,
  has: (key: string) => boolean,
  fallbackKey: string
): string => {
  const candidates: unknown[] = [];
  const graphQLErrors = (error as { graphQLErrors?: unknown[] })?.graphQLErrors;
  if (Array.isArray(graphQLErrors)) {
    for (const item of graphQLErrors) {
      const entry = item as { message?: string; translateKey?: string; extensions?: Record<string, unknown> };
      candidates.push(entry.translateKey, entry.extensions?.translateKey, entry.extensions?.code, entry.message);
    }
  }
  candidates.push((error as { message?: string })?.message, typeof error === 'string' ? error : undefined);

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate && has(candidate)) return t(candidate);
  }
  const message = (error as { message?: string })?.message ?? (typeof error === 'string' ? error : '');
  return message || t(fallbackKey);
};
