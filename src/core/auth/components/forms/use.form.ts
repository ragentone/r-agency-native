import { useCallback, useState } from 'react';

import type { FieldErrors } from '../../validation';

/**
 * Minimaler Formular-State (statt Formik): Werte, Fehler, "berührt", Absenden.
 * Fehler werden – wie bei Formik – erst nach Verlassen des Feldes bzw. beim Absenden gezeigt.
 */
export const useForm = <T extends Record<string, string>>(
  initialValues: T,
  validate: (values: T) => FieldErrors<T>
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [extraErrors, setExtraErrors] = useState<FieldErrors<T>>({});
  const [submitting, setSubmitting] = useState(false);

  const errors: FieldErrors<T> = { ...validate(values), ...extraErrors };

  const setValue = useCallback((name: keyof T, value: string) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setExtraErrors(prev => ({ ...prev, [name]: undefined }));
  }, []);

  const blur = useCallback((name: keyof T) => setTouched(prev => ({ ...prev, [name]: true })), []);

  const errorOf = (name: keyof T) => (touched[name] ? errors[name] : undefined);

  /** Alle Felder als berührt markieren; `true`, wenn gültig. */
  const touchAll = () => {
    setTouched(Object.fromEntries(Object.keys(values).map(key => [key, true])) as Record<keyof T, boolean>);
    return Object.values(validate(values)).every(error => !error);
  };

  const field = (name: keyof T) => ({
    value: values[name],
    onChangeText: (text: string) => setValue(name, text),
    onBlur: () => blur(name),
    error: errorOf(name),
  });

  const reset = () => {
    setValues(initialValues);
    setTouched({});
    setExtraErrors({});
  };

  return {
    values,
    errors,
    field,
    touchAll,
    submitting,
    setSubmitting,
    /** Fehler von außen (z. B. "E-Mail existiert bereits" vom Server). */
    setFieldError: (name: keyof T, message: string | undefined) => {
      setExtraErrors(prev => ({ ...prev, [name]: message }));
      setTouched(prev => ({ ...prev, [name]: true }));
    },
    reset,
  };
};
