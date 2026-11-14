// Browser-local visual preferences only. No conversation data or Host profile writes.
export function createStorage() {
  let database;
  const opened = new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) { reject(new Error('IndexedDB unavailable')); return; }
    const request = indexedDB.open('dsh-e621-style', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('preferences');
    request.onerror = () => reject(request.error || new Error('Cannot open background storage'));
    request.onblocked = () => reject(new Error('Background storage is blocked by another tab'));
    request.onsuccess = () => {
      database = request.result;
      database.onversionchange = () => database.close();
      resolve(database);
    };
  });
  // Avoid unhandled rejection before the asynchronous Client initialization reads it.
  opened.catch(() => {});
  async function transaction(mode, operation) {
    const db = await opened;
    return new Promise((resolve, reject) => {
      let result;
      const tx = db.transaction('preferences', mode);
      const request = operation(tx.objectStore('preferences'));
      request.onsuccess = () => { result = request.result; };
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error || request.error || new Error('Background storage failed'));
      tx.onabort = () => reject(tx.error || new Error('Background storage aborted; storage may be full'));
    });
  }
  return {
    read: () => transaction('readonly', store => store.get('settings')),
    write: value => transaction('readwrite', store => store.put(value, 'settings')),
    close: () => { opened.then(db => db.close(), () => {}); },
  };
}
