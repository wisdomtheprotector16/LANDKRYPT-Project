// Browser detection and SSR helpers
export const isBrowser = typeof window !== 'undefined';
export const isServer = typeof window === 'undefined';

// Safe browser API access
export const safelyAccessBrowserAPI = (apiName, fallback = null) => {
  if (isServer) return fallback;
  return typeof window[apiName] !== 'undefined' ? window[apiName] : fallback;
};

// IndexedDB safe access
export const getIndexedDB = () => {
  if (isServer) return null;
  return safelyAccessBrowserAPI('indexedDB');
};

// LocalStorage safe access
export const getLocalStorage = () => {
  if (isServer) return null;
  return safelyAccessBrowserAPI('localStorage');
};

// SessionStorage safe access
export const getSessionStorage = () => {
  if (isServer) return null;
  return safelyAccessBrowserAPI('sessionStorage');
};

// Safe document access
export const getDocument = () => {
  if (isServer) return null;
  return typeof document !== 'undefined' ? document : null;
};

// Safe window access
export const getWindow = () => {
  if (isServer) return null;
  return typeof window !== 'undefined' ? window : null;
};

// Create browser polyfills for SSR
export const createBrowserPolyfills = () => {
  if (isServer) {
    // Mock IndexedDB for server-side
    global.indexedDB = {
      open: () => ({
        onsuccess: null,
        onerror: null,
        result: null,
      }),
      deleteDatabase: () => ({}),
      cmp: () => 0,
    };

    // Mock localStorage for server-side
    global.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null,
    };

    // Mock sessionStorage for server-side
    global.sessionStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null,
    };
  }
};

// Initialize polyfills immediately
createBrowserPolyfills();
