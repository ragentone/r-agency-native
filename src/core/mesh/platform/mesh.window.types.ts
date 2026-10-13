/** Interne Felder des Mesh-Clients, die Keep-Alive und Provider brauchen. */
export interface IMeshClientInternals {
  state?: { connected?: boolean; status?: string };
  reconnectCount?: number;
  reconnectDebounce?: ReturnType<typeof setTimeout>;
  connectedAt?: Date;
}

type Listener = (event?: unknown) => void;

/** Das, was der Mesh-Client als `window` sieht (Browser: echtes window, nativ: Shim). */
export interface IMeshWindow {
  MeshClient?: IMeshClientInternals;
  navigator: { onLine: boolean };
  addEventListener(type: string, listener: Listener): void;
  removeEventListener(type: string, listener: Listener): void;
}
