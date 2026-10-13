import { SymbolView } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';
import { useEffect } from 'react';
import { Platform, useColorScheme } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/** Gemeinsame Bausteine der Mesh-Screens (Farben für Icons, Icons, Monospace). */

/** Farben aus src/global.css – für Props, die keine Tailwind-Klassen nehmen (Icons, Spinner). */
export const useMeshColors = () => {
  const dark = useColorScheme() === 'dark';
  return dark
    ? {
        foreground: '#fafafa',
        background: '#0a0a0a',
        muted: '#a3a3a3',
        primary: '#fafafa',
        primaryForeground: '#171717',
        destructive: '#e14e4e',
        success: '#22c55e',
        dark,
      }
    : {
        foreground: '#0a0a0a',
        background: '#ffffff',
        muted: '#737373',
        primary: '#171717',
        primaryForeground: '#fafafa',
        destructive: '#ef4444',
        success: '#22c55e',
        dark,
      };
};

export const MONO_FONT = Platform.select({ ios: 'Menlo', default: 'monospace' });

/** Icons der Web-Version (lucide) → SF Symbols (iOS) / Material Symbols (Android, Web). */
const ICONS = {
  alert: { ios: 'exclamationmark.triangle', android: 'warning' },
  check: { ios: 'checkmark', android: 'check' },
  chevronDown: { ios: 'chevron.down', android: 'expand_more' },
  chevronUp: { ios: 'chevron.up', android: 'expand_less' },
  share: { ios: 'square.and.arrow.up', android: 'share' },
  radio: { ios: 'dot.radiowaves.left.and.right', android: 'sensors' },
  refresh: { ios: 'arrow.clockwise', android: 'refresh' },
  rotate: { ios: 'arrow.counterclockwise', android: 'restart_alt' },
} as const;

export type MeshIconName = keyof typeof ICONS;

interface IMeshIconProps {
  name: MeshIconName;
  size?: number;
  color: string;
  /** Dreht das Icon dauerhaft (wie `animate-spin`). */
  spin?: boolean;
}

export const MeshIcon = ({ name, size = 16, color, spin = false }: IMeshIconProps) => {
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
