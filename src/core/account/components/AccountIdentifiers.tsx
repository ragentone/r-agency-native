import { getDeviceId, getMeshClient } from 'r-agency-mesh-client-v1/release';
import { useEffect, useState } from 'react';
import { Pressable, Share, Text, View } from 'react-native';

import { useThemeColors } from '@/core/theme/colors';
import { AppIcon } from '@/core/ui/AppIcon';
import { MONO_FONT } from '@/core/mesh/components/mesh.ui';

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
  const colors = useThemeColors();
  return (
    <View className="flex-row items-center gap-2 rounded-xl border border-border/50 py-2 pl-3 pr-1.5">
      <View className="flex-1">
        <Text className="text-xs font-medium leading-4 text-muted-foreground">{label}</Text>
        {loading ? (
          <View className="mt-1 h-4 w-40 rounded-full bg-foreground/10" />
        ) : (
          <Text
            selectable
            className={value ? 'mt-0.5 text-[13px] leading-5 text-foreground' : 'mt-0.5 text-[13px] text-muted-foreground'}
            style={{ fontFamily: MONO_FONT }}
          >
            {value ?? t('ids.unavailable')}
          </Text>
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} – ${t('native.shareId')}`}
        disabled={!value}
        onPress={() => value && void Share.share({ message: value })}
        className="h-10 w-10 items-center justify-center rounded-full active:bg-foreground/10 disabled:opacity-40"
      >
        <AppIcon name="share" size={16} color={colors.muted} />
      </Pressable>
    </View>
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
      <Text className="px-1 pt-1 text-xs leading-4 text-muted-foreground">{t('ids.hint')}</Text>
    </View>
  );
};
