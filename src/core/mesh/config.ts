import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Mesh-Server-Endpoint (Web-App: VITE_MESH_SERVER_ENDPOINT).
 *
 * Im Dev-Modus zeigt `127.0.0.1`/`localhost` auf einem echten Gerät (oder dem Android-Emulator)
 * auf das Gerät selbst, nicht auf den Mac. Deshalb wird der Host dann durch den Rechner ersetzt,
 * von dem Metro das Bundle ausliefert (z. B. 192.168.2.164) – der Port bleibt.
 * Mit EXPO_PUBLIC_MESH_SERVER_ENDPOINT kann man das jederzeit explizit überschreiben.
 */

const LOOPBACK = /^(https?:\/\/)(127\.0\.0\.1|localhost)(?=[:/]|$)/i;

/** Host des Dev-Rechners aus der Metro-Verbindung, z. B. "192.168.2.164:8081" → "192.168.2.164". */
const getDevMachineHost = (): string | undefined => {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as unknown as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost;
  const host = hostUri?.split(':')[0];
  return host && host !== 'localhost' && host !== '127.0.0.1' ? host : undefined;
};

export const resolveMeshEndpoint = (endpoint: string): string => {
  if (!__DEV__ || Platform.OS === 'web' || !LOOPBACK.test(endpoint)) return endpoint;
  const devHost = getDevMachineHost();
  return devHost ? endpoint.replace(LOOPBACK, `$1${devHost}`) : endpoint;
};

export const MESH_SERVER_ENDPOINT = resolveMeshEndpoint(
  process.env.EXPO_PUBLIC_MESH_SERVER_ENDPOINT ?? ''
);
