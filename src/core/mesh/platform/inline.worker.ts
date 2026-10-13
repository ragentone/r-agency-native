import { utf8Decode, utf8Encode } from './utf8';

/**
 * Ersatz für den Web Worker des Mesh-Clients auf iOS/Android.
 *
 * Im Browser startet der Client einen Worker aus einem Blob, der nur den WebSocket hält und
 * Nachrichten durchreicht. React Native hat keine Web Worker – diese Klasse bildet dasselbe
 * Protokoll (`connect` / `outgoing-message` / `disconnect` ↔ `open` / `close` / `error` /
 * `incoming-message`) im JS-Thread nach. Das übergebene Script wird ignoriert.
 */

type WorkerListener = (event: { data: unknown; message?: string }) => void;

interface IToWorker {
  command?: string;
  direction?: string;
  url?: string;
  outgoing?: unknown;
}

export class InlineMeshWorker {
  private listeners = new Map<string, Set<WorkerListener>>();
  private socket: WebSocket | undefined;
  private connectInit = false;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_scriptUrl?: string | URL) {}

  addEventListener(type: string, listener: WorkerListener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: WorkerListener) {
    this.listeners.get(type)?.delete(listener);
  }

  /** Wie beim echten Worker asynchron zustellen. */
  postMessage(data: IToWorker) {
    setTimeout(() => this.incoming(data), 0);
  }

  terminate() {
    this.disconnect();
    this.listeners.clear();
  }

  private sendFromWorker(data: Record<string, unknown>) {
    setTimeout(() => {
      this.listeners.get('message')?.forEach(listener => listener({ data }));
    }, 0);
  }

  private incoming(data: IToWorker) {
    if (!data?.command || !data.direction) return;
    if (data.command === 'connect' && data.url) return this.connect(data.url);
    if (data.command === 'outgoing-message' && data.outgoing) this.send(data.outgoing);
    if (data.command === 'disconnect') this.disconnect();
  }

  private connect(url: string) {
    // Alten Socket lösen, bevor er geschlossen wird – seine späten Events dürfen den neuen
    // Verbindungszustand nicht überschreiben.
    this.detachAndClose();

    const socket = new WebSocket(url);
    socket.binaryType = 'arraybuffer';
    this.socket = socket;
    const isCurrent = () => this.socket === socket;

    socket.onopen = () => {
      if (!isCurrent()) return;
      this.sendFromWorker({ command: 'open', direction: 'from-worker', connectInit: this.connectInit });
      this.connectInit = true;
    };
    socket.onclose = () => {
      if (!isCurrent()) return;
      this.sendFromWorker({ command: 'close', direction: 'from-worker', connectInit: this.connectInit });
      this.socket = undefined;
    };
    socket.onerror = () => {
      if (!isCurrent()) return;
      this.sendFromWorker({ command: 'error', direction: 'from-worker', connectInit: this.connectInit });
      this.socket = undefined;
    };
    socket.onmessage = event => {
      if (!isCurrent()) return;
      const parsed = this.parseMessage(event.data);
      if ((parsed.data as { ping?: boolean } | undefined)?.ping) {
        return this.send({ pong: true });
      }
      this.sendFromWorker({
        command: 'incoming-message',
        direction: 'from-worker',
        incoming: parsed,
        connectInit: this.connectInit,
      });
    };
  }

  private detachAndClose() {
    const socket = this.socket;
    if (!socket) return;
    this.socket = undefined;
    socket.onopen = socket.onclose = socket.onerror = socket.onmessage = null;
    try {
      socket.close();
    } catch {
      // bereits geschlossen
    }
  }

  private disconnect() {
    if (!this.socket) return;
    const socket = this.socket;
    this.socket = undefined;
    try {
      socket.close();
    } catch {
      // bereits geschlossen
    }
  }

  private send(payload: unknown) {
    const socket = this.socket;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    try {
      socket.send(utf8Encode(JSON.stringify(payload)));
    } catch (error) {
      this.listeners
        .get('error')
        ?.forEach(listener => listener({ data: undefined, message: String(error) }));
    }
  }

  private parseMessage(data: unknown): { type: string; data?: unknown; error?: unknown } {
    const type = Object.prototype.toString.call(data);
    try {
      if (data instanceof ArrayBuffer) {
        return { type, data: JSON.parse(utf8Decode(data)) };
      }
      return { type };
    } catch (error) {
      return { type, error };
    }
  }
}
