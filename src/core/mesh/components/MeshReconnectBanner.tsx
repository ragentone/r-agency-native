import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeOut,
  FadeOutUp,
  useReducedMotion,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMeshTranslation } from '../i18n';
import { getMeshWindow } from '../platform/mesh.window';
import { MeshIcon, useMeshColors } from './mesh.ui';

interface IProps {
  visible: boolean;
  onRetry: () => void;
}

/** Erst nach kurzer Verzögerung zeigen – schnelle Reconnects (z. B. nach App-Wechsel) flackern nicht. */
const SHOW_DELAY_MS = 1500;
/** Danach zusätzlich „Erneut versuchen“ anbieten. */
const RETRY_HINT_DELAY_MS = 10_000;

const useOnline = () => {
  const [online, setOnline] = useState(() => getMeshWindow().navigator.onLine);
  useEffect(() => {
    const meshWindow = getMeshWindow();
    const update = () => setOnline(meshWindow.navigator.onLine);
    meshWindow.addEventListener('online', update);
    meshWindow.addEventListener('offline', update);
    return () => {
      meshWindow.removeEventListener('online', update);
      meshWindow.removeEventListener('offline', update);
    };
  }, []);
  return online;
};

/**
 * Dezente Pill oben, während die Mesh-Verbindung nach einem Abbruch wiederhergestellt wird.
 * Die App bleibt dabei vollständig bedienbar (kein Vollbild-Fehler). Offline wird sie nicht
 * gezeigt.
 */
export const MeshReconnectBanner = ({ visible, onRetry }: IProps) => {
  const { t } = useMeshTranslation();
  const reduceMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const colors = useMeshColors();
  const online = useOnline();
  const [show, setShow] = useState(false);
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const showTimer = setTimeout(() => setShow(true), SHOW_DELAY_MS);
    const retryTimer = setTimeout(() => setShowRetry(true), RETRY_HINT_DELAY_MS);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(retryTimer);
      setShow(false);
      setShowRetry(false);
    };
  }, [visible]);

  const isShown = visible && show && online;

  // Der Container bleibt gemountet, damit die Exit-Animation der Pill laufen kann.
  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 top-0 z-[90] items-center px-4"
      style={{ paddingTop: insets.top + 12 }}
    >
      {isShown && (
      <Animated.View
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        entering={reduceMotion ? FadeIn : FadeInUp.springify().stiffness(420).damping(32)}
        exiting={reduceMotion ? FadeOut : FadeOutUp}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          borderRadius: 999,
          backgroundColor: colors.foreground,
          paddingVertical: 8,
          paddingLeft: 16,
          paddingRight: 8,
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
      >
        <ActivityIndicator size="small" color={colors.background} />
        <Text className="text-[13px] font-semibold text-background">{t('banner.reconnecting')}</Text>
        {showRetry ? (
          <Pressable
            accessibilityRole="button"
            onPress={onRetry}
            className="ml-1 min-h-8 flex-row items-center gap-1 rounded-full bg-background/15 px-3 py-1 active:bg-background/25"
          >
            <MeshIcon name="refresh" size={14} color={colors.background} />
            <Text className="text-[13px] font-semibold text-background">{t('banner.retry')}</Text>
          </Pressable>
        ) : (
          <View className="pr-2" />
        )}
      </Animated.View>
      )}
    </View>
  );
};
