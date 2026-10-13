import { SymbolView } from 'expo-symbols';
import { useEffect } from 'react';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import type { SFSymbol } from 'sf-symbols-typescript';

/** Icons: SF Symbols (iOS) / Material Symbols (Android, Web) – Ersatz für lucide-react. */
const ICONS = {
  alert: { ios: 'exclamationmark.triangle', android: 'warning' },
  arrowLeft: { ios: 'arrow.left', android: 'arrow_back' },
  check: { ios: 'checkmark', android: 'check' },
  checkCircle: { ios: 'checkmark.circle', android: 'check_circle' },
  chevronDown: { ios: 'chevron.down', android: 'expand_more' },
  chevronUp: { ios: 'chevron.up', android: 'expand_less' },
  eye: { ios: 'eye', android: 'visibility' },
  eyeOff: { ios: 'eye.slash', android: 'visibility_off' },
  home: { ios: 'house', android: 'home' },
  lock: { ios: 'lock', android: 'lock' },
  logout: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout' },
  mail: { ios: 'envelope', android: 'mail' },
  at: { ios: 'at', android: 'alternate_email' },
  radio: { ios: 'dot.radiowaves.left.and.right', android: 'sensors' },
  refresh: { ios: 'arrow.clockwise', android: 'refresh' },
  rotate: { ios: 'arrow.counterclockwise', android: 'restart_alt' },
  share: { ios: 'square.and.arrow.up', android: 'share' },
  user: { ios: 'person', android: 'person' },
} as const;

export type AppIconName = keyof typeof ICONS;

interface IProps {
  name: AppIconName;
  size?: number;
  color: string;
  /** Dreht das Icon dauerhaft (wie `animate-spin`). */
  spin?: boolean;
}

export const AppIcon = ({ name, size = 16, color, spin = false }: IProps) => {
  const icon = ICONS[name];
  const reduceMotion = useReducedMotion();
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (spin && !reduceMotion) {
      rotation.value = 0;
      rotation.value = withRepeat(withTiming(360, { duration: 1000, easing: Easing.linear }), -1);
    } else {
      cancelAnimation(rotation);
      rotation.value = 0;
    }
  }, [spin, reduceMotion, rotation]);

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  return (
    <Animated.View style={[{ width: size, height: size }, style]}>
      <SymbolView
        name={{ ios: icon.ios as SFSymbol, android: icon.android, web: icon.android }}
        size={size}
        tintColor={color}
        weight="medium"
      />
    </Animated.View>
  );
};
