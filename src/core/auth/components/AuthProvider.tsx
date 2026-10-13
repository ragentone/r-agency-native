import { useMesh } from 'r-agency-mesh-client-v1/release';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { useGraphQl, useMeshState } from '@/core/mesh';

import { authEvents } from '../auth.events';
import { useAuthStore } from '../auth.store';
import { authTokenStore } from '../auth.token.store';
import { createNonce, isGoogleAuthConfigured, nativeGoogleAuth } from '../google.auth';
import {
  GoogleAuthAfterMutation,
  UserConfigQuery,
  UserLoginMutation,
  UserLogoutQuery,
} from '../graphql';
import type {
  GoogleAuthAfterReturn,
  IGoogleAuthAfterResponse,
  IGoogleAuthParams,
  ILoginParams,
  IUserConfigResponse,
  IUserLoginResponse,
  IUserLogoutResponse,
  IUserMetaData,
} from '../types';
import { AuthContext, type IAuthContext } from './auth.context';
import { AuthDeleteUserDialog } from './AuthDeleteUserDialog';
import { AuthLogoutConfirmDialog } from './AuthLogoutConfirmDialog';
import { AuthLogoutOverlay } from './AuthLogoutOverlay';

interface IProps {
  children: ReactNode;
}

/**
 * Port des AuthProviders der Web-App: lädt nach dem Mesh-Connect die Sitzung
 * (`userLoadConfig`), Login/Logout, Google-Login, Rollen-Updates per Mesh-Event.
 * Navigation übernimmt expo-router über `Stack.Protected` (siehe app/_layout.tsx).
 */
