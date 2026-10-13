import { Modal, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text as UIText } from '@/components/ui/text';

import { useAuthStore } from '../auth.store';
import { useAuthTranslation } from '../i18n';
import { UserAvatar } from './UserAvatar';

interface IProps {
  active: boolean;
  onConfirm(): void;
  onAbort(): void;
}

/** Abmelden bestätigen – zeigt das aktuelle Konto (Web: AlertDialog). */
export const AuthLogoutConfirmDialog = ({ active, onConfirm, onAbort }: IProps) => {
  const { t } = useAuthTranslation();
  const userMeta = useAuthStore(state => state.userMeta);
  const displayName = userMeta?.alias || userMeta?.email || '';

  return (
    <Modal visible={active} transparent animationType="fade" onRequestClose={onAbort} statusBarTranslucent>
      <View className="flex-1 items-center justify-center px-6">
        {/* Hintergrund als eigene Ebene neben der Karte – nicht als Eltern-Element der Buttons
            (im Web wären das sonst verschachtelte <button>). */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('logout.cancel')}
          onPress={onAbort}
          className="absolute inset-0 bg-black/50"
        />

        <View
          accessibilityViewIsModal
          className="w-full max-w-sm gap-4 rounded-2xl bg-background p-6"
        >
          <View className="gap-1.5">
            <Text className="text-lg font-bold text-foreground">{t('logout.title')}</Text>
            <Text className="text-sm leading-5 text-muted-foreground">{t('logout.description')}</Text>
          </View>

          {userMeta && (
            <View className="flex-row items-center gap-3 rounded-xl border border-border/50 p-3">
              <UserAvatar name={displayName} avatarUrl={userMeta.avatarUrl} size={40} />
              <View className="flex-1">
                <Text numberOfLines={1} className="text-sm font-bold text-foreground">
                  {userMeta.alias}
                </Text>
                <Text numberOfLines={1} className="text-sm text-muted-foreground">
                  {userMeta.email}
                </Text>
              </View>
            </View>
          )}

          <View className="gap-2.5">
            <Button variant="destructive" onPress={onConfirm} className="h-11 rounded-full">
              <UIText>{t('logout.confirm')}</UIText>
            </Button>
            <Button variant="outline" onPress={onAbort} className="h-11 rounded-full">
              <UIText>{t('logout.cancel')}</UIText>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};
