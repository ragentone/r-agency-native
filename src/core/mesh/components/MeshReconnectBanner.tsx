import { RefreshCwIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeOut, FadeOutUp, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spinner } from '@/components/app/spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

import { useMeshTranslation } from '../i18n';
import { getMeshWindow } from '../platform/mesh.window';

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
 * Dezente Pill oben (Reusables `Badge` + `Button`), während die Mesh-Verbindung nach einem
 * Abbruch wiederhergestellt wird. Die App bleibt bedienbar; offline wird sie nicht gezeigt.
 */
export const MeshReconnectBanner = ({ visible, onRetry }: IProps) => {
  const { t } = useMeshTranslation();
  const reduceMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
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

  // Der Container bleibt gemountet, damit die Exit-Animation laufen kann.
  return (
    <View pointerEvents="box-none" className="absolute inset-x-0 top-0 z-[90] items-center px-4" style={{ paddingTop: insets.top + 12 }}>
      {isShown && (
        <Animated.View
          entering={reduceMotion ? FadeIn : FadeInUp.springify().stiffness(420).damping(32)}
          exiting={reduceMotion ? FadeOut : FadeOutUp}
        >
          <Badge role="alert" className="flex-row items-center gap-2 rounded-full py-1.5 pl-4 pr-1.5 shadow-lg shadow-black/15">
            <Spinner size={14} />
            <Text className="text-[13px] font-semibold">{t('banner.reconnecting')}</Text>
            {showRetry ? (
              <Button size="sm" variant="secondary" onPress={onRetry} className="ml-1 h-8 rounded-full px-3">
                <Icon as={RefreshCwIcon} size={14} />
                <Text>{t('banner.retry')}</Text>
              </Button>
            ) : (
              <View className="pr-2" />
            )}
          </Badge>
        </Animated.View>
      )}
    </View>
  );
};