const AuthProvider = ({ children }: IProps) => {
  const { connected } = useMeshState();
  const { mutate, query } = useGraphQl();
  const { onEvent } = useMesh();

  const store = useAuthStore();
  const token = authTokenStore;
  const authorized = store.authorized;
  const userMeta = store.userMeta;

  const [loading, setLoading] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  const setUserMeta = useCallback((meta: IUserMetaData | undefined | null) => {
    useAuthStore.getState().setUserMeta(meta);
  }, []);

  /** Sitzung übernehmen bzw. verwerfen. */
  const applySession = useCallback(
    (authToken: string | null | undefined, meta: IUserMetaData | null | undefined) => {
      const state = useAuthStore.getState();
      if (authToken) {
        token.setToken(authToken);
        state.setUserMeta(meta);
        state.setAuthorized(true);
      } else {
        token.setToken(undefined);
        state.setUserMeta(undefined);
        state.setAuthorized(false);
      }
    },
    [token]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await query<IUserConfigResponse>({
        query: UserConfigQuery,
        fetchPolicy: 'no-cache',
      });
      const config = data?.userLoadConfig;
      applySession(config?.refreshToken, config?.meta);
      await authEvents.emit('auth:config:loaded', { config });
    } catch (error) {
      // Kein Server-Status → als abgemeldet behandeln, der Token bleibt für den nächsten Versuch.
      console.warn('[auth] userLoadConfig failed', error);
      useAuthStore.getState().setAuthorized(false);
    } finally {
      setLoaded(true);
      setLoading(false);
    }
  }, [applySession, query]);

  /** Frische `userMeta` (ohne Cache) – Sitzung bleibt, nur die Meta-Daten werden ersetzt. */
  const refreshUserMeta = useCallback(async (): Promise<IUserMetaData | null> => {
    try {
      const { data } = await query<IUserConfigResponse>({
        query: UserConfigQuery,
        fetchPolicy: 'no-cache',
      });
      const meta = data?.userLoadConfig?.meta ?? null;
      if (data?.userLoadConfig?.refreshToken && meta) {
        token.setToken(data.userLoadConfig.refreshToken);
        setUserMeta(meta);
      }
      return meta;
    } catch (error) {
      console.warn('[auth] refreshUserMeta failed', error);
      return null;
    }
  }, [query, setUserMeta, token]);

  const destroy = useCallback(() => applySession(undefined, undefined), [applySession]);

  const login = useCallback(
    async (params: ILoginParams) => {
      setLoading(true);
      setIsLoggingIn(true);
      try {
        await authEvents.emit('auth:login:before', { params });
        const { data } = await mutate<IUserLoginResponse>({
          mutation: UserLoginMutation,
          variables: { params },
        });
        await authEvents.emit('auth:login:after', { result: data?.userLogin });
        if (data?.userLogin?.authToken) {
          applySession(data.userLogin.authToken, data.userLogin.meta);
        }
      } finally {
        setLoading(false);
        setIsLoggingIn(false);
      }
    },
    [applySession, mutate]
  );

  /**
   * Wie `useUserGoogleAuth` der Web-App: das Backend prüft die Google-Tokens und liefert
   * Zugangsdaten (`gapi_exd` / `gapi_pxd`), mit denen dann regulär eingeloggt wird.
   */
  const googleAuthAfter = useCallback(
    async (params: IGoogleAuthParams): Promise<GoogleAuthAfterReturn> => {
      const response = await mutate<IGoogleAuthAfterResponse>({
        mutation: GoogleAuthAfterMutation,
        variables: { token: params.token, id: params.id, nonce: params.nonce },
      });
      const result = response.data?.googleAuthAfter;
      if (result?.success && result.gapi_exd && result.gapi_pxd) {
        await login({ email: result.gapi_exd, password: result.gapi_pxd, userType: 'google' });
      }
      return result;
    },
    [login, mutate]
  );

  const loginWithGoogle = useCallback(async (): Promise<GoogleAuthAfterReturn> => {
    if (!isGoogleAuthConfigured()) throw new Error('google-not-configured');
    setLoading(true);
    setIsLoggingIn(true);
    try {
      const nonce = createNonce();
      const tokens = await nativeGoogleAuth(nonce);
      return await googleAuthAfter({ token: tokens.accessToken, id: tokens.idToken, nonce });
    } finally {
      setLoading(false);
      setIsLoggingIn(false);
    }
  }, [googleAuthAfter]);

  // Ein Admin hat die Rollen geändert (`user::update:user_roles` mit `{ roles }`) → direkt in
  // `userMeta` übernehmen; ohne brauchbare Nutzlast die Meta-Daten neu laden.
  useEffect(() => {
    if (!authorized) return;
    const off = onEvent('user::update:user_roles' as never, ((payload?: { roles?: unknown }) => {
      const roles = payload?.roles;
      const current = useAuthStore.getState().userMeta;
      if (current && roles && typeof roles === 'object') {
        setUserMeta({ ...current, role: roles });
        return;
      }
      void refreshUserMeta();
    }) as never) as unknown as () => void;
    return () => {
      off?.();
    };
    // `onEvent` ist bei jedem Render eine neue Funktion (gleicher Event-Bus) – keine Abhängigkeit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized, refreshUserMeta, setUserMeta]);

  const preLogout = useCallback(() => setLogoutConfirm(true), []);

  // Logout außerhalb von React angefordert (Menü …) → derselbe Bestätigungsdialog.
  useEffect(() => authEvents.on('auth:logout:request', () => setLogoutConfirm(true)), []);

  const logout = useCallback(async () => {
    setLoading(true);
    setIsLoggingOut(true);
    const metaBefore = useAuthStore.getState().userMeta;
    try {
      await authEvents.emit('auth:logout:before', { userMeta: metaBefore });
      const { data } = await query<IUserLogoutResponse>({
        query: UserLogoutQuery,
        fetchPolicy: 'no-cache',
      });
      const success = data?.userLogout?.success ?? false;
      await authEvents.emit('auth:logout:after', { userMeta: metaBefore, success });
      if (success) destroy();
    } finally {
      setLoading(false);
      setIsLoggingOut(false);
    }
  }, [destroy, query]);

  // Sitzung laden, sobald (wieder) eine Mesh-Verbindung besteht.
  useEffect(() => {
    if (connected) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  const contextValue = useMemo<IAuthContext>(
    () => ({
      authorized,
      store,
      token,
      loading,
      isLoggingIn,
      isLoggingOut,
      login,
      loginWithGoogle,
      googleAuthAfter,
      logout,
      loaded,
      userMeta,
      userMate: userMeta,
      user: userMeta,
      meta: userMeta,
      setUserMeta,
      setUserMate: setUserMeta,
      refreshUserMeta,
      preLogout,
      logoutConfirm,
      destroy,
    }),
    [
      authorized,
      destroy,
      googleAuthAfter,
      isLoggingIn,
      isLoggingOut,
      loaded,
      loading,
      login,
      loginWithGoogle,
      logout,
      logoutConfirm,
      preLogout,
      refreshUserMeta,
      setUserMeta,
      store,
      token,
      userMeta,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      <AuthLogoutOverlay
        active={isLoggingOut}
        name={userMeta?.alias || userMeta?.email?.split('@')[0] || undefined}
        avatarUrl={userMeta?.avatarUrl}
        signedOut={!authorized}
      />
      <AuthLogoutConfirmDialog
        active={logoutConfirm}
        onConfirm={() => {
          setLogoutConfirm(false);
          void logout();
        }}
        onAbort={() => setLogoutConfirm(false)}
      />
      <AuthDeleteUserDialog />
    </AuthContext.Provider>
  );
};

export { AuthProvider };
