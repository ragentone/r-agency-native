import { createContext } from 'react';

import type { IAuthStore } from '../auth.store';
import type { IAuthTokenStore } from '../auth.token.store';
import type { GoogleAuthAfterReturn, IGoogleAuthParams, ILoginParams, IUserMetaData } from '../types';

export interface IAuthContext {
  authorized: boolean;
  store: IAuthStore;
  token: IAuthTokenStore;
  loading: boolean;
  isLoggingIn: boolean;
  isLoggingOut: boolean;
  login: (params: ILoginParams) => Promise<void>;
  loginWithGoogle: () => Promise<GoogleAuthAfterReturn>;
  googleAuthAfter: (params: IGoogleAuthParams) => Promise<GoogleAuthAfterReturn>;
  logout(): Promise<void>;
  preLogout(): void;
  logoutConfirm: boolean;
  /** Anmeldestatus vom Server geladen (vorher weder Login noch App zeigen). */
  loaded: boolean;
  userMeta?: IUserMetaData | null;
  userMate?: IUserMetaData | null;
  user?: IUserMetaData | null;
  meta?: IUserMetaData | null;
  setUserMeta: (meta: IUserMetaData | undefined | null) => void;
  /** Lädt `userMeta` neu vom Backend (z. B. nach einer Kontoänderung). */
  refreshUserMeta: () => Promise<IUserMetaData | null>;
  setUserMate: (meta: IUserMetaData | undefined | null) => void;
  destroy(): void;
}

/**
 * Auth context – eigenes Modul (nicht in `AuthProvider.tsx`), damit ein Hot Reload des
 * Providers dasselbe Context-Objekt behält.
 */
export const AuthContext = createContext<IAuthContext | undefined>(undefined);
