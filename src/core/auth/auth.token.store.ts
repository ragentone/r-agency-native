import { secureStorage } from './storage/secure.storage';

/**
 * Auth-Token (Web-App: `useAuthTokenStore`, zustand + persist).
 * Liegt im sicheren Speicher des Geräts und ist synchron lesbar – der MeshProvider hängt ihn
 * an jede Anfrage (`x-auth-token`).
 */

export interface IAuthTokenStore {
  token: string | undefined;
  getToken: () => string | undefined;
  setToken: (token: string | undefined) => void;
  hasToken: () => boolean;
  destroy: () => void;
}

const STORAGE_KEY = 'r-agency.auth-token';

let token: string | undefined = secureStorage.get(STORAGE_KEY) ?? undefined;

export const authTokenStore: IAuthTokenStore = {
  get token() {
    return token;
  },
  getToken: () => token,
  setToken: next => {
    token = next || undefined;
    secureStorage.set(STORAGE_KEY, token);
  },
  hasToken: () => typeof token === 'string',
  destroy: () => authTokenStore.setToken(undefined),
};

/** Kompatibel zur Web-App: `useAuthTokenStore.getState().token`. */
export const useAuthTokenStore = { getState: () => authTokenStore };
