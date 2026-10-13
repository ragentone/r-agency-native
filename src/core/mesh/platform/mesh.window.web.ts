import type { IMeshWindow } from './mesh.window.types';

/** Auf Web läuft der Mesh-Client im echten Browser-`window`. */
export const getMeshWindow = (): IMeshWindow => window as unknown as IMeshWindow;

/** Auf Web liefert der Browser `online`/`offline` selbst. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const setMeshOnline = (_online: boolean) => undefined;
