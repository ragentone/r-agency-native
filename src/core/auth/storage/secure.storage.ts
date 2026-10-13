import * as SecureStore from 'expo-secure-store';

/** Sicherer, synchroner Key-Value-Speicher (iOS Keychain / Android Keystore). */
export const secureStorage = {
  get(key: string): string | null {
    try {
      return SecureStore.getItem(key);
    } catch (error) {
      console.warn('[auth] secure storage read failed', error);
      return null;
    }
  },
  set(key: string, value: string | null | undefined) {
    try {
      if (value == null) void SecureStore.deleteItemAsync(key);
      else SecureStore.setItem(key, value);
    } catch (error) {
      console.warn('[auth] secure storage write failed', error);
    }
  },
};
