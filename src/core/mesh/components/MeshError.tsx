import Constants from 'expo-constants';
import { reloadAppAsync } from 'expo';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, Share, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { Text as UIText } from '@/components/ui/text';
import { cn } from '@/lib/utils';

import { MESH_SERVER_ENDPOINT } from '../config';
import { useMeshTranslation } from '../i18n';
import { MeshIcon, MONO_FONT, useMeshColors } from './mesh.ui';
import { useOptionalMeshState } from './use.mesh';

export type MeshErrorStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

export interface MeshErrorProps {
  status?: MeshErrorStatus;
  retryCount?: number;
  error?: string | Error | null;
  onRetry?: () => void;
  title?: string;
  description?: string;
  endpoint?: string;
  showDetails?: boolean;
  className?: string;
}

const AMBER = '#f59e0b';

/** Weicher, pulsierender Farbschein hinter der Karte. */
const AmbientGlow = ({ color }: { color: string }) => {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
    return () => cancelAnimation(progress);
  }, [reduceMotion, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.08 + 0.08 * progress.value,
    transform: [{ scale: 0.9 + 0.2 * progress.value }],
  }));

  return (
    <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
      <Animated.View
        style={[{ width: 384, height: 384, borderRadius: 192, backgroundColor: color }, style]}
      />
    </View>
  );
};

const DiagnosticRow = ({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string | number;
  valueClassName?: string;
}) => (
  <View className="flex-row justify-between gap-2">
    <Text className="text-xs text-foreground/70" style={{ fontFamily: MONO_FONT }}>
      {label}:
    </Text>
    <Text
      numberOfLines={1}
      className={cn('flex-1 text-right text-xs font-semibold text-foreground', valueClassName)}
      style={{ fontFamily: MONO_FONT }}
    >
      {value}
    </Text>
  </View>
);

