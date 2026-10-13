import type { Translate } from '@/core/i18n/create.translator';

/**
 * Validierung der Formulare – gleiche Regeln wie die Yup-Schemas der Web-App
 * (src/core/auth/validation). Gibt pro Feld die erste Fehlermeldung zurück.
 */

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 6;
const ALIAS_MIN = 3;

export const isValidEmail = (value: string) => EMAIL.test(value.trim());

const email = (value: string, t: Translate) => {
  if (!value.trim()) return t('validation.emailRequired');
  if (!isValidEmail(value)) return t('validation.emailInvalid');
  return undefined;
};

const password = (value: string, t: Translate) => {
  if (!value) return t('validation.passwordRequired');
  if (value.length < PASSWORD_MIN) return t('validation.passwordMin', { min: PASSWORD_MIN });
  return undefined;
};

const clean = <T>(errors: FieldErrors<T>): FieldErrors<T> =>
  Object.fromEntries(Object.entries(errors).filter(([, v]) => v)) as FieldErrors<T>;

export interface ILoginValues {
  email: string;
  password: string;
}

export const validateLogin = (values: ILoginValues, t: Translate) =>
  clean<ILoginValues>({ email: email(values.email, t), password: password(values.password, t) });

export interface ICreateValues {
  alias: string;
  email: string;
  password: string;
}

export const validateCreate = (values: ICreateValues, t: Translate) =>
  clean<ICreateValues>({
    alias: !values.alias.trim()
      ? t('validation.aliasRequired')
      : values.alias.trim().length < ALIAS_MIN
        ? t('validation.aliasMin', { min: ALIAS_MIN })
        : undefined,
    email: email(values.email, t),
    password: password(values.password, t),
  });

export interface IResetValues {
  email: string;
}

export const validateReset = (values: IResetValues, t: Translate) =>
  clean<IResetValues>({ email: email(values.email, t) });

export interface IPasswordCreateValues {
  password: string;
  confirmPassword: string;
}

export const validatePasswordCreate = (values: IPasswordCreateValues, t: Translate) =>
  clean<IPasswordCreateValues>({
    password: password(values.password, t),
    confirmPassword: !values.confirmPassword
      ? t('validation.confirmPasswordRequired')
      : values.confirmPassword !== values.password
        ? t('validation.passwordMatch')
        : undefined,
  });

export interface IPasswordChangeValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const validatePasswordChange = (values: IPasswordChangeValues, t: Translate) =>
  clean<IPasswordChangeValues>({
    currentPassword: !values.currentPassword ? t('validation.currentPasswordRequired') : undefined,
    newPassword: password(values.newPassword, t),
    confirmPassword: !values.confirmPassword
      ? t('validation.confirmPasswordRequired')
      : values.confirmPassword !== values.newPassword
        ? t('validation.passwordMatch')
        : undefined,
  });
