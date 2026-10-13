import { useState } from 'react';

import { Spinner } from '@/components/app/spinner';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

import { GoogleAuthCancelledError, isGoogleAuthConfigured } from '../../google.auth';
import { toErrorMessage, useAuthTranslation } from '../../i18n';
import { useAuth } from '../use.auth';

interface IProps {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export const GoogleButton = ({ onSuccess, onError }: IProps) => {
  const { t, has } = useAuthTranslation();
  const { loginWithGoogle, isLoggingIn } = useAuth();
  const [pending, setPending] = useState(false);
  const busy = pending || isLoggingIn;

  const handlePress = async () => {
    if (busy) return;
    if (!isGoogleAuthConfigured()) {
      onError?.(t('native.googleNotConfigured'));
      return;
    }
    setPending(true);
    try {
      const result = await loginWithGoogle();
      if (result?.success) onSuccess?.();
      else onError?.(t('errors.googleAuthFailed'));
    } catch (error) {
      if (error instanceof GoogleAuthCancelledError) onError?.(t('native.googleCancelled'));
      else onError?.(toErrorMessage(error, t, has, 'errors.googleAuthFailed'));
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      variant="outline"
      onPress={handlePress}
      disabled={busy}
      accessibilityState={{ busy: pending }}
      className="h-12 w-full rounded-full sm:h-12"
    >
      {pending ? <Spinner /> : <Text className="text-lg font-extrabold text-[#4285F4]">G</Text>}
      <Text className="font-bold">{pending ? t('form.googleSubmitting') : t('form.google')}</Text>
    </Button>
  );
};
