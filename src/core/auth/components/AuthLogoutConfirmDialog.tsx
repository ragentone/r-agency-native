import { View } from 'react-native';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';

import { useAuthStore } from '../auth.store';
import { useAuthTranslation } from '../i18n';
import { UserAvatar } from './UserAvatar';

interface IProps {
  active: boolean;
  onConfirm(): void;
  onAbort(): void;
}

/** Abmelden bestätigen – zeigt das aktuelle Konto (Reusables `AlertDialog`). */
export const AuthLogoutConfirmDialog = ({ active, onConfirm, onAbort }: IProps) => {
  const { t } = useAuthTranslation();
  const userMeta = useAuthStore(state => state.userMeta);
  const displayName = userMeta?.alias || userMeta?.email || '';

  return (
    <AlertDialog open={active} onOpenChange={open => !open && onAbort()}>
      <AlertDialogContent className="w-[90vw] max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('logout.title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('logout.description')}</AlertDialogDescription>
        </AlertDialogHeader>

        {userMeta && (
          <Card className="flex-row items-center gap-3 rounded-xl p-3 shadow-none">
            <UserAvatar name={displayName} avatarUrl={userMeta.avatarUrl} size={40} />
            <View className="flex-1">
              <Text numberOfLines={1} className="text-sm font-bold">
                {userMeta.alias}
              </Text>
              <Text numberOfLines={1} variant="muted">
                {userMeta.email}
              </Text>
            </View>
          </Card>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onPress={onAbort}>
            <Text>{t('logout.cancel')}</Text>
          </AlertDialogCancel>
          <AlertDialogAction onPress={onConfirm} className="bg-destructive">
            <Text className="text-white">{t('logout.confirm')}</Text>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
