import { useColorScheme } from 'react-native';

/**
 * Farben aus src/global.css – für Props, die keine Tailwind-Klassen nehmen
 * (Icon-Farben, Spinner, placeholderTextColor …).
 */
export const useThemeColors = () => {
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
        border: '#262626',
        dark,
      }
    : {
        foreground: '#0a0a0a',
        background: '#ffffff',
        muted: '#737373',
        primary: '#171717',
        primaryForeground: '#fafafa',
        destructive: '#ef4444',
        success: '#16a34a',
        border: '#e5e5e5',
        dark,
      };
};

export type ThemeColors = ReturnType<typeof useThemeColors>;