const MeshError = ({
  status: propStatus,
  retryCount: propRetryCount,
  error: propError,
  onRetry: propOnRetry,
  title: propTitle,
  description: propDescription,
  endpoint: propEndpoint,
  showDetails = true,
  className,
}: MeshErrorProps) => {
  const { t } = useMeshTranslation();
  const colors = useMeshColors();
  const contextState = useOptionalMeshState();

  const status = propStatus ?? contextState?.status ?? 'error';
  const retryCount = propRetryCount ?? contextState?.retryCount ?? 0;
  const error = propError ?? contextState?.error ?? null;
  const onRetry = propOnRetry ?? contextState?.reconnect;

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [isManualRetrying, setIsManualRetrying] = useState(false);

  const endpoint = propEndpoint || MESH_SERVER_ENDPOINT || 'mesh-server';

  const isReconnecting = status === 'reconnecting' || isManualRetrying;
  const isDisconnected = status === 'disconnected';

  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : isDisconnected
          ? t('error.messages.disconnected')
          : t('error.messages.failed');

  const defaultTitle = isReconnecting
    ? t('error.title.reconnecting')
    : isDisconnected
      ? t('error.title.disconnected')
      : t('error.title.failed');

  const defaultDescription = isReconnecting
    ? t('error.description.reconnecting')
    : isDisconnected
      ? t('error.description.disconnected')
      : t('error.description.failed');

  const title = propTitle || defaultTitle;
  const description = propDescription || defaultDescription;

  const handleRetry = async () => {
    if (!onRetry) return;
    setIsManualRetrying(true);
    try {
      await Promise.resolve(onRetry());
    } finally {
      setTimeout(() => setIsManualRetrying(false), 1200);
    }
  };

  const handleRestart = () => {
    reloadAppAsync('mesh error screen').catch(reloadError =>
      console.warn('[mesh] reload', reloadError)
    );
  };

  /** Im Browser: in die Zwischenablage. Nativ: über das System-Teilen-Menü. */
  const handleShareDetails = async () => {
    const details = [
      `[Mesh Connection Diagnostic]`,
      `Status: ${status}`,
      `Retry Count: ${retryCount}`,
      `Endpoint: ${endpoint}`,
      `Error: ${errorMessage}`,
      `Timestamp: ${new Date().toISOString()}`,
      `App: ${Constants.expoConfig?.name ?? 'r-agency-native'} ${Constants.expoConfig?.version ?? ''}`,
      `Platform: ${Platform.OS} ${String(Platform.Version)}`,
    ].join('\n');

    try {
      const result = await Share.share({ message: details });
      if (result.action === Share.sharedAction) {
        setIsShared(true);
        setTimeout(() => setIsShared(false), 2000);
      }
    } catch (shareError) {
      console.warn('[mesh] share diagnostics', shareError);
    }
  };

  return (
    <View className={cn('flex-1 bg-background', className)}>
      <AmbientGlow color={isDisconnected ? AMBER : colors.destructive} />

      <ScrollView
        contentContainerClassName="flex-grow items-center justify-center p-4"
        contentInsetAdjustmentBehavior="automatic"
      >
        <Animated.View
          entering={FadeInDown.duration(350).easing(Easing.out(Easing.ease))}
          style={{ width: '100%', maxWidth: 512 }}
        >
          <View className="w-full gap-4 rounded-2xl bg-card/90 p-6">
            {/* Header */}
            <View className="gap-1.5 pb-2">
              <Text className="text-center text-xl font-bold tracking-tight text-foreground">
                {title}
              </Text>
              <Text className="text-center text-sm leading-relaxed text-muted-foreground">
                {description}
              </Text>
            </View>

            {/* Error Message Box */}
            {!!errorMessage && (
              <View className="flex-row items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3.5 dark:border-destructive/30 dark:bg-destructive/10">
                <View className="mt-0.5">
                  <MeshIcon name="alert" size={16} color={colors.destructive} />
                </View>
                <Text className="flex-1 text-sm font-medium leading-snug text-destructive">
                  {errorMessage}
                </Text>
              </View>
            )}

            {/* Diagnostic Details */}
            {showDetails && (
              <View className="overflow-hidden rounded-xl border border-border/50 bg-muted/40">
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isDetailsOpen }}
                  onPress={() => setIsDetailsOpen(prev => !prev)}
                  className="flex-row items-center justify-between px-4 py-2.5 active:bg-muted/70"
                >
                  <View className="flex-row items-center gap-1.5">
                    <MeshIcon name="radio" size={14} color={colors.muted} />
                    <Text className="text-xs font-semibold text-muted-foreground">
                      {t('error.diagnostics.title')}
                    </Text>
                  </View>
                  <MeshIcon
                    name={isDetailsOpen ? 'chevronUp' : 'chevronDown'}
                    size={16}
                    color={colors.muted}
                  />
                </Pressable>

                {isDetailsOpen && (
                  <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}>
                    <View className="gap-2 border-t border-border/50 p-3">
                      <DiagnosticRow label={t('error.diagnostics.endpoint')} value={endpoint} />
                      <DiagnosticRow
                        label={t('error.diagnostics.status')}
                        value={status.toUpperCase()}
                      />
                      <DiagnosticRow
                        label={t('error.diagnostics.retries')}
                        value={retryCount}
                        valueClassName="text-primary"
                      />
                      <View className="items-end pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onPress={handleShareDetails}
                          className="h-7 flex-row gap-1.5"
                        >
                          <MeshIcon
                            name={isShared ? 'check' : 'share'}
                            size={14}
                            color={isShared ? colors.success : colors.muted}
                          />
                          <UIText className="text-xs text-muted-foreground">
                            {isShared ? t('error.diagnostics.copied') : t('error.diagnostics.share')}
                          </UIText>
                        </Button>
                      </View>
                    </View>
                  </Animated.View>
                )}
              </View>
            )}

            {/* Retry count badge */}
            <View className="items-center pt-1">
              <View className="flex-row items-center gap-1.5 rounded-full border border-border/50 bg-background/50 px-3 py-1">
                <MeshIcon name="rotate" size={12} color={colors.foreground} spin={isReconnecting} />
                <Text className="text-xs text-foreground" style={{ fontFamily: MONO_FONT }}>
                  {t('error.diagnostics.retryCount')}
                </Text>
                <Text className="text-xs font-bold text-primary" style={{ fontFamily: MONO_FONT }}>
                  {retryCount}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View className="gap-2.5 pt-2">
              {onRetry && (
                <Button onPress={handleRetry} disabled={isReconnecting} className="w-full">
                  <MeshIcon
                    name="refresh"
                    size={16}
                    color={colors.primaryForeground}
                    spin={isReconnecting}
                  />
                  <UIText>
                    {isReconnecting ? t('error.actions.reconnecting') : t('error.actions.retry')}
                  </UIText>
                </Button>
              )}

              <Button variant="outline" onPress={handleRestart} className="w-full border-border/50">
                <MeshIcon name="rotate" size={16} color={colors.foreground} />
                <UIText>{t('error.actions.restart')}</UIText>
              </Button>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export { MeshError };
