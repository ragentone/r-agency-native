import { useMesh } from 'r-agency-mesh-client-v1/release';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { MESH_SERVER_ENDPOINT } from '../config';
import { useMeshTranslation } from '../i18n';
import { resetMeshReconnectCount, startMeshKeepAlive } from '../keep.alive';
import { type IMeshContext, type MeshConnectionStatus, MeshContext } from './mesh.context';
import { MeshError } from './MeshError';
import { MeshLoading } from './MeshLoading';
import { MeshReconnectBanner } from './MeshReconnectBanner';

interface IProps {
  children: ReactNode;
  fallback?: ReactNode;
  afterLoadDelay?: number;
  /** Überschreibt EXPO_PUBLIC_MESH_SERVER_ENDPOINT. */
  endpoint?: string;
  /** Liefert den Auth-Token für den Header `x-auth-token` (Web-App: useAuthTokenStore). */
  getAuthToken?: () => string | null | undefined;
}

type EventPayload = { error?: string; message?: string; reason?: string } | string | undefined;

const MeshProvider = ({
  children,
  fallback,
  afterLoadDelay = 0,
  endpoint = MESH_SERVER_ENDPOINT,
  getAuthToken,
}: IProps) => {
  const { config, connect, onEvent } = useMesh();
  const { t } = useMeshTranslation();
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<MeshConnectionStatus>('connecting');
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const afterLoadTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  /** Einmal verbunden → App bleibt bei Verbindungsabbrüchen gemountet (kein Vollbild-Fehler). */
  const [everConnected, setEverConnected] = useState(false);

  // Immer den aktuellen Token-Getter verwenden, ohne den Effekt neu zu starten.
  const getAuthTokenRef = useRef(getAuthToken);
  useEffect(() => {
    getAuthTokenRef.current = getAuthToken;
  });

  const reconnect = useCallback(() => {
    setStatus('reconnecting');
    setError(null);
    connect();
  }, [connect]);

  useEffect(() => {
    // Unsubscribe on unmount – Fast Refresh re-runs this effect, without cleanup every
    // hot reload would add another set of listeners (and another header hook).
    const unsubscribe: Array<() => void> = [];
    const on = (...args: Parameters<typeof onEvent>) => {
      unsubscribe.push(onEvent(...args) as () => void);
    };

    try {
      if (!endpoint) throw new Error(t('error.messages.missingEndpoint'));
      config({
        endpoint,
        onTryReconnect: (count: number) => {
          setRetryCount(count);
          setStatus('reconnecting');
        },
      });
    } catch (configError) {
      setConnected(false);
      setStatus('error');
      setError(configError instanceof Error ? configError.message : String(configError));
      return;
    }

    on('connected', () => {
      clearTimeout(afterLoadTimeoutRef.current);
      resetMeshReconnectCount();
      afterLoadTimeoutRef.current = setTimeout(() => {
        setEverConnected(true);
        setConnected(true);
        setStatus('connected');
        setError(null);
        setRetryCount(0);
      }, afterLoadDelay);
    });

    on('reconnected', () => {
      resetMeshReconnectCount();
      setConnected(true);
      setStatus('connected');
      setError(null);
      setRetryCount(0);
    });

    on('disconnected', (payload: EventPayload) => {
      setConnected(false);
      setStatus('disconnected');
      if (typeof payload === 'string') setError(payload);
      else if (payload?.error || payload?.message) setError(payload.error || payload.message || null);
    });

    on('connect:error', (payload: EventPayload) => {
      setConnected(false);
      setStatus('error');
      setError(
        typeof payload === 'string'
          ? payload
          : payload?.error || payload?.reason || 'Mesh connection failed'
      );
    });

    on('websocket:error', (payload: EventPayload) => {
      setError(typeof payload === 'string' ? payload : payload?.error || 'WebSocket error');
    });

    on('modify:headers', event => {
      const token = getAuthTokenRef.current?.();
      if (token) event.headers.assign({ 'x-auth-token': token });
    });

    connect();

    // Beim Zurückkehren in die App sofort wiederherstellen + Watchdog.
    unsubscribe.push(
      startMeshKeepAlive({
        connect: () => connect(),
        onReconnect: () => setStatus('reconnecting'),
      })
    );

    return () => {
      clearTimeout(afterLoadTimeoutRef.current);
      unsubscribe.forEach(off => off());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  const contextValue = useMemo<IMeshContext>(
    () => ({ connected, status, retryCount, error, reconnect }),
    [connected, status, retryCount, error, reconnect]
  );

  const isErrorState =
    status === 'error' || status === 'disconnected' || status === 'reconnecting' || error !== null;

  const renderContent = () => {
    if (everConnected) {
      // Kurzzeitige Abbrüche (z. B. nach Hintergrund/Standby) nicht mit einem Vollbild-Fehler
      // quittieren – App-Zustand bleibt erhalten, ein dezentes Banner zeigt den Reconnect.
      return (
        <>
          {children}
          <MeshReconnectBanner visible={status !== 'connected'} onRetry={reconnect} />
        </>
      );
    }

    if (isErrorState) {
      if (fallback !== undefined) return fallback;
      return (
        <MeshError status={status} retryCount={retryCount} error={error} onRetry={reconnect} />
      );
    }

    if (!connected) {
      if (fallback !== undefined) return fallback;
      return <MeshLoading status={status} retryCount={retryCount} />;
    }

    return children;
  };

  return <MeshContext.Provider value={contextValue}>{renderContent()}</MeshContext.Provider>;
};

export { MeshProvider };
