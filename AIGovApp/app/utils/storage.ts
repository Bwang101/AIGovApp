// Simple storage wrapper that prefers @react-native-async-storage/async-storage
// but gracefully falls back to an in-memory implementation if the package
// isn't installed (so the app still runs in environments without the native
// module).

type KV = { [key: string]: string };

let impl: any = null;

try {
  // dynamic require so bundlers that don't have the package won't fail at build-time
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const AsyncStorage = require('@react-native-async-storage/async-storage');
  impl = {
    getItem: AsyncStorage.getItem.bind(AsyncStorage),
    setItem: AsyncStorage.setItem.bind(AsyncStorage),
    removeItem: AsyncStorage.removeItem.bind(AsyncStorage),
  };
} catch (e) {
  const store: KV = {};
  impl = {
    getItem: async (k: string) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
    setItem: async (k: string, v: string) => {
      store[k] = v;
      return v;
    },
    removeItem: async (k: string) => {
      delete store[k];
    },
  };
}

export default impl;
