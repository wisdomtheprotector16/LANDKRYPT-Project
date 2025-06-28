// SSR Polyfills for Browser APIs
// This file should be imported early in the application lifecycle

// Check if we're in a server environment
const isServer = typeof window === 'undefined';

if (isServer) {
  // Polyfill IndexedDB for server-side rendering
  global.indexedDB = global.indexedDB || {
    open: () => ({
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      result: {
        close: () => {},
        createObjectStore: () => ({
          add: () => ({ onsuccess: null, onerror: null }),
          put: () => ({ onsuccess: null, onerror: null }),
          get: () => ({ onsuccess: null, onerror: null }),
          delete: () => ({ onsuccess: null, onerror: null }),
          clear: () => ({ onsuccess: null, onerror: null }),
          createIndex: () => {},
          deleteIndex: () => {},
        }),
        deleteObjectStore: () => {},
        transaction: () => ({
          objectStore: () => ({
            add: () => ({ onsuccess: null, onerror: null }),
            put: () => ({ onsuccess: null, onerror: null }),
            get: () => ({ onsuccess: null, onerror: null }),
            delete: () => ({ onsuccess: null, onerror: null }),
            clear: () => ({ onsuccess: null, onerror: null }),
            getAll: () => ({ onsuccess: null, onerror: null }),
            count: () => ({ onsuccess: null, onerror: null }),
          }),
          oncomplete: null,
          onerror: null,
          onabort: null,
        }),
      },
    }),
    deleteDatabase: () => ({
      onsuccess: null,
      onerror: null,
      onblocked: null,
    }),
    cmp: () => 0,
  };

  // Polyfill IDBKeyRange for server-side rendering
  global.IDBKeyRange = global.IDBKeyRange || {
    bound: () => ({}),
    only: () => ({}),
    lowerBound: () => ({}),
    upperBound: () => ({}),
  };

  // Polyfill localStorage for server-side rendering
  global.localStorage = global.localStorage || {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    length: 0,
    key: () => null,
  };

  // Polyfill sessionStorage for server-side rendering
  global.sessionStorage = global.sessionStorage || {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    length: 0,
    key: () => null,
  };

  // Polyfill navigator for server-side rendering (only if not exists)
  if (typeof global.navigator === 'undefined') {
    try {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'node',
          platform: 'node',
          language: 'en-US',
          languages: ['en-US'],
          onLine: true,
        },
        writable: false,
        configurable: true
      });
    } catch (e) {
      // Ignore if property already exists
    }
  }

  // Polyfill location for server-side rendering (only if not exists)
  if (typeof global.location === 'undefined') {
    try {
      Object.defineProperty(global, 'location', {
        value: {
          href: 'http://localhost:3000',
          origin: 'http://localhost:3000',
          protocol: 'http:',
          host: 'localhost:3000',
          hostname: 'localhost',
          port: '3000',
          pathname: '/',
          search: '',
          hash: '',
          reload: () => {},
          replace: () => {},
          assign: () => {},
        },
        writable: false,
        configurable: true
      });
    } catch (e) {
      // Ignore if property already exists
    }
  }

  // Polyfill fetch for server-side if not available
  if (!global.fetch) {
    global.fetch = async () => ({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ error: 'Fetch not available on server' }),
      text: async () => 'Fetch not available on server',
    });
  }

  // Polyfill crypto for server-side rendering
  if (!global.crypto) {
    global.crypto = {
      getRandomValues: (arr) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      },
      randomUUID: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      }),
    };
  }

  // Polyfill requestAnimationFrame for server-side rendering
  global.requestAnimationFrame = global.requestAnimationFrame || ((fn) => setTimeout(fn, 16));
  global.cancelAnimationFrame = global.cancelAnimationFrame || clearTimeout;

  // Polyfill performance for server-side rendering
  global.performance = global.performance || {
    now: () => Date.now(),
    timing: {},
    navigation: {},
  };
}

// Export utility functions for safe browser API access
export const isBrowser = !isServer;
export const isServerSide = isServer;

export const safeWindow = isServer ? {} : window;
export const safeDocument = isServer ? {} : (typeof document !== 'undefined' ? document : {});
export const safeNavigator = isServer ? global.navigator : navigator;
export const safeLocation = isServer ? global.location : location;

// Safe API access functions
export const safeIndexedDB = () => {
  if (isServer) return global.indexedDB;
  return typeof window !== 'undefined' && window.indexedDB ? window.indexedDB : null;
};

export const safeLocalStorage = () => {
  if (isServer) return global.localStorage;
  return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
};

export const safeSessionStorage = () => {
  if (isServer) return global.sessionStorage;
  return typeof window !== 'undefined' && window.sessionStorage ? window.sessionStorage : null;
};

console.log('🔧 SSR Polyfills initialized successfully');
