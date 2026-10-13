import { useSyncExternalStore } from 'react';

import type { ILoginParams, IUserMetaData } from './types';

/**
 * Auth-Zustand außerhalb von React (Web-App: `useAuthStore`, zustand).
 * `useAuthStore()` abonniert ihn in Komponenten, `useAuthStore.getState()` liest ihn überall.
 */

export interface IAuthState {
  authorized: boolean;
  loginParams: ILoginParams | undefined;
  /** Route, zu der nach dem Login weitergeleitet wird (expo-router Pfad). */
  afterLoginRoute: string | undefined;
  loginSuccess: boolean;
  userMeta: IUserMetaData | undefined | null;
}

export interface IAuthStore extends IAuthState {
  userMate: IUserMetaData | undefined | null;
  user: IUserMetaData | undefined | null;
  meta: IUserMetaData | undefined | null;
  setUserMeta(meta: IUserMetaData | undefined | null): void;
  setUserMate(meta: IUserMetaData | undefined | null): void;
  setLoginSuccess(success: boolean): void;
  setAfterLoginRoute(route: string | undefined): void;
  setLoginParams(params: ILoginParams | undefined): void;
  setAuthorized(is: boolean): void;
  isAuthorized(): boolean;
  destroy(): void;
}

const initialState: IAuthState = {
  authorized: false,
  loginParams: undefined,
  afterLoginRoute: undefined,
  loginSuccess: false,
  userMeta: undefined,
};

const listeners = new Set<() => void>();
let snapshot: IAuthStore;

const set = (patch: Partial<IAuthState>) => {
  snapshot = build({ ...snapshot, ...patch });
  listeners.forEach(listener => listener());
};

const build = (state: IAuthState): IAuthStore => ({
  ...state,
  userMate: state.userMeta,
  user: state.userMeta,
  meta: state.userMeta,
  setUserMeta: meta => set({ userMeta: meta }),
  setUserMate: meta => set({ userMeta: meta }),
  setLoginSuccess: success => set({ loginSuccess: success }),
  setAfterLoginRoute: route => set({ afterLoginRoute: route }),
  setLoginParams: params => set({ loginParams: params }),
  setAuthorized: is => set({ authorized: is }),
  isAuthorized: () => snapshot.authorized,
  destroy: () => set(initialState),
});

snapshot = build(initialState);

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useAuthStore = Object.assign(
  <T = IAuthStore>(selector?: (state: IAuthStore) => T): T => {
    const state = useSyncExternalStore(subscribe, () => snapshot);
    return selector ? selector(state) : (state as T);
  },
  { getState: () => snapshot, subscribe }
);
