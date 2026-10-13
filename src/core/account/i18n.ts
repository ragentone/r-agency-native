import { useTranslator } from '@/core/i18n/create.translator';

import de from './locales/de.json';
import en from './locales/en.json';
import ru from './locales/ru.json';

const dictionaries = { de, en, ru };

/** Übersetzungen des Account-Moduls (Namespace `account` der Web-App). */
export const useAccountTranslation = () => useTranslator(dictionaries);
