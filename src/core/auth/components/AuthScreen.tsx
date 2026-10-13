import { Link } from 'expo-router';
import { ArrowLeftIcon, HouseIcon, LogOutIcon, UserRoundIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spinner } from '@/components/app/spinner';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/core/theme/colors';

import { useAuthTranslation } from '../i18n';
import { CreateUserForm, FormAlert, LoginForm, ResetPasswordForm } from './forms';
import { useAuth } from './use.auth';
import { UserGreeting } from './UserGreeting';

type TabId = 'login' | 'create';

const LOGO = require('@/assets/images/mesh-logo.png');
const LOGO_DARK = require('@/assets/images/mesh-logo-dark.png');

/**
 * Auth-Screen (Web: PageAuth): Logo, große Überschrift, Reusables `Tabs` für Anmelden /
 * Registrieren, Passwort zurücksetzen als eigener Schritt. Angemeldet → Begrüßung.
 */
export const AuthScreen = () => {
  const { t } = useAuthTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { isLoggingIn, isLoggingOut, authorized, userMeta, loaded, preLogout } = useAuth();
  const [tab, setTab] = useState<TabId>('login');
  const [resetting, setResetting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const signedIn = Boolean(authorized && userMeta?.id);

  const showNotice = (message: string) => {
    setResetting(false);
    setTab('login');
    setNotice(message);
  };

  if (!loaded) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background">
        <Spinner size={22} />
        <Text variant="muted">{t('native.loading')}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-background">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: insets.top + 32, paddingBottom: insets.bottom + 48 }}
        contentContainerClassName="px-5"
      >
        <View className="w-full max-w-[440px] self-center">
          {signedIn && !isLoggingIn ? (
            <UserGreeting>
              <Text variant="muted">{t('page.signedIn.text')}</Text>
              <View className="gap-2.5">
                <Link href="/" asChild>
                  <Button className="h-12 rounded-full sm:h-12">
                    <Icon as={HouseIcon} size={16} />
                    <Text className="font-bold">{t('page.signedIn.home')}</Text>
                  </Button>
                </Link>
                <Link href="/account" asChild>
                  <Button variant="outline" className="h-12 rounded-full sm:h-12">
                    <Icon as={UserRoundIcon} size={16} />
                    <Text className="font-bold">{t('page.signedIn.account')}</Text>
                  </Button>
                </Link>
                <Button variant="ghost" onPress={preLogout} disabled={isLoggingOut} className="h-12 rounded-full sm:h-12">
                  <Icon as={LogOutIcon} size={16} className="text-muted-foreground" />
                  <Text className="font-bold text-muted-foreground">{t('logout.trigger')}</Text>
                </Button>
              </View>
            </UserGreeting>
          ) : (
            <>
              <Image
                source={colors.dark ? LOGO_DARK : LOGO}
                style={{ width: 40, height: 40, marginBottom: 32 }}
                accessibilityIgnoresInvertColors
              />

              <Text variant="h1" className="mb-6 text-left text-[31px] leading-9">
                {resetting ? t('resetPasswordForm.title') : tab === 'login' ? t('page.loginHeadline') : t('page.createHeadline')}
              </Text>

              <FormAlert message={notice} variant="success" className="mb-4" />

              {resetting ? (
                <View className="gap-4">
                  <Button
                    variant="ghost"
                    onPress={() => setResetting(false)}
                    disabled={isLoggingIn}
                    className="-ml-2 self-start rounded-full px-2"
                  >
                    <Icon as={ArrowLeftIcon} size={16} />
                    <Text>{t('page.backToLogin')}</Text>
                  </Button>
                  <ResetPasswordForm onSuccess={showNotice} />
                </View>
              ) : (
                <Tabs
                  value={tab}
                  onValueChange={value => {
                    if (isLoggingIn) return;
                    setNotice(null);
                    setTab(value as TabId);
                  }}
                  className="gap-6"
                >
                  <TabsList className="h-11 w-full">
                    <TabsTrigger value="login" disabled={isLoggingIn} className="flex-1">
                      <Text>{t('form.title')}</Text>
                    </TabsTrigger>
                    <TabsTrigger value="create" disabled={isLoggingIn} className="flex-1">
                      <Text>{t('page.createTab')}</Text>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <LoginForm />
                    <Button
                      variant="outline"
                      onPress={() => {
                        setNotice(null);
                        setResetting(true);
                      }}
                      disabled={isLoggingIn}
                      className="mt-4 h-11 rounded-full sm:h-11"
                    >
                      <Text className="font-bold">{t('page.forgotPassword')}</Text>
                    </Button>
                  </TabsContent>

                  <TabsContent value="create">
                    <CreateUserForm onSuccess={showNotice} />
                  </TabsContent>
                </Tabs>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
