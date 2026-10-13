import { AtSignIcon, LockIcon, MailIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { type TextInput, View } from 'react-native';
import { Text } from '@/components/ui/text';

import { useUserCreate } from '../../hooks';
import { toErrorMessage, useAuthTranslation } from '../../i18n';
import { validateCreate } from '../../validation';
import { FormAlert } from './FormAlert';
import { FormField } from './FormField';
import { SubmitButton } from './SubmitButton';
import { useForm } from './use.form';

interface IProps {
  onSuccess?: (message: string) => void;
}

export const CreateUserForm = ({ onSuccess }: IProps) => {
  const { t, has } = useAuthTranslation();
  const { createUser, emailExists, aliasExists } = useUserCreate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const form = useForm({ alias: '', email: '', password: '' }, values => validateCreate(values, t));

  // Wie die Web-App: Alias/E-Mail beim Verlassen des Feldes auf Verfügbarkeit prüfen.
  const checkAlias = async () => {
    const alias = form.values.alias.trim();
    if (alias.length >= 3 && (await aliasExists(alias))) {
      form.setFieldError('alias', t('validation.aliasExists'));
    }
  };
  const checkEmail = async () => {
    const email = form.values.email.trim();
    if (!form.errors.email && email && (await emailExists(email))) {
      form.setFieldError('email', t('validation.emailExists'));
    }
  };

  const submit = async () => {
    setSubmitError(null);
    if (!form.touchAll() || form.submitting) return;
    form.setSubmitting(true);
    try {
      const alias = form.values.alias.trim();
      const email = form.values.email.trim();
      const [aliasTaken, emailTaken] = await Promise.all([aliasExists(alias), emailExists(email)]);
      if (aliasTaken) form.setFieldError('alias', t('validation.aliasExists'));
      if (emailTaken) form.setFieldError('email', t('validation.emailExists'));
      if (aliasTaken || emailTaken) return;

      const result = await createUser({ alias, email, password: form.values.password });
      if (!result?.success) throw new Error(t('errors.createFailed'));
      form.reset();
      onSuccess?.(t('native.createSuccess'));
    } catch (error) {
      setSubmitError(toErrorMessage(error, t, has, 'errors.createFailed'));
    } finally {
      form.setSubmitting(false);
    }
  };

  const aliasField = form.field('alias');
  const emailField = form.field('email');

  return (
    <View className="gap-4">
      <Text variant="muted">{t('createForm.description')}</Text>
      <FormAlert message={submitError} />
      <View key={form.formKey} className="gap-4">
        <FormField
          label={t('createForm.alias')}
          placeholder={t('createForm.aliasPlaceholder')}
          icon={AtSignIcon}
          autoComplete="username"
          textContentType="username"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          editable={!form.submitting}
          {...aliasField}
          onBlur={() => {
            aliasField.onBlur();
            void checkAlias();
          }}
        />
        <FormField
          ref={emailRef}
          label={t('createForm.email')}
          placeholder={t('createForm.emailPlaceholder')}
          icon={MailIcon}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          editable={!form.submitting}
          {...emailField}
          onBlur={() => {
            emailField.onBlur();
            void checkEmail();
          }}
        />
        <FormField
          ref={passwordRef}
          label={t('createForm.password')}
          placeholder={t('createForm.passwordPlaceholder')}
          icon={LockIcon}
          password
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={submit}
          editable={!form.submitting}
          {...form.field('password')}
        />
      </View>
      <SubmitButton
        label={t('createForm.submit')}
        pendingLabel={t('createForm.submitting')}
        pending={form.submitting}
        onPress={submit}
      />
    </View>
  );
};
