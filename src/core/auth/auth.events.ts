import type { ILoginParams, IUserLoadConfig, IUserLoginReturn, IUserMeta } from './types';

/**
 * Auth-Events (Web-App: `Core.events.core` mit denselben Namen). Andere Module können sich
 * einklinken, z. B. `authEvents.on('auth:login:after', ({ result }) => …)`.
 */
export interface IAuthEventMap {
  'auth:config:loaded': { config: IUserLoadConfig | null | undefined };
  'auth:login:before': { params: ILoginParams };
  'auth:login:after': { result: IUserLoginReturn | null | undefined };
  'auth:logout:before': { userMeta: IUserMeta | null | undefined };
  'auth:logout:after': { userMeta: IUserMeta | null | undefined; success: boolean };
  /** Öffnet den Abmelde-Dialog (z. B. aus einem Menü). */
  'auth:logout:request': undefined;
}

type Handler<K extends keyof IAuthEventMap> = (payload: IAuthEventMap[K]) => void | Promise<void>;

const handlers = new Map<keyof IAuthEventMap, Set<Handler<keyof IAuthEventMap>>>();

export const authEvents = {
  on<K extends keyof IAuthEventMap>(event: K, handler: Handler<K>): () => void {
    if (!handlers.has(event)) handlers.set(event, new Set());
    handlers.get(event)!.add(handler as Handler<keyof IAuthEventMap>);
    return () => {
      handlers.get(event)?.delete(handler as Handler<keyof IAuthEventMap>);
    };
  },
  async emit<K extends keyof IAuthEventMap>(event: K, payload: IAuthEventMap[K]) {
    for (const handler of handlers.get(event) ?? []) {
      try {
        await handler(payload);
      } catch (error) {
        console.warn(`[auth] handler for ${event} failed`, error);
      }
    }
  },
};
