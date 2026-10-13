import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { useThemeColors } from '@/core/theme/colors';
import { AppIcon } from '@/core/ui/AppIcon';

import { useAuthTranslation } from '../i18n';
import { UserAvatar } from './UserAvatar';

interface IProps {
  active: boolean;
  name?: string;
  avatarUrl?: string | null;
  signedOut: boolean;
}

type Phase = 'hidden' | 'leaving' | 'goodbye';

/** Mindestens so lange sichtbar, damit schnelle Logouts nicht flackern. */
const MIN_VISIBLE_MS = 900;
const GOODBYE_MS = 650;

/**
 * Vollbild-Overlay beim Abmelden: "Wird abgemeldet …" → "Bis bald, Name!" → ausblenden.
 */
export const AuthLogoutOverlay = ({ active, name, avatarUrl, signedOut }: IProps) => {
  const { t } = useAuthTranslation();
  const colors = useThemeColors();
  const [phase, setPhase] = useState<Phase>('hidden');
  const [snapshot, setSnapshot] = useState<{ name?: string; avatarUrl?: string | null }>({});
  const shownAt = useRef(0);

  // Beim Start Name/Avatar merken – nach dem Logout sind sie weg.
  if (active && phase === 'hidden') {
    setSnapshot({ name, avatarUrl });
    setPhase('leaving');
  }

  useEffect(() => {
    if (phase === 'leaving' && shownAt.current === 0) shownAt.current = Date.now();
    if (active || phase !== 'leaving') return;
    const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt.current));
    const next = setTimeout(() => {
      if (signedOut) setPhase('goodbye');
      else {
        shownAt.current = 0;
        setPhase('hidden');
      }
    }, wait);
    return () => clearTimeout(next);
  }, [active, phase, signedOut]);

  useEffect(() => {
    if (phase !== 'goodbye') return;
    const hide = setTimeout(() => {
      shownAt.current = 0;
      setPhase('hidden');
    }, GOODBYE_MS + 600);
    return () => clearTimeout(hide);
  }, [phase]);

  const goodbye = phase === 'goodbye';
  const displayName = snapshot.name;

  return (
    <Modal visible={phase !== 'hidden'} transparent animationType="fade" statusBarTranslucent>
      <View
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        className="flex-1 items-center justify-center gap-5 bg-background/95 px-6"
      >
        <View className="h-24 w-24 items-center justify-center">
          {!goodbye && (
            <View style={{ position: 'absolute' }}>
              <ActivityIndicator size="large" color={colors.foreground} style={{ transform: [{ scale: 1.9 }] }} />
            </View>
          )}
          <UserAvatar name={displayName} avatarUrl={snapshot.avatarUrl} size={72} />
          {goodbye && (
            <Animated.View
              entering={ZoomIn.springify()}
              style={{ position: 'absolute', right: 4, bottom: 4 }}
            >
              <View className="h-7 w-7 items-center justify-center rounded-full bg-foreground">
                <AppIcon name="check" size={14} color={colors.background} />
              </View>
            </Animated.View>
          )}
        </View>

        <Animated.View key={phase} entering={FadeIn.duration(250)} style={{ alignItems: 'center', gap: 4 }}>
          <Text className="text-center text-xl font-bold tracking-tight text-foreground">
            {goodbye
              ? displayName
                ? t('logout.goodbyeName', { name: displayName })
                : t('logout.goodbye')
              : t('logout.loggingOut')}
          </Text>
          <Text className="text-center text-sm text-muted-foreground">
            {goodbye ? t('logout.goodbyeHint') : t('logout.overlayHint')}
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
};
