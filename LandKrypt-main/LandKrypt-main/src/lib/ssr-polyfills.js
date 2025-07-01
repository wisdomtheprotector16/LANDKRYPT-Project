// Advanced SSR Polyfills that avoid property conflicts
// This file should be imported in a separate script before any other imports

const isServer = typeof window === 'undefined';

if (isServer) {
  // Create a comprehensive polyfill for browser APIs
  const createMockAPI = () => ({
    // Mock IndexedDB
    indexedDB: {
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
          }),
        },
      }),
      deleteDatabase: () => ({ onsuccess: null, onerror: null }),
      cmp: () => 0,
    },

    // Mock localStorage
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null,
    },

    // Mock sessionStorage
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null,
    },

    // Mock crypto
    crypto: {
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
    },

    // Mock performance
    performance: {
      now: () => Date.now(),
      timing: {},
      navigation: {},
    },

    // Mock requestAnimationFrame
    requestAnimationFrame: (fn) => setTimeout(fn, 16),
    cancelAnimationFrame: clearTimeout,
  });

// Apply polyfills safely
  const applyPolyfills = () => {
    const mockAPI = createMockAPI();

    Object.keys(mockAPI).forEach(key => {
      if (typeof global[key] === 'undefined') {
        try {
          Object.defineProperty(global, key, {
            value: mockAPI[key],
            writable: true,
            configurable: true
          });
        } catch (error) {
          // Fallback to direct assignment
          try {
            global[key] = mockAPI[key];
          } catch (fallbackError) {
            // Silently ignore if we can't set the property
          }
        }
      }
    });

    // Special handling for IDBKeyRange
    if (typeof global.IDBKeyRange === 'undefined') {
      global.IDBKeyRange = {
        bound: () => ({}),
        only: () => ({}),
        lowerBound: () => ({}),
        upperBound: () => ({}),
      };
    }

    // Special handling for fetch (if needed)
    if (typeof global.fetch === 'undefined') {
      global.fetch = async () => ({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Fetch not available on server' }),
        text: async () => 'Fetch not available on server',
      });
    }
  };

  // Apply polyfills immediately
  applyPolyfills();
}

// Export constants for use in other modules
export const isBrowser = !isServer;
export const isServerEnvironment = isServer;

// Safe getters for browser APIs
export const getSafeWindow = () => (isBrowser ? window : {});
export const getSafeDocument = () => (isBrowser && typeof document !== 'undefined' ? document : {});
export const getSafeIndexedDB = () => (isBrowser && window.indexedDB ? window.indexedDB : global.indexedDB);
export const getSafeLocalStorage = () => (isBrowser && window.localStorage ? window.localStorage : global.localStorage);

// Log success (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Advanced SSR Polyfills loaded successfully');
}
