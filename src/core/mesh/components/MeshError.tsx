import Constants from 'expo-constants';
import { reloadAppAsync } from 'expo';
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  RadioIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  Share2Icon,
  TriangleAlertIcon,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, Share, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Spinner } from '@/components/app/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/core/theme/colors';
import { cn } from '@/lib/utils';

import { MESH_SERVER_ENDPOINT } from '../config';
import { useMeshTranslation } from '../i18n';
import { MONO_FONT } from './mesh.ui';
import { useOptionalMeshState } from './use.mesh';

export type MeshErrorStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';

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

/** Weicher, pulsierender Farbschein hinter der Karte (reine Animation). */
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
      <Animated.View style={[{ width: 384, height: 384, borderRadius: 192, backgroundColor: color }, style]} />
    </View>
  );
};

const DiagnosticRow = ({ label, value, valueClassName }: { label: string; value: string | number; valueClassName?: string }) => (
  <View className="flex-row justify-between gap-2">
    <Text variant="muted" className="text-xs" style={{ fontFamily: MONO_FONT }}>
      {label}:
    </Text>
    <Text numberOfLines={1} className={cn('flex-1 text-right text-xs font-semibold', valueClassName)} style={{ fontFamily: MONO_FONT }}>
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
  const colors = useThemeColors();
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

  const title =
    propTitle ||
    (isReconnecting ? t('error.title.reconnecting') : isDisconnected ? t('error.title.disconnected') : t('error.title.failed'));
  const description =
    propDescription ||
    (isReconnecting
      ? t('error.description.reconnecting')
      : isDisconnected
        ? t('error.description.disconnected')
        : t('error.description.failed'));

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
    reloadAppAsync('mesh error screen').catch(reloadError => console.warn('[mesh] reload', reloadError));
  };

  /** Diagnose über das System-Teilen-Menü weitergeben. */
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

      <ScrollView contentContainerClassName="flex-grow items-center justify-center p-4" contentInsetAdjustmentBehavior="automatic">
        <Animated.View entering={FadeInDown.duration(350).easing(Easing.out(Easing.ease))} style={{ width: '100%', maxWidth: 512 }}>
          <Card className="w-full border-0 bg-card/90 shadow-none">
            <CardHeader className="items-center">
              <CardTitle className="text-center text-xl font-bold">{title}</CardTitle>
              <CardDescription className="text-center">{description}</CardDescription>
            </CardHeader>

            <CardContent className="gap-4">
              {!!errorMessage && (
                <Alert icon={TriangleAlertIcon} variant="destructive">
                  <AlertDescription className="font-medium">{errorMessage}</AlertDescription>
                </Alert>
              )}

              {showDetails && (
                <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                  <Card className="gap-0 overflow-hidden rounded-xl bg-muted/40 py-0 shadow-none">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="h-auto justify-between rounded-none px-4 py-2.5">
                        <View className="flex-row items-center gap-1.5">
                          <Icon as={RadioIcon} size={14} className="text-muted-foreground" />
                          <Text className="text-xs font-semibold text-muted-foreground">{t('error.diagnostics.title')}</Text>
                        </View>
                        <Icon as={isDetailsOpen ? ChevronUpIcon : ChevronDownIcon} size={16} className="text-muted-foreground" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <Separator />
                      <View className="gap-2 p-3">
                        <DiagnosticRow label={t('error.diagnostics.endpoint')} value={endpoint} />
                        <DiagnosticRow label={t('error.diagnostics.status')} value={status.toUpperCase()} />
                        <DiagnosticRow label={t('error.diagnostics.retries')} value={retryCount} valueClassName="text-primary" />
                        <Button variant="ghost" size="sm" onPress={handleShareDetails} className="h-7 self-end">
                          <Icon
                            as={isShared ? CheckIcon : Share2Icon}
                            size={14}
                            className={isShared ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'}
                          />
                          <Text className="text-xs text-muted-foreground">
                            {isShared ? t('error.diagnostics.copied') : t('error.diagnostics.share')}
                          </Text>
                        </Button>
                      </View>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              <Badge variant="outline" className="flex-row items-center gap-1.5 self-center rounded-full px-3 py-1">
                {isReconnecting ? <Spinner size={12} /> : <Icon as={RotateCcwIcon} size={12} />}
                <Text className="text-xs" style={{ fontFamily: MONO_FONT }}>
                  {t('error.diagnostics.retryCount')}
                </Text>
                <Text className="text-xs font-bold text-primary" style={{ fontFamily: MONO_FONT }}>
                  {retryCount}
                </Text>
              </Badge>
            </CardContent>

            <CardFooter className="flex-col gap-2.5">
              {onRetry && (
                <Button onPress={handleRetry} disabled={isReconnecting} className="w-full">
                  {isReconnecting ? <Spinner /> : <Icon as={RefreshCwIcon} size={16} />}
                  <Text>{isReconnecting ? t('error.actions.reconnecting') : t('error.actions.retry')}</Text>
                </Button>
              )}
              <Button variant="outline" onPress={handleRestart} className="w-full">
                <Icon as={RotateCcwIcon} size={16} />
                <Text>{t('error.actions.restart')}</Text>
              </Button>
            </CardFooter>
          </Card>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export { MeshError };
