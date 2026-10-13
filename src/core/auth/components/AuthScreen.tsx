import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text as UIText } from '@/components/ui/text';
import { useThemeColors } from '@/core/theme/colors';
import { AppIcon } from '@/core/ui/AppIcon';
import { cn } from '@/lib/utils';

import { useAuthTranslation } from '../i18n';
import { CreateUserForm, FormAlert, LoginForm, ResetPasswordForm } from './forms';
import { useAuth } from './use.auth';
import { UserGreeting } from './UserGreeting';

type FormType = 'login' | 'create' | 'reset';

const LOGO = require('@/assets/images/mesh-logo.png');
const LOGO_DARK = require('@/assets/images/mesh-logo-dark.png');

/**
 * Auth-Screen (Web: PageAuth, X-Style): Logo, große Überschrift, Umschalter Anmelden /
 * Registrieren, Passwort zurücksetzen als eigener Schritt. Angemeldet → Begrüßung.
 */
export const AuthScreen = () => {
  const { t } = useAuthTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { isLoggingIn, isLoggingOut, authorized, userMeta, loaded, preLogout } = useAuth();
  const [currentForm, setCurrentForm] = useState<FormType>('login');
  const [notice, setNotice] = useState<string | null>(null);
  const signedIn = Boolean(authorized && userMeta?.id);

  const switchTo = (form: FormType) => {
    if (isLoggingIn) return;
    setNotice(null);
    setCurrentForm(form);
  };

  const headline: Record<FormType, string> = {
    login: t('page.loginHeadline'),
    create: t('page.createHeadline'),
    reset: t('resetPasswordForm.title'),
  };

  const tabs: { id: Exclude<FormType, 'reset'>; label: string }[] = [
    { id: 'login', label: t('form.title') },
    { id: 'create', label: t('page.createTab') },
  ];

  if (!loaded) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background">
        <ActivityIndicator color={colors.foreground} />
        <Text className="text-sm text-muted-foreground">{t('native.loading')}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: insets.top + 32, paddingBottom: insets.bottom + 48 }}
        contentContainerClassName="px-5"
      >
        <View className="w-full max-w-[440px] self-center">
          {signedIn && !isLoggingIn ? (
            <UserGreeting>
              <Text className="text-[15px] text-muted-foreground">{t('page.signedIn.text')}</Text>
              <View className="gap-2.5">
                <Link href="/" asChild>
                  <Button className="h-12 rounded-full">
                    <AppIcon name="home" size={16} color={colors.primaryForeground} />
                    <UIText className="font-bold">{t('page.signedIn.home')}</UIText>
                  </Button>
                </Link>
                <Link href="/account" asChild>
                  <Button variant="outline" className="h-12 rounded-full border-border/50">
                    <AppIcon name="user" size={16} color={colors.foreground} />
                    <UIText className="font-bold">{t('page.signedIn.account')}</UIText>
                  </Button>
                </Link>
                <Button variant="ghost" onPress={preLogout} disabled={isLoggingOut} className="h-12 rounded-full">
                  <AppIcon name="logout" size={16} color={colors.muted} />
                  <UIText className="font-bold text-muted-foreground">{t('logout.trigger')}</UIText>
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

              <Text
                accessibilityRole="header"
                className="mb-6 text-[31px] font-extrabold leading-9 tracking-tight text-foreground"
              >
                {headline[currentForm]}
              </Text>

              {currentForm === 'reset' ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => switchTo('login')}
                  disabled={isLoggingIn}
                  className="-ml-2 mb-4 h-9 flex-row items-center gap-1.5 self-start rounded-full px-2 active:bg-foreground/10"
                >
                  <AppIcon name="arrowLeft" size={16} color={colors.foreground} />
                  <Text className="text-[15px] font-medium text-foreground">{t('page.backToLogin')}</Text>
                </Pressable>
              ) : (
                <View
                  accessibilityRole="tablist"
                  accessibilityLabel={t('page.switchLabel')}
                  className="mb-6 flex-row border-b border-border/50"
                >
                  {tabs.map(tab => {
                    const selected = currentForm === tab.id;
                    return (
                      <Pressable
                        key={tab.id}
                        accessibilityRole="tab"
                        accessibilityState={{ selected, disabled: isLoggingIn }}
                        disabled={isLoggingIn}
                        onPress={() => switchTo(tab.id)}
                        className="h-12 flex-1 items-center justify-center active:bg-foreground/5"
                      >
                        <Text
                          className={cn(
                            'text-[15px]',
                            selected ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'
                          )}
                        >
                          {tab.label}
                        </Text>
                        {selected && (
                          <View className="absolute bottom-0 h-1 w-14 rounded-full bg-foreground" />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}

              <FormAlert message={notice} variant="success" className="mb-4" />

              {currentForm === 'login' && (
                <>
                  <LoginForm />
                  <Button
                    variant="outline"
                    onPress={() => switchTo('reset')}
                    disabled={isLoggingIn}
                    className="mt-4 h-11 rounded-full border-border/50"
                  >
                    <UIText className="font-bold">{t('page.forgotPassword')}</UIText>
                  </Button>
                </>
              )}

              {currentForm === 'create' && (
                <CreateUserForm
                  onSuccess={message => {
                    setCurrentForm('login');
                    setNotice(message);
                  }}
                />
              )}

              {currentForm === 'reset' && (
                <ResetPasswordForm
                  onSuccess={message => {
                    setCurrentForm('login');
                    setNotice(message);
                  }}
                />
              )}
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
