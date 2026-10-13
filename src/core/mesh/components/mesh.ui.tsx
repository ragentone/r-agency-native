import { Platform } from 'react-native';

/** Monospace-Schrift für technische Werte (Status, Endpoint). */
export const MONO_FONT = Platform.select({ ios: 'Menlo', default: 'monospace' });
