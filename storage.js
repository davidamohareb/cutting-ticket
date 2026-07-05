// storage.js — saves app data locally on this device using IndexedDB.
// Mimics the same window.storage.get/set/delete/list API the app already uses,
// so no other code needs to change.
(function () {
  const DB_NAME = "cutting-ticket-db";
  const STORE = "kv";
  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(STORE, { keyPath: "key" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function get(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result ? { key, value: req.result.value, shared: false } : null);
      req.onerror = () => reject(req.error);
    });
  }

  async function set(key, value) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ key, value });
      tx.oncomplete = () => resolve({ key, value, shared: false });
      tx.onerror = () => reject(tx.error);
    });
  }

  async function del(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve({ key, deleted: true, shared: false });
      tx.onerror = () => reject(tx.error);
    });
  }

  async function list(prefix) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAllKeys();
      req.onsuccess = () => {
        let keys = req.result;
        if (prefix) keys = keys.filter((k) => String(k).startsWith(prefix));
        resolve({ keys, prefix, shared: false });
      };
      req.onerror = () => reject(req.error);
    });
  }

  window.storage = { get, set, delete: del, list };
})();
