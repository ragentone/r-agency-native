import { File, Paths } from 'expo-file-system';

/**
 * Synchroner `localStorage`-Ersatz für iOS/Android.
 *
 * Der Mesh-Client liest/schreibt `localStorage` synchron (Client-ID, Device-ID). Die Werte
 * liegen im Speicher und werden bei jeder Änderung in eine JSON-Datei im Dokumente-Ordner
 * geschrieben, damit sie App-Neustarts überleben.
 */
const file = new File(Paths.document, 'r-agency-mesh-storage.json');

const load = (): Map<string, string> => {
  try {
    if (file.exists) {
      return new Map(Object.entries(JSON.parse(file.textSync()) as Record<string, string>));
    }
  } catch (error) {
    console.warn('[mesh] storage konnte nicht gelesen werden', error);
  }
  return new Map();
};

const data = load();

const persist = () => {
  try {
    if (!file.exists) file.create();
    file.write(JSON.stringify(Object.fromEntries(data)));
  } catch (error) {
    console.warn('[mesh] storage konnte nicht geschrieben werden', error);
  }
};

export const meshStorage: Storage = {
  get length() {
    return data.size;
  },
  key: (index: number) => Array.from(data.keys())[index] ?? null,
  getItem: (key: string) => data.get(key) ?? null,
  setItem: (key: string, value: string) => {
    data.set(key, String(value));
    persist();
  },
  removeItem: (key: string) => {
    if (data.delete(key)) persist();
  },
  clear: () => {
    data.clear();
    persist();
  },
};
