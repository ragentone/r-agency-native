import { getMeshWindow } from './mesh.window';

/**
 * Ersatz für `@capacitor/network` auf iOS/Android (Metro-Alias in metro.config.js).
 * Quelle ist `navigator.onLine` des Mesh-Window-Shims (setzbar über `setMeshOnline`).
 */

interface IConnectionStatus {
  connected: boolean;
  connectionType: 'wifi' | 'cellular' | 'none' | 'unknown';
}

type StatusListener = (status: IConnectionStatus) => void;

const getStatusSync = (): IConnectionStatus => {
  const connected = getMeshWindow().navigator.onLine;
  return { connected, connectionType: connected ? 'unknown' : 'none' };
};

export const Network = {
  async getStatus() {
    return getStatusSync();
  },
  async addListener(_event: 'networkStatusChange', listener: StatusListener) {
    const meshWindow = getMeshWindow();
    const handler = () => listener(getStatusSync());
    meshWindow.addEventListener('online', handler);
    meshWindow.addEventListener('offline', handler);
    return {
      remove: async () => {
        meshWindow.removeEventListener('online', handler);
        meshWindow.removeEventListener('offline', handler);
      },
    };
  },
  async removeAllListeners() {},
};
