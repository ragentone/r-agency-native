import { Trash2Icon } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Icon } from '@/components/ui/icon';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { authEvents } from '@/core/auth/auth.events';

import { useAccountTranslation } from '../i18n';

/** Konto löschen – Bestätigung (Reusables `Checkbox`) + öffnet den Lösch-Dialog. */
export const AccountDelete = () => {
  const { t } = useAccountTranslation();
  const [confirmed, setConfirmed] = useState(false);

  return (
    <View className="gap-4">
      <View>
        <Text className="font-bold">{t('delete.title')}</Text>
        <Text variant="muted" className="mt-1 text-[15px] leading-5">
          {t('delete.description')}
        </Text>
      </View>
      <Card className="flex-row items-start gap-3 rounded-xl p-3 shadow-none">
        <Checkbox
          aria-labelledby="account-delete-confirm"
          checked={confirmed}
          onCheckedChange={setConfirmed}
          className="mt-0.5"
        />
        <Label nativeID="account-delete-confirm" onPress={() => setConfirmed(value => !value)} className="flex-1 leading-5">
          {t('delete.confirm')}
        </Label>
      </Card>
      <Button
        variant="destructive"
        disabled={!confirmed}
        onPress={() => void authEvents.emit('auth:user_deleted_request', undefined)}
        className="h-11 rounded-full sm:h-11"
      >
        <Icon as={Trash2Icon} size={16} className="text-white" />
        <Text className="font-bold">{t('delete.title')}</Text>
      </Button>
    </View>
  );
};
