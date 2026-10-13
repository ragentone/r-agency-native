import { Platform } from 'react-native';

import { meshStorage } from './storage';

/**
 * Ersatz für `@capacitor/device` auf iOS/Android (Metro-Alias in metro.config.js).
 * Der Mesh-Client nutzt nur `Device.getId()` – eine pro Installation stabile ID.
 */

const DEVICE_ID_KEY = 'r-agency-mesh-device-id';

const createId = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
    const random = (Math.random() * 16) | 0;
    return (char === 'x' ? random : (random & 0x3) | 0x8).toString(16);
  });

const getLanguageTag = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale;
  } catch {
    return 'en';
  }
};

export const Device = {
  async getId() {
    let identifier = meshStorage.getItem(DEVICE_ID_KEY);
    if (!identifier) {
      identifier = createId();
      meshStorage.setItem(DEVICE_ID_KEY, identifier);
    }
    return { identifier };
  },
  async getInfo() {
    return {
      platform: Platform.OS,
      operatingSystem: Platform.OS,
      osVersion: String(Platform.Version),
      model: 'unknown',
      manufacturer: 'unknown',
      isVirtual: false,
    };
  },
  async getLanguageCode() {
    return { value: getLanguageTag().split('-')[0].toLowerCase() };
  },
  async getLanguageTag() {
    return { value: getLanguageTag() };
  },
};
