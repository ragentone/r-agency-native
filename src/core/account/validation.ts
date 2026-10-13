import type { Translate } from '@/core/i18n/create.translator';

/** Max. sichtbare Zeichen von "Über mich" (HTML-Tags zählen nicht) – wie in der Web-App. */
export const ACCOUNT_DESCRIPTION_MAX_LENGTH = 500;
export const ALIAS_MIN = 3;
export const ALIAS_MAX = 16;

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};

/** HTML → lesbarer Text (Absätze/Zeilenumbrüche bleiben erhalten). */
export const htmlToText = (html: string | null | undefined): string => {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]*>/g, '')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, entity => ENTITIES[entity] ?? entity)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Text → einfaches HTML (ein <p> pro Absatz, <br> für einzelne Umbrüche). */
export const textToHtml = (text: string): string => {
  const trimmed = text.trim();
  if (!trimmed) return '';
  return trimmed
    .split(/\n{2,}/)
    .map(paragraph => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');
};

/** Sichtbare Textlänge eines HTML-Strings (wie der Zeichenzähler des Web-Editors). */
export const htmlTextLength = (html: string | null | undefined): number =>
  html ? html.replace(/<[^>]*>/g, '').replace(/&(amp|lt|gt|quot|#39|nbsp);/g, 'x').length : 0;

/** Enthält das HTML Formatierungen, die als reiner Text verloren gingen? */
export const hasRichFormatting = (html: string | null | undefined): boolean =>
  Boolean(html && /<(strong|b|em|i|u|s|strike|ul|ol|li|h[1-6]|a|blockquote|code)\b/i.test(html));

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** `true` für ein echtes Datum im Format JJJJ-MM-TT zwischen 1900 und heute. */
export const isValidBirthday = (value: string): boolean => {
  const match = ISO_DATE.exec(value.trim());
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return false;
  return y >= 1900 && date.getTime() <= Date.now();
};

export interface IProfileValues {
  alias: string;
  firstname: string;
  lastname: string;
  gender: string;
  birthday: string;
  description: string;
}

export const validateProfile = (values: IProfileValues, t: Translate) => {
  const errors: Partial<Record<keyof IProfileValues, string>> = {};
  const alias = values.alias.trim();
  if (!alias) errors.alias = t('validation.aliasRequired');
  else if (alias.length < ALIAS_MIN) errors.alias = t('validation.aliasMin', { min: ALIAS_MIN });
  else if (alias.length > ALIAS_MAX) errors.alias = t('validation.aliasMax', { max: ALIAS_MAX });
  if (!values.gender) errors.gender = t('validation.genderRequired');
  if (values.birthday.trim() && !isValidBirthday(values.birthday)) {
    errors.birthday = t('native.birthdayInvalid');
  }
  if (values.description.length > ACCOUNT_DESCRIPTION_MAX_LENGTH) {
    errors.description = t('validation.descriptionMax', { max: ACCOUNT_DESCRIPTION_MAX_LENGTH });
  }
  return errors;
};
