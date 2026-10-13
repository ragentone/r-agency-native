import { Platform } from 'react-native';

import { useThemeColors } from '@/core/theme/colors';
import { AppIcon, type AppIconName } from '@/core/ui/AppIcon';

/** Gemeinsame Bausteine der Mesh-Screens. */
export const useMeshColors = useThemeColors;
export const MeshIcon = AppIcon;
export type MeshIconName = AppIconName;
export const MONO_FONT = Platform.select({ ios: 'Menlo', default: 'monospace' });
