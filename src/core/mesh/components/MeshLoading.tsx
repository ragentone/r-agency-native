import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Progress } from '@/components/ui/progress';
import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/core/theme/colors';
import { cn } from '@/lib/utils';

import { MESH_SERVER_ENDPOINT } from '../config';
import { useMeshTranslation } from '../i18n';
import { MONO_FONT } from './mesh.ui';
import { useOptionalMeshState } from './use.mesh';

export interface MeshLoadingProps {
  title?: string;
  description?: string;
  endpoint?: string;
  status?: string;
  retryCount?: number;
  className?: string;
}

const LOGO = require('@/assets/images/mesh-logo.png');
const LOGO_DARK = require('@/assets/images/mesh-logo-dark.png');


/** Pulsierender Ring hinter dem Logo. */
const PulseRing = ({ delay, color }: { delay: number; color: string }) => {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) }), -1)
    );
    return () => cancelAnimation(progress);
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.6 * (1 - progress.value),
    transform: [{ scale: 1 + 0.7 * progress.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', inset: 0, borderRadius: 999, borderWidth: 1, borderColor: color },
        style,
      ]}
    />
  );
};

/**
 * Splash screen while the mesh connection is established (X-style):
 * centered logo with a soft pulse, short text, indeterminate bar and the real
 * connection status at the bottom. Respects reduced motion.
 */
const MeshLoading = ({
  title: propTitle,
  description: propDescription,
  endpoint: propEndpoint,
  status: propStatus,
  retryCount: propRetryCount,
  className,
}: MeshLoadingProps) => {
  const { t } = useMeshTranslation();
  const reduceMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const contextState = useOptionalMeshState();

  const status = propStatus ?? contextState?.status ?? 'connecting';
  const retryCount = propRetryCount ?? contextState?.retryCount ?? 0;
  const endpoint = propEndpoint || MESH_SERVER_ENDPOINT || 'mesh-server';
  const title = propTitle || t('loading.title');
  const description = propDescription || t('loading.description');

  // Unbestimmter Fortschritt: 0 → 100 in Schleife (bei reduzierter Bewegung fest auf 40 %).
  const [progress, setProgress] = useState(reduceMotion ? 40 : 0);
  useEffect(() => {
    if (reduceMotion) return;
    const timer = setInterval(() => setProgress(value => (value >= 100 ? 0 : value + 10)), 140);
    return () => clearInterval(timer);
  }, [reduceMotion]);

  const logoScale = useSharedValue(1);
  const dot = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    logoScale.value = withRepeat(
      withSequence(
        withTiming(0.94, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
    dot.value = withRepeat(withTiming(1, { duration: 1000, easing: Easing.out(Easing.ease) }), -1);
    return () => {
      cancelAnimation(logoScale);
      cancelAnimation(dot);
    };
  }, [reduceMotion, logoScale, dot]);

  const logoStyle = useAnimatedStyle(() => ({ transform: [{ scale: logoScale.value }] }));
  const dotStyle = useAnimatedStyle(() => ({
    opacity: 0.6 * (1 - dot.value),
    transform: [{ scale: 1 + dot.value }],
  }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLiveRegion="polite"
      accessibilityState={{ busy: true }}
      accessibilityLabel={`${title}. ${description}`}
      className={cn('flex-1 items-center justify-center overflow-hidden bg-background px-6', className)}
    >
      {/* Short delay so fast connections don't flash the splash. */}
      <Animated.View entering={FadeIn.delay(150).duration(300)} style={{ alignItems: 'center' }}>
        <View className="h-20 w-20 items-center justify-center">
          {!reduceMotion && (
            <>
              <PulseRing delay={0} color={`${colors.foreground}40`} />
              <PulseRing delay={1000} color={`${colors.foreground}40`} />
            </>
          )}
          <Animated.View style={logoStyle}>
            <Image
              source={colors.dark ? LOGO_DARK : LOGO}
              style={{ width: 64, height: 64 }}
              accessibilityIgnoresInvertColors
            />
          </Animated.View>
        </View>

        <Text variant="h4" className="mt-10 text-center font-bold">
          {title}
        </Text>
        <Text variant="muted" className="mt-1.5 max-w-[300px] text-center text-[15px] leading-5">
          {description}
        </Text>

        {/* Fortschritt (Reusables `Progress`, läuft in Schleife bis die Verbindung steht) */}
        <Progress value={progress} className="mt-8 h-1 w-40" />
      </Animated.View>

      {/* Real connection status */}
      <View
        className="absolute inset-x-0 bottom-0 items-center px-6"
        style={{ paddingBottom: Math.max(24, insets.bottom) }}
      >
        <View className="max-w-full flex-row items-center gap-2">
          <View className="h-1.5 w-1.5">
            {!reduceMotion && (
              <Animated.View
                style={[
                  { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: colors.foreground },
                  dotStyle,
                ]}
              />
            )}
            <View className="h-1.5 w-1.5 rounded-full bg-foreground" />
          </View>
          <Text className="text-[11px] text-muted-foreground" style={{ fontFamily: MONO_FONT }}>
            {status}
            {retryCount > 0 && ` #${retryCount}`}
          </Text>
          <Text className="text-[11px] text-muted-foreground">·</Text>
          <Text
            numberOfLines={1}
            className="flex-shrink text-[11px] text-muted-foreground"
            style={{ fontFamily: MONO_FONT }}
          >
            {endpoint}
          </Text>
        </View>
      </View>
    </View>
  );
};

export { MeshLoading };
