import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text as UIText } from '@/components/ui/text';
import { useThemeColors } from '@/core/theme/colors';

import { authEvents } from '../auth.events';
import { useUserDelete } from '../hooks';
import { toErrorMessage, useAuthTranslation } from '../i18n';
import { FormAlert } from './forms/FormAlert';
import { FormField } from './forms/FormField';
import { useAuth } from './use.auth';

const COUNTDOWN_SECONDS = 5;

/**
 * Konto endgültig löschen (Web: ExtensionDeleteUser). Öffnet sich über das Event
 * `auth:user_deleted_request`; Bestätigen erst nach 5 s, bei Passwort-Konten mit Passwort.
 */
export const AuthDeleteUserDialog = () => {
  const { t, has } = useAuthTranslation();
  const colors = useThemeColors();
  const { userMeta, destroy } = useAuth();
  const { deleteUser } = useUserDelete();
  const [open, setOpen] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [password, setPassword] = useState('');
  const [progress, setProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const needsPassword = userMeta?.userType === 'default';

  useEffect(
    () =>
      authEvents.on('auth:user_deleted_request', () => {
        setCountdown(COUNTDOWN_SECONDS);
        setPassword('');
        setError(null);
        setOpen(true);
      }),
    []
  );

  useEffect(() => {
    if (!open || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(value => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [open, countdown]);

  const close = useCallback(() => {
    if (!progress) setOpen(false);
  }, [progress]);

  const confirm = async () => {
    setError(null);
    setProgress(true);
    try {
      const result = await deleteUser(password);
      if (!result?.success) throw new Error(t('errors.deleteFailed'));
      setOpen(false);
      destroy(); // → expo-router leitet auf den Login um
    } catch (err) {
      setError(toErrorMessage(err, t, has, 'errors.deleteFailed'));
    } finally {
      setProgress(false);
    }
  };

  if (!userMeta) return null;
  const disabled = countdown > 0 || progress || (needsPassword && !password);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
      <View className="flex-1 items-center justify-center px-6">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('deleteDialog.cancel')}
          onPress={close}
          className="absolute inset-0 bg-black/50"
        />
        <View accessibilityViewIsModal className="w-full max-w-sm gap-4 rounded-2xl bg-background p-6">
          <View className="gap-1.5">
            <Text className="text-lg font-bold text-destructive">{t('deleteDialog.title')}</Text>
            <Text className="text-sm leading-5 text-muted-foreground">{t('deleteDialog.description')}</Text>
          </View>
          <FormAlert message={error} />
          {needsPassword && (
            <FormField
              label={t('deleteDialog.password')}
              placeholder={t('deleteUserForm.passwordPlaceholder')}
              icon="lock"
              password
              autoComplete="current-password"
              editable={countdown <= 0 && !progress}
              onChangeText={setPassword}
            />
          )}
          <View className="gap-2.5">
            <Button variant="destructive" onPress={confirm} disabled={disabled} className="h-11 rounded-full">
              {progress && <ActivityIndicator size="small" color="#fff" />}
              <UIText>
                {countdown > 0 ? `${t('deleteDialog.confirm')} (${countdown})` : t('deleteDialog.confirm')}
              </UIText>
            </Button>
            <Button variant="outline" onPress={close} disabled={progress} className="h-11 rounded-full">
              <UIText style={{ color: colors.foreground }}>{t('deleteDialog.cancel')}</UIText>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};
