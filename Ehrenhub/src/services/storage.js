/** Optional browser persistence, isolated so failures can be tested without a DOM. */
(function (root, factory) {
  const storage = factory();
  if (typeof module === 'object' && module.exports) module.exports = storage;
  else root.EH.Storage = storage;
})(globalThis, function () {
  'use strict';

  // Preserve existing browser data. The prefix is NOT the application version.
  const PREFIX = 'ehrenhub.v1.';
  const KEYS = ['bookmarks', 'checks', 'feedback', 'hubiHidden'];

  function createStore(getStorage, prefix = PREFIX) {
    let available = true;
    function read(key, fallback) {
      try {
        return getStorage().getItem(prefix + key) ?? fallback;
      } catch {
        available = false;
        return fallback;
      }
    }
    function readObject(key, validKeys, validValue) {
      try {
        const data = JSON.parse(read(key, '{}'));
        if (!data || Array.isArray(data) || typeof data !== 'object') return {};
        return Object.fromEntries(Object.entries(data).filter(
          ([key, value]) => validKeys.has(key) && validValue(value)
        ));
      } catch {
        return {};
      }
    }
    function write(key, value) {
      try {
        getStorage().setItem(prefix + key, JSON.stringify(value));
        return true;
      } catch {
        available = false;
        return false;
      }
    }
    function clear() {
      let cleared = true;
      for (const key of KEYS) {
        try {
          getStorage().removeItem(prefix + key);
        } catch {
          available = false;
          cleared = false;
        }
      }
      return cleared;
    }
    return { read, readObject, write, clear, get available() { return available; } };
  }

  return { createStore, PREFIX };
});
