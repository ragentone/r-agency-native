import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { useAuth } from '@/core/auth/components/use.auth';
import { UserAvatar } from '@/core/auth/components/UserAvatar';
import { useThemeColors } from '@/core/theme/colors';
import { AppIcon } from '@/core/ui/AppIcon';

import { useAccountTranslation } from '../i18n';
import type { IUserAccount } from '../types';

/** Profilkopf im X-Stil: Titelbild, überlappender Avatar, Name, @Alias (Web: AccountProfileCard). */
export const AccountProfileCard = ({ account }: { account: IUserAccount }) => {
  const { t } = useAccountTranslation();
  const colors = useThemeColors();
  const { userMeta } = useAuth();
  const teaserUrl = userMeta?.teaserUrl;
  const fullName = [account.details?.firstname, account.details?.lastname].filter(Boolean).join(' ');

  return (
    <View>
      {/* Titelbild (Banner) */}
      <View className="aspect-[3/1] w-full bg-foreground/5">
        {teaserUrl ? (
          <Image
            source={{ uri: teaserUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            accessibilityLabel={t('teaser.alt')}
          />
        ) : null}
      </View>

      <View className="px-4 pb-2">
        <View className="-mt-12 mb-3 self-start rounded-full border-4 border-background">
          <UserAvatar name={account.alias} avatarUrl={account.avatarUrl} size={88} />
        </View>
        <View className="flex-row items-center gap-1.5">
          <Text numberOfLines={1} className="flex-shrink text-[26px] font-extrabold leading-8 tracking-tight text-foreground">
            {fullName || account.alias}
          </Text>
          {account.superUser && (
            <View accessibilityLabel={t('card.superUser')}>
              <AppIcon name="verified" size={22} color={colors.foreground} />
            </View>
          )}
        </View>
        <Text numberOfLines={1} className="text-[15px] leading-5 text-muted-foreground">
          @{account.alias}
        </Text>
        <Text className="mt-3 text-xs leading-4 text-muted-foreground">{t('native.avatarWeb')}</Text>
      </View>
    </View>
  );
};
