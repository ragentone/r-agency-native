import { router } from 'expo-router';
import {
  ArrowLeftIcon,
  CircleAlertIcon,
  FingerprintIcon,
  GlobeIcon,
  KeyRoundIcon,
  LogOutIcon,
  RefreshCwIcon,
  Trash2Icon,
  UserRoundIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Accordion } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { ChangePasswordForm } from '@/core/auth/components/forms/ChangePasswordForm';
import { useAuth } from '@/core/auth/components/use.auth';

import { useAccountTranslation } from '../i18n';
import { useAccount } from '../use.account';
import { AccountDelete } from './AccountDelete';
import { AccountIdentifiers } from './AccountIdentifiers';
import { AccountPrivacyForm } from './AccountPrivacyForm';
import { AccountProfileCard } from './AccountProfileCard';
import { AccountProfileForm } from './AccountProfileForm';
import { AccountGroupCard, AccountGroupLabel, AccountSection } from './AccountSection';

/** Ladeplatzhalter (Reusables `Skeleton`). */
const AccountSkeleton = () => (
  <View>
    <Skeleton className="aspect-[3/1] w-full rounded-none" />
    <View className="gap-3 px-4">
      <Skeleton className="-mt-12 h-[88px] w-[88px] rounded-full border-4 border-background" />
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-28" />
    </View>
    <View className="gap-3 px-3 pt-8">
      <Skeleton className="h-16 w-full rounded-2xl" />
      <Skeleton className="h-16 w-full rounded-2xl" />
      <Skeleton className="h-16 w-full rounded-2xl" />
    </View>
  </View>
);

/** Mein Konto (Web: PageAccount + AccountView). */
export const AccountScreen = () => {
  const { t } = useAccountTranslation();
  const insets = useSafeAreaInsets();
  const { preLogout, isLoggingOut } = useAuth();
  const { account, loading, error, loadAccount } = useAccount(true);
  const [open, setOpen] = useState<string[]>([]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View className="flex-1 bg-background">
      {/* Kopfzeile */}
      <View className="flex-row items-center gap-3 bg-background px-2 pb-3" style={{ paddingTop: insets.top + 8 }}>
        <Button variant="ghost" size="icon" accessibilityLabel={t('actions.back')} onPress={back} className="rounded-full">
          <Icon as={ArrowLeftIcon} size={20} />
        </Button>
        <View className="flex-1">
          <Text variant="large" role="heading" numberOfLines={1} className="text-xl font-bold">
            {t('title')}
          </Text>
          <Text variant="muted" numberOfLines={1} className="text-xs">
            {t('subtitle')}
          </Text>
        </View>
      </View>
      <Separator />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        refreshControl={<RefreshControl refreshing={loading && Boolean(account)} onRefresh={() => void loadAccount()} />}
      >
        <View className="w-full max-w-[600px] self-center">
          {loading && !account && <AccountSkeleton />}

          {error && !account && (
            <View className="gap-4 px-4 py-10">
              <Alert icon={CircleAlertIcon} variant="destructive">
                <AlertTitle>{t('messages.loadError')}</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
              <Button variant="outline" onPress={() => void loadAccount()} className="self-start rounded-full">
                <Icon as={RefreshCwIcon} size={16} />
                <Text>{t('actions.retry')}</Text>
              </Button>
            </View>
          )}

          {account && (
            <>
              <AccountProfileCard account={account} />

              <Accordion type="multiple" value={open} onValueChange={setOpen}>
                <View className="gap-7 px-3 pb-4 pt-6">
                  <View>
                    <AccountGroupLabel>{t('settings')}</AccountGroupLabel>
                    <AccountGroupCard>
                      <AccountSection value="profile" icon={UserRoundIcon} title={t('tabs.profile')} description={t('tabs.profileDesc')}>
                        <AccountProfileForm account={account} />
                      </AccountSection>
                      <AccountSection value="privacy" icon={GlobeIcon} title={t('tabs.privacy')} description={t('tabs.privacyDesc')}>
                        <AccountPrivacyForm account={account} />
                      </AccountSection>
                      {account.userType === 'default' && (
                        <AccountSection value="password" icon={KeyRoundIcon} title={t('tabs.password')} description={t('tabs.passwordDesc')}>
                          <ChangePasswordForm userId={account.id} />
                        </AccountSection>
                      )}
                      <AccountSection
                        value="identifiers"
                        icon={FingerprintIcon}
                        title={t('tabs.identifiers')}
                        description={t('tabs.identifiersDesc')}
                        last
                      >
                        <AccountIdentifiers userId={account.id} />
                      </AccountSection>
                    </AccountGroupCard>
                  </View>

                  <View>
                    <AccountGroupLabel>{t('groups.session')}</AccountGroupLabel>
                    <Button
                      variant="outline"
                      onPress={preLogout}
                      disabled={isLoggingOut}
                      className="h-auto justify-start gap-3.5 rounded-2xl px-4 py-3.5 shadow-none"
                    >
                      <View className="h-10 w-10 items-center justify-center rounded-xl bg-foreground/5">
                        <Icon as={LogOutIcon} size={18} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[15px] font-semibold">{t('actions.logout')}</Text>
                        <Text variant="muted" numberOfLines={1} className="mt-0.5 text-xs font-normal">
                          {t('groups.sessionDesc', { alias: account.alias })}
                        </Text>
                      </View>
                    </Button>
                  </View>

                  <View>
                    <AccountGroupLabel danger>{t('groups.danger')}</AccountGroupLabel>
                    <AccountGroupCard danger>
                      <AccountSection value="delete" icon={Trash2Icon} title={t('tabs.delete')} description={t('tabs.deleteDesc')} destructive last>
                        <AccountDelete />
                      </AccountSection>
                    </AccountGroupCard>
                  </View>
                </View>
              </Accordion>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};
