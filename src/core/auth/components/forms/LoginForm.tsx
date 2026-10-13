import { useRef, useState } from 'react';
import { Text, type TextInput, View } from 'react-native';

import { useAuthTranslation, toErrorMessage } from '../../i18n';
import { validateLogin } from '../../validation';
import { useAuth } from '../use.auth';
import { FormAlert } from './FormAlert';
import { FormField } from './FormField';
import { GoogleButton } from './GoogleButton';
import { SubmitButton } from './SubmitButton';
import { useForm } from './use.form';

interface IProps {
  onSuccess?: () => void;
  showGoogleAuth?: boolean;
}

export const LoginForm = ({ onSuccess, showGoogleAuth = true }: IProps) => {
  const { t, has } = useAuthTranslation();
  const { login, isLoggingIn } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);
  const form = useForm({ email: '', password: '' }, values => validateLogin(values, t));
  const pending = form.submitting || isLoggingIn;

  const submit = async () => {
    setSubmitError(null);
    if (!form.touchAll() || pending) return;
    form.setSubmitting(true);
    try {
      await login({
        email: form.values.email.trim(),
        password: form.values.password,
        userType: 'default',
      });
      onSuccess?.();
    } catch (error) {
      setSubmitError(toErrorMessage(error, t, has, 'errors.loginFailed'));
    } finally {
      form.setSubmitting(false);
    }
  };

  return (
    <View className="gap-4">
      <Text className="text-[15px] leading-5 text-muted-foreground">{t('form.description')}</Text>
      <FormAlert message={submitError} />
      <FormField
        label={t('form.email')}
        placeholder={t('form.emailPlaceholder')}
        icon="mail"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        editable={!pending}
        {...form.field('email')}
      />
      <FormField
        ref={passwordRef}
        label={t('form.password')}
        placeholder={t('form.passwordPlaceholder')}
        icon="lock"
        password
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
        editable={!pending}
        {...form.field('password')}
      />
      <SubmitButton
        label={t('form.submit')}
        pendingLabel={t('form.submitting')}
        pending={pending}
        onPress={submit}
      />

      {showGoogleAuth && (
        <>
          <View className="flex-row items-center gap-3">
            <View className="h-px flex-1 bg-border" />
            <Text className="text-[15px] text-muted-foreground">{t('form.or')}</Text>
            <View className="h-px flex-1 bg-border" />
          </View>
          <GoogleButton onSuccess={onSuccess} onError={setSubmitError} />
        </>
      )}
    </View>
  );
};
