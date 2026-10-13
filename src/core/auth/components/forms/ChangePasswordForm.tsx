import { KeyRoundIcon, LockIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { type TextInput, View } from 'react-native';

import { useUserPassword } from '../../hooks';
import { toErrorMessage, useAuthTranslation } from '../../i18n';
import { validatePasswordChange } from '../../validation';
import { useAuth } from '../use.auth';
import { FormAlert } from './FormAlert';
import { FormField } from './FormField';
import { SubmitButton } from './SubmitButton';
import { useForm } from './use.form';

interface IProps {
  userId?: string;
  onSuccess?: () => void;
}

/** Passwort ändern (Web: ChangePasswordForm). */
export const ChangePasswordForm = ({ userId, onSuccess }: IProps) => {
  const { t, has } = useAuthTranslation();
  const { userMeta } = useAuth();
  const { changePassword } = useUserPassword();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const newRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const form = useForm({ currentPassword: '', newPassword: '', confirmPassword: '' }, values =>
    validatePasswordChange(values, t)
  );

  const submit = async () => {
    setError(null);
    setSuccess(null);
    if (!form.touchAll() || form.submitting) return;
    const targetUserId = userId || userMeta?.id || '';
    if (!targetUserId) {
      setError(t('errors.not_authorized'));
      return;
    }
    form.setSubmitting(true);
    try {
      const result = await changePassword({
        userId: targetUserId,
        currentPassword: form.values.currentPassword,
        newPassword: form.values.newPassword,
      });
      if (!result?.success) throw new Error(t('errors.passwordChangeFailed'));
      form.reset();
      setSuccess(t('changePasswordForm.success'));
      onSuccess?.();
    } catch (err) {
      setError(toErrorMessage(err, t, has, 'errors.passwordChangeFailed'));
    } finally {
      form.setSubmitting(false);
    }
  };

  return (
    <View className="gap-4">
      <FormAlert message={error} />
      <FormAlert message={success} variant="success" />
      <View key={form.formKey} className="gap-4">
        <FormField
          label={t('changePasswordForm.currentPassword')}
          placeholder={t('changePasswordForm.currentPasswordPlaceholder')}
          icon={LockIcon}
          password
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="next"
          onSubmitEditing={() => newRef.current?.focus()}
          editable={!form.submitting}
          {...form.field('currentPassword')}
        />
        <FormField
          ref={newRef}
          label={t('changePasswordForm.newPassword')}
          placeholder={t('changePasswordForm.newPasswordPlaceholder')}
          icon={KeyRoundIcon}
          password
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()}
          editable={!form.submitting}
          {...form.field('newPassword')}
        />
        <FormField
          ref={confirmRef}
          label={t('changePasswordForm.confirmPassword')}
          placeholder={t('changePasswordForm.confirmPasswordPlaceholder')}
          icon={KeyRoundIcon}
          password
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={submit}
          editable={!form.submitting}
          {...form.field('confirmPassword')}
        />
      </View>
      <SubmitButton
        label={t('changePasswordForm.submit')}
        pendingLabel={t('changePasswordForm.submitting')}
        pending={form.submitting}
        onPress={submit}
      />
    </View>
  );
};
