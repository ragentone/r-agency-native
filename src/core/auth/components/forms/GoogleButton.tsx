import { useState } from 'react';
import { ActivityIndicator, Text as RNText } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/core/theme/colors';

import { GoogleAuthCancelledError, isGoogleAuthConfigured } from '../../google.auth';
import { toErrorMessage, useAuthTranslation } from '../../i18n';
import { useAuth } from '../use.auth';

interface IProps {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export const GoogleButton = ({ onSuccess, onError }: IProps) => {
  const { t, has } = useAuthTranslation();
  const colors = useThemeColors();
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
      className="h-12 w-full rounded-full"
    >
      {pending ? (
        <ActivityIndicator size="small" color={colors.foreground} />
      ) : (
        <RNText style={{ fontSize: 17, fontWeight: '800', color: '#4285F4' }}>G</RNText>
      )}
      <Text className="text-[15px] font-bold">
        {pending ? t('form.googleSubmitting') : t('form.google')}
      </Text>
    </Button>
  );
};
