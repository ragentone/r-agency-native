import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

/**
 * Google-Login wie in der nativen (Flutter-)App der Web-Version:
 * OAuth im System-Anmeldefenster (Google blockiert eingebettete WebViews). Google leitet auf die
 * Callback-Seite der Web-App um; deren index.html erkennt `state=r-agency-app` und springt per
 * `r-agency://google-auth#…` zurück in die App (Scheme `r-agency` in app.json).
 *
 * Im Browser (Expo Web) öffnet sich ein Popup, Google leitet direkt auf die eigene Seite zurück;
 * `completeGoogleAuthPopup()` (in app/_layout.tsx) gibt das Ergebnis an das Hauptfenster.
 *
 * Konfiguration (.env):
 *   EXPO_PUBLIC_GOOGLE_CLIENT_ID          – wie VITE_GOOGLE_CLIENT_ID
 *   EXPO_PUBLIC_GOOGLE_REDIRECT_URI       – Android/iOS: volle URL der Web-Callback-Seite,
 *                                          z. B. https://<web-app>/auth/google/callback
 *   EXPO_PUBLIC_GOOGLE_WEB_REDIRECT_URI   – Web (optional): Standard ist die eigene Adresse
 */

export const NATIVE_GOOGLE_AUTH_STATE = 'r-agency-app';
const APP_RETURN_URL = 'r-agency://google-auth';
const AUTH_URL = process.env.EXPO_PUBLIC_GOOGLE_AUTH_URL || 'https://accounts.google.com/o/oauth2/v2/auth';
const CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '';
const NATIVE_REDIRECT_URI = process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI ?? '';
const WEB_REDIRECT_URI = process.env.EXPO_PUBLIC_GOOGLE_WEB_REDIRECT_URI ?? '';

const isWeb = Platform.OS === 'web';

/** Wohin Google nach der Anmeldung zurückleitet. */
const getRedirectUri = () =>
  isWeb
    ? WEB_REDIRECT_URI || (typeof window !== 'undefined' ? window.location.origin : '')
    : NATIVE_REDIRECT_URI;

export const isGoogleAuthConfigured = () => Boolean(CLIENT_ID && getRedirectUri());

/** Im Google-Popup (Web): Ergebnis an das Hauptfenster geben und Popup schließen. */
export const completeGoogleAuthPopup = () => {
  if (isWeb) WebBrowser.maybeCompleteAuthSession();
};

export class GoogleAuthCancelledError extends Error {
  constructor() {
    super('Google sign-in was cancelled');
    this.name = 'GoogleAuthCancelledError';
  }
}

export const createNonce = () =>
  Array.from({ length: 32 }, () => Math.floor(Math.random() * 36).toString(36)).join('');

export const parseGoogleAuthHash = (
  hash: string
): { accessToken?: string; idToken?: string; error?: string } => {
  const clean = hash.startsWith('#') ? hash.substring(1) : hash;
  const params = new URLSearchParams(clean);
  return {
    accessToken: params.get('access_token') || undefined,
    idToken: params.get('id_token') || undefined,
    error: params.get('error') || undefined,
  };
};

export const buildGoogleAuthUrl = (nonce: string): string => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: getRedirectUri(),
    response_type: 'token id_token',
    scope: 'openid email profile',
    nonce,
    prompt: 'select_account',
  });
  // Nur nativ: `state=r-agency-app` lässt die Web-Callback-Seite zurück in die App springen.
  if (!isWeb) params.set('state', NATIVE_GOOGLE_AUTH_STATE);
  return `${AUTH_URL}?${params.toString()}`;
};

/** Öffnet das Google-Anmeldefenster und liefert die Tokens. */
export const nativeGoogleAuth = async (
  nonce: string
): Promise<{ accessToken: string; idToken: string }> => {
  const result = await WebBrowser.openAuthSessionAsync(
    buildGoogleAuthUrl(nonce),
    isWeb ? getRedirectUri() : APP_RETURN_URL
  );
  if (result.type !== 'success') throw new GoogleAuthCancelledError();
  const hashIndex = result.url.indexOf('#');
  const { accessToken, idToken, error } = parseGoogleAuthHash(
    hashIndex >= 0 ? result.url.slice(hashIndex) : ''
  );
  if (accessToken && idToken) return { accessToken, idToken };
  throw new Error(error || 'Failed to retrieve tokens from Google response');
};
