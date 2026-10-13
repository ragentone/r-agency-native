import { useState } from 'react';
import { Text, View } from 'react-native';

import { useUserPassword } from '../../hooks';
import { toErrorMessage, useAuthTranslation } from '../../i18n';
import { validateReset } from '../../validation';
import { FormAlert } from './FormAlert';
import { FormField } from './FormField';
import { SubmitButton } from './SubmitButton';
import { useForm } from './use.form';

interface IProps {
  onSuccess?: (message: string) => void;
}

export const ResetPasswordForm = ({ onSuccess }: IProps) => {
  const { t, has } = useAuthTranslation();
  const { resetPassword } = useUserPassword();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm({ email: '' }, values => validateReset(values, t));

  const submit = async () => {
    setSubmitError(null);
    if (!form.touchAll() || form.submitting) return;
    form.setSubmitting(true);
    try {
      const result = await resetPassword(form.values.email.trim());
      if (!result?.success) throw new Error(t('errors.resetFailed'));
      form.reset();
      onSuccess?.(t('native.resetSuccess'));
    } catch (error) {
      setSubmitError(toErrorMessage(error, t, has, 'errors.resetFailed'));
    } finally {
      form.setSubmitting(false);
    }
  };

  return (
    <View className="gap-4">
      <Text className="text-[15px] leading-5 text-muted-foreground">
        {t('resetPasswordForm.description')}
      </Text>
      <FormAlert message={submitError} />
      <FormField
        label={t('resetPasswordForm.email')}
        placeholder={t('resetPasswordForm.emailPlaceholder')}
        icon="mail"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="send"
        onSubmitEditing={submit}
        editable={!form.submitting}
        {...form.field('email')}
      />
      <SubmitButton
        label={t('resetPasswordForm.submit')}
        pendingLabel={t('resetPasswordForm.submitting')}
        pending={form.submitting}
        onPress={submit}
      />
    </View>
  );
};
