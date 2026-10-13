import { AppState } from 'react-native';

import { getMeshWindow } from './platform/mesh.window';

/**
 * Hält die Mesh-Verbindung stabil und baut sie beim Zurückkehren in die App sofort wieder auf.
 *
 * - Resume-Trigger (App wird aktiv, Gerät wieder online): ist die Verbindung weg, wird sofort
 *   neu verbunden statt auf den nächsten Retry-Timer des Clients zu warten.
 * - Der Mesh-Client gibt nach 125 Versuchen auf und setzt den Zähler nie zurück → hier wird
 *   er nach jeder erfolgreichen Verbindung zurückgesetzt, und ein Watchdog übernimmt, falls
 *   der Client aufgegeben hat.
 *
 * iOS/Android pausieren JS und schließen Sockets im Hintergrund nach kurzer Zeit – das lässt
 * sich ohne Native-Hintergrunddienst nicht verhindern (Web-Version: Web Lock). Dort greift der
 * sofortige Reconnect beim Zurückkehren.
 */

interface IKeepAliveOptions {
  /** Startet einen Verbindungsversuch (MeshClient.connect). */
  connect: () => void;
  /** Wird vor einem Keep-Alive-Reconnect aufgerufen (Status in der UI setzen). */
  onReconnect?: () => void;
}

const WATCHDOG_INTERVAL_MS = 15_000;
/** Mindestabstand zwischen zwei Keep-Alive-Reconnects (verhindert Doppel-Sockets). */
const MIN_RECONNECT_GAP_MS = 4_000;
const MAX_CLIENT_RETRIES = 125;

const getClient = () => getMeshWindow().MeshClient;
const isConnected = () => getClient()?.state?.connected === true;
const isActive = () => AppState.currentState === 'active';

export const startMeshKeepAlive = ({ connect, onReconnect }: IKeepAliveOptions): (() => void) => {
  const cleanup: Array<() => void> = [];
  let lastAttempt = 0;

  const reconnectNow = (reason: string) => {
    const client = getClient();
    // Vor dem ersten erfolgreichen Connect kümmert sich der MeshProvider selbst darum.
    if (!client?.connectedAt || isConnected() || !getMeshWindow().navigator.onLine) return;
    if (Date.now() - lastAttempt < MIN_RECONNECT_GAP_MS) return;
    lastAttempt = Date.now();

    // Ausstehenden (gedrosselten) Retry verwerfen und Zähler zurücksetzen, sonst gibt der
    // Client nach 125 Versuchen für immer auf.
    clearTimeout(client.reconnectDebounce);
    client.reconnectCount = 0;
    console.info(`[mesh] keep-alive reconnect (${reason})`);
    onReconnect?.();
    connect();
  };

  const appState = AppState.addEventListener('change', state => {
    if (state === 'active') reconnectNow('app-active');
  });
  cleanup.push(() => appState.remove());

  const meshWindow = getMeshWindow();
  const onOnline = () => reconnectNow('online');
  meshWindow.addEventListener('online', onOnline);
  cleanup.push(() => meshWindow.removeEventListener('online', onOnline));

  // Watchdog: greift, wenn der Client aufgegeben hat oder ein Retry-Timer hängt.
  const watchdog = setInterval(() => {
    const client = getClient();
    if (!client || isConnected()) return;
    if ((client.reconnectCount ?? 0) >= MAX_CLIENT_RETRIES || isActive()) reconnectNow('watchdog');
  }, WATCHDOG_INTERVAL_MS);
  cleanup.push(() => clearInterval(watchdog));

  return () => cleanup.forEach(off => off());
};

/** Nach jeder erfolgreichen Verbindung aufrufen – setzt den Retry-Zähler des Clients zurück. */
export const resetMeshReconnectCount = () => {
  const client = getClient();
  if (client) client.reconnectCount = 0;
};
