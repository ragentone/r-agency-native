import { createContext } from 'react';

export type MeshConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

export interface IMeshContext {
  connected: boolean;
  status: MeshConnectionStatus;
  retryCount: number;
  error: string | null;
  reconnect: () => void;
}

/**
 * Mesh connection context – own module (not in `MeshProvider.tsx`) so a hot reload of the
 * provider keeps the same context object.
 */
export const MeshContext = createContext<IMeshContext | undefined>(undefined);
