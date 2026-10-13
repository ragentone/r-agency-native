import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text as UIText } from '@/components/ui/text';
import { authEvents } from '@/core/auth/auth.events';
import { useThemeColors } from '@/core/theme/colors';
import { AppIcon } from '@/core/ui/AppIcon';

import { useAccountTranslation } from '../i18n';

/** Konto löschen – Bestätigung + öffnet den Lösch-Dialog (Web: AccountDeleteAccordionItem). */
export const AccountDelete = () => {
  const { t } = useAccountTranslation();
  const colors = useThemeColors();
  const [confirmed, setConfirmed] = useState(false);

  return (
    <View className="gap-4">
      <View>
        <Text className="text-[15px] font-bold text-foreground">{t('delete.title')}</Text>
        <Text className="mt-1 text-[15px] leading-5 text-muted-foreground">{t('delete.description')}</Text>
      </View>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: confirmed }}
        onPress={() => setConfirmed(value => !value)}
        className="flex-row items-start gap-3 rounded-xl border border-border/50 p-3 active:bg-foreground/5"
      >
        <AppIcon name={confirmed ? 'checkbox' : 'checkboxEmpty'} size={20} color={colors.foreground} />
        <Text className="flex-1 text-[15px] font-medium leading-5 text-foreground">{t('delete.confirm')}</Text>
      </Pressable>
      <Button
        variant="destructive"
        disabled={!confirmed}
        onPress={() => void authEvents.emit('auth:user_deleted_request', undefined)}
        className="h-11 rounded-full"
      >
        <AppIcon name="trash" size={16} color="#ffffff" />
        <UIText className="font-bold">{t('delete.title')}</UIText>
      </Button>
    </View>
  );
};
