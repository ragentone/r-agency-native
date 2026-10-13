import { Image } from 'expo-image';
import { BadgeCheckIcon, InfoIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/core/auth/components/use.auth';
import { UserAvatar } from '@/core/auth/components/UserAvatar';

import { useAccountTranslation } from '../i18n';
import type { IUserAccount } from '../types';

/** Profilkopf im X-Stil: Titelbild, überlappender Avatar, Name, @Alias (Web: AccountProfileCard). */
export const AccountProfileCard = ({ account }: { account: IUserAccount }) => {
  const { t } = useAccountTranslation();
  const { userMeta } = useAuth();
  const teaserUrl = userMeta?.teaserUrl;
  const fullName = [account.details?.firstname, account.details?.lastname].filter(Boolean).join(' ');

  return (
    <View>
      <AspectRatio ratio={3} className="bg-muted">
        {teaserUrl ? (
          <Image
            source={{ uri: teaserUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            accessibilityLabel={t('teaser.alt')}
          />
        ) : null}
      </AspectRatio>

      <View className="px-4 pb-2">
        <View className="-mt-12 mb-3 self-start rounded-full border-4 border-background">
          <UserAvatar name={account.alias} avatarUrl={account.avatarUrl} size={88} />
        </View>
        <View className="flex-row items-center gap-1.5">
          <Text variant="h3" numberOfLines={1} className="flex-shrink font-extrabold">
            {fullName || account.alias}
          </Text>
          {account.superUser && (
            <View accessibilityLabel={t('card.superUser')}>
              <Icon as={BadgeCheckIcon} size={22} />
            </View>
          )}
        </View>
        <Text variant="muted" numberOfLines={1} className="text-[15px]">
          @{account.alias}
        </Text>
        <View className="mt-3 flex-row items-start gap-1.5">
          <Icon as={InfoIcon} size={13} className="mt-0.5 text-muted-foreground" />
          <Text variant="muted" className="flex-1 text-xs">
            {t('native.avatarWeb')}
          </Text>
        </View>
      </View>
    </View>
  );
};
