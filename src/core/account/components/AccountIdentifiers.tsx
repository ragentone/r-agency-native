import { Share2Icon } from 'lucide-react-native';
import { getDeviceId, getMeshClient } from 'r-agency-mesh-client-v1/release';
import { useEffect, useState } from 'react';
import { Share, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';

import { useAccountTranslation } from '../i18n';

/** Geräte-ID dieser Installation – vom Mesh-Client, sonst über die Geräte-API. */
const useDeviceId = () => {
  const [deviceId, setDeviceId] = useState<string | null>(() => {
    try {
      return getMeshClient().deviceId() ?? null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(deviceId === null);

  useEffect(() => {
    if (deviceId !== null) return;
    let alive = true;
    getDeviceId()
      .then(id => alive && setDeviceId(id || null))
      .catch(error => console.warn('[account] device id failed', error))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [deviceId]);

  return { deviceId, loading };
};

const IdRow = ({ label, value, loading }: { label: string; value: string | null; loading?: boolean }) => {
  const { t } = useAccountTranslation();
  return (
    <Card className="flex-row items-center gap-2 rounded-xl py-2 pl-3 pr-1.5 shadow-none">
      <View className="flex-1">
        <Text variant="muted" className="text-xs font-medium">
          {label}
        </Text>
        {loading ? (
          <Skeleton className="mt-1 h-4 w-40 rounded-full" />
        ) : (
          <Text selectable variant="code" className="mt-1 self-start bg-transparent px-0 text-[13px] font-normal">
            {value ?? t('ids.unavailable')}
          </Text>
        )}
      </View>
      <Button
        variant="ghost"
        size="icon"
        accessibilityLabel={`${label} – ${t('native.shareId')}`}
        disabled={!value}
        onPress={() => value && void Share.share({ message: value })}
        className="rounded-full"
      >
        <Icon as={Share2Icon} size={16} className="text-muted-foreground" />
      </Button>
    </Card>
  );
};

/** Nutzer-ID und Geräte-ID, z. B. für den Support (Web: AccountIdentifiersAccordionItem). */
export const AccountIdentifiers = ({ userId }: { userId: string }) => {
  const { t } = useAccountTranslation();
  const { deviceId, loading } = useDeviceId();
  return (
    <View className="gap-2">
      <IdRow label={t('ids.userId')} value={userId || null} />
      <IdRow label={t('ids.deviceId')} value={deviceId} loading={loading && !deviceId} />
      <Text variant="muted" className="px-1 pt-1 text-xs">
        {t('ids.hint')}
      </Text>
    </View>
  );
};
