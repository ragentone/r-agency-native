import { LockIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';

import { Spinner } from '@/components/app/spinner';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

import { authEvents } from '../auth.events';
import { useUserDelete } from '../hooks';
import { toErrorMessage, useAuthTranslation } from '../i18n';
import { FormAlert } from './forms/FormAlert';
import { FormField } from './forms/FormField';
import { useAuth } from './use.auth';

const COUNTDOWN_SECONDS = 5;

/**
 * Konto endgültig löschen (Web: ExtensionDeleteUser) als Reusables `AlertDialog`.
 * Öffnet sich über `auth:user_deleted_request`; Bestätigen erst nach 5 s, bei Passwort-Konten mit Passwort.
 */
export const AuthDeleteUserDialog = () => {
  const { t, has } = useAuthTranslation();
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
    <AlertDialog open={open} onOpenChange={next => !progress && setOpen(next)}>
      <AlertDialogContent className="w-[90vw] max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">{t('deleteDialog.title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('deleteDialog.description')}</AlertDialogDescription>
        </AlertDialogHeader>
        <FormAlert message={error} />
        {needsPassword && (
          <FormField
            label={t('deleteDialog.password')}
            placeholder={t('deleteUserForm.passwordPlaceholder')}
            icon={LockIcon}
            password
            autoComplete="current-password"
            editable={countdown <= 0 && !progress}
            onChangeText={setPassword}
          />
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={progress}>
            <Text>{t('deleteDialog.cancel')}</Text>
          </AlertDialogCancel>
          <Button variant="destructive" onPress={confirm} disabled={disabled}>
            {progress && <Spinner />}
            <Text>
              {countdown > 0 ? `${t('deleteDialog.confirm')} (${countdown})` : t('deleteDialog.confirm')}
            </Text>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
