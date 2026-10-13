import { useCallback, useRef, useState } from 'react';

import type { FieldErrors } from '../../validation';

/**
 * Minimaler Formular-State (statt Formik): Werte, Fehler, "berührt", Absenden.
 * Fehler werden – wie bei Formik – erst nach Verlassen des Feldes bzw. beim Absenden gezeigt.
 *
 * Die Felder sind bewusst *unkontrolliert* (`defaultValue` statt `value`): Auf Android schreibt
 * ein kontrolliertes TextInput den Wert bei jedem Tastendruck zurück ins native Feld und kann so
 * Zeichen verlieren, mit denen die Tastatur ein Wort abschließt (z. B. "@" oder "."). Der Text
 * bleibt im nativen Feld, React liest ihn nur mit. Zum Leeren wird `formKey` erhöht – das Formular
 * hängt ihn als `key` an die Felder und erzeugt sie neu.
 */
export const useForm = <T extends Record<string, string>>(
  initialValues: T,
  validate: (values: T) => FieldErrors<T>
) => {
  // Startwerte festhalten: `defaultValue` darf sich nach dem ersten Rendern nicht ändern.
  const initialRef = useRef(initialValues);
  const [values, setValues] = useState<T>(initialValues);
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [extraErrors, setExtraErrors] = useState<FieldErrors<T>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);

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
    defaultValue: initialRef.current[name],
    onChangeText: (text: string) => setValue(name, text),
    onBlur: () => blur(name),
    error: errorOf(name),
  });

  const reset = () => {
    setValues(initialRef.current);
    setTouched({});
    setExtraErrors({});
    setFormKey(key => key + 1);
  };

  return {
    /** Als `key` um die Felder legen – ändert sich bei `reset()`. */
    formKey,
    values,
    errors,
    field,
    /** Wert direkt setzen (für Nicht-Textfelder wie Auswahl-Chips). */
    setValue,
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
