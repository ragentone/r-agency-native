import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text as UIText } from '@/components/ui/text';
import { ChangePasswordForm } from '@/core/auth/components/forms/ChangePasswordForm';
import { useAuth } from '@/core/auth/components/use.auth';
import { useThemeColors } from '@/core/theme/colors';
import { AppIcon } from '@/core/ui/AppIcon';

import { useAccountTranslation } from '../i18n';
import { useAccount } from '../use.account';
import { AccountDelete } from './AccountDelete';
import { AccountIdentifiers } from './AccountIdentifiers';
import { AccountPrivacyForm } from './AccountPrivacyForm';
import { AccountProfileCard } from './AccountProfileCard';
import { AccountProfileForm } from './AccountProfileForm';
import { AccountGroupCard, AccountGroupLabel, AccountSection } from './AccountSection';

type SectionId = 'profile' | 'privacy' | 'password' | 'identifiers' | 'delete';

/** Mein Konto (Web: PageAccount + AccountView). */
export const AccountScreen = () => {
  const { t } = useAccountTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { preLogout, isLoggingOut } = useAuth();
  const { account, loading, error, loadAccount } = useAccount(true);
  const [open, setOpen] = useState<SectionId[]>([]);

  const toggle = (id: SectionId) =>
    setOpen(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  const isOpen = (id: SectionId) => open.includes(id);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View className="flex-1 bg-background">
      {/* Kopfzeile */}
      <View className="flex-row items-center gap-4 border-b border-border/50 bg-background px-2 pb-3" style={{ paddingTop: insets.top + 8 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('actions.back')}
          onPress={back}
          className="h-9 w-9 items-center justify-center rounded-full active:bg-foreground/10"
        >
          <AppIcon name="arrowLeft" size={20} color={colors.foreground} />
        </Pressable>
        <View className="flex-1">
          <Text accessibilityRole="header" numberOfLines={1} className="text-xl font-bold leading-6 tracking-tight text-foreground">
            {t('title')}
          </Text>
          <Text numberOfLines={1} className="text-xs leading-4 text-muted-foreground">
            {t('subtitle')}
          </Text>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        refreshControl={<RefreshControl refreshing={loading && Boolean(account)} onRefresh={() => void loadAccount()} />}
      >
        <View className="w-full max-w-[600px] self-center">
          {loading && !account && (
            <View className="items-center gap-3 py-16">
              <ActivityIndicator color={colors.foreground} />
              <Text className="text-sm text-muted-foreground">{t('messages.loading')}</Text>
            </View>
          )}

          {error && !account && (
            <View className="items-center gap-4 px-6 py-16">
              <AppIcon name="alert" size={28} color={colors.destructive} />
              <Text className="text-center text-[15px] text-foreground">{t('messages.loadError')}</Text>
              <Button variant="outline" onPress={() => void loadAccount()} className="rounded-full">
                <AppIcon name="refresh" size={16} color={colors.foreground} />
                <UIText>{t('actions.retry')}</UIText>
              </Button>
            </View>
          )}

          {account && (
            <>
              <AccountProfileCard account={account} />

              <View className="gap-7 px-3 pb-4 pt-6">
                <View>
                  <AccountGroupLabel>{t('settings')}</AccountGroupLabel>
                  <AccountGroupCard>
                    <AccountSection
                      icon="user"
                      title={t('tabs.profile')}
                      description={t('tabs.profileDesc')}
                      open={isOpen('profile')}
                      onToggle={() => toggle('profile')}
                    >
                      <AccountProfileForm account={account} />
                    </AccountSection>
                    <AccountSection
                      icon="globe"
                      title={t('tabs.privacy')}
                      description={t('tabs.privacyDesc')}
                      open={isOpen('privacy')}
                      onToggle={() => toggle('privacy')}
                    >
                      <AccountPrivacyForm account={account} />
                    </AccountSection>
                    {account.userType === 'default' && (
                      <AccountSection
                        icon="key"
                        title={t('tabs.password')}
                        description={t('tabs.passwordDesc')}
                        open={isOpen('password')}
                        onToggle={() => toggle('password')}
                      >
                        <ChangePasswordForm userId={account.id} />
                      </AccountSection>
                    )}
                    <AccountSection
                      icon="fingerprint"
                      title={t('tabs.identifiers')}
                      description={t('tabs.identifiersDesc')}
                      open={isOpen('identifiers')}
                      onToggle={() => toggle('identifiers')}
                      last
                    >
                      <AccountIdentifiers userId={account.id} />
                    </AccountSection>
                  </AccountGroupCard>
                </View>

                <View>
                  <AccountGroupLabel>{t('groups.session')}</AccountGroupLabel>
                  <Pressable
                    accessibilityRole="button"
                    onPress={preLogout}
                    disabled={isLoggingOut}
                    className="flex-row items-center gap-3.5 rounded-2xl border border-border/50 px-4 py-3.5 active:bg-foreground/5 disabled:opacity-50"
                  >
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-foreground/5">
                      <AppIcon name="logout" size={18} color={colors.foreground} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[15px] font-semibold leading-5 text-foreground">{t('actions.logout')}</Text>
                      <Text numberOfLines={1} className="mt-0.5 text-xs leading-4 text-muted-foreground">
                        {t('groups.sessionDesc', { alias: account.alias })}
                      </Text>
                    </View>
                  </Pressable>
                </View>

                <View>
                  <AccountGroupLabel danger>{t('groups.danger')}</AccountGroupLabel>
                  <AccountGroupCard danger>
                    <AccountSection
                      icon="trash"
                      title={t('tabs.delete')}
                      description={t('tabs.deleteDesc')}
                      destructive
                      open={isOpen('delete')}
                      onToggle={() => toggle('delete')}
                      last
                    >
                      <AccountDelete />
                    </AccountSection>
                  </AccountGroupCard>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};
