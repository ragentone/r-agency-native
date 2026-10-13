import { reloadAppAsync } from 'expo';
import { AppState, type AppStateStatus, Platform } from 'react-native';

import { InlineMeshWorker } from './inline.worker';
import type { IMeshWindow } from './mesh.window.types';
import { meshStorage } from './storage';

/**
 * Browser-Umgebung für den Mesh-Client auf iOS/Android.
 *
 * Das Babel-Plugin `babel-plugins/mesh-client-globals.js` schreibt im Client `window`,
 * `navigator`, `Worker`, `Blob` und `URL` auf dieses Objekt um. Diese Datei muss geladen
 * sein, bevor der Client zum ersten Mal benutzt wird (passiert über `use.mesh.ts`).
 */

type Listener = (event?: unknown) => void;

const GLOBAL_KEY = '__R_AGENCY_MESH_WINDOW__';

const createEventTarget = () => {
  const listeners = new Map<string, Set<Listener>>();
  return {
    addEventListener(type: string, listener: Listener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(listener);
    },
    removeEventListener(type: string, listener: Listener) {
      listeners.get(type)?.delete(listener);
    },
    dispatch(type: string, event: unknown = { type }) {
      listeners.get(type)?.forEach(listener => listener(event));
    },
  };
};

const toVisibility = (state: AppStateStatus | null | undefined): DocumentVisibilityState =>
  state === 'background' ? 'hidden' : 'visible';

const documentEvents = createEventTarget();
let visibilityState = toVisibility(AppState.currentState);

AppState.addEventListener('change', state => {
  const next = toVisibility(state);
  if (next === visibilityState) return;
  visibilityState = next;
  documentEvents.dispatch('visibilitychange');
});

const detectLanguage = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale;
  } catch {
    return 'en';
  }
};

const navigatorShim = {
  product: 'ReactNative',
  onLine: true,
  language: detectLanguage(),
  userAgent: `r-agency-native (${Platform.OS} ${String(Platform.Version)})`,
};

/** Host, den der Client im Header `x-mesh-client-url` mitschickt. */
const clientHost = process.env.EXPO_PUBLIC_MESH_CLIENT_HOST || 'r-agency-native.app';

const locationShim = {
  protocol: 'https:',
  host: clientHost,
  hostname: clientHost,
  origin: `https://${clientHost}`,
  href: `https://${clientHost}/`,
  reload: () => {
    reloadAppAsync('mesh::reload_app').catch(error => console.warn('[mesh] reload', error));
  },
};

/** `new Worker(URL.createObjectURL(new Blob([script])))` – Blob/URL nur als Platzhalter. */
class MeshURL extends URL {
  static createObjectURL(): string {
    return 'blob:r-agency-mesh-worker';
  }
  static revokeObjectURL() {}
}

class MeshBlob {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_parts?: unknown[], _options?: unknown) {}
}

const windowEvents = createEventTarget();

const meshWindow = {
  MeshClient: undefined,
  MeshClientConfig: undefined,
  localStorage: meshStorage,
  navigator: navigatorShim,
  location: locationShim,
  document: {
    get visibilityState() {
      return visibilityState;
    },
    addEventListener: documentEvents.addEventListener,
    removeEventListener: documentEvents.removeEventListener,
  },
  addEventListener: windowEvents.addEventListener,
  removeEventListener: windowEvents.removeEventListener,
  Worker: InlineMeshWorker,
  Blob: MeshBlob,
  URL: MeshURL,
};

const globalScope = globalThis as unknown as Record<string, unknown>;
if (!globalScope[GLOBAL_KEY]) globalScope[GLOBAL_KEY] = meshWindow;

export const getMeshWindow = (): IMeshWindow => globalScope[GLOBAL_KEY] as IMeshWindow;

/**
 * Online-Status setzen (z. B. aus expo-network / NetInfo). Löst wie im Browser
 * `online`/`offline` aus – Mesh-Client und Keep-Alive reagieren darauf.
 */
export const setMeshOnline = (online: boolean) => {
  if (navigatorShim.onLine === online) return;
  navigatorShim.onLine = online;
  windowEvents.dispatch(online ? 'online' : 'offline');
};
