const DB_NAME = 'uniqify'
const DB_VERSION = 2
const SCAN_CACHE_STORE = 'scanCache'
const APP_STATE_STORE = 'appState'
const APP_STATE_KEY = 'session'

export { DB_NAME, DB_VERSION, SCAN_CACHE_STORE, APP_STATE_STORE, APP_STATE_KEY }

export function openUniqifyDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB indisponible'))
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(SCAN_CACHE_STORE)) {
        db.createObjectStore(SCAN_CACHE_STORE, { keyPath: 'key' })
      }
      if (!db.objectStoreNames.contains(APP_STATE_STORE)) {
        db.createObjectStore(APP_STATE_STORE, { keyPath: 'key' })
      }
    }
    request.onsuccess = () => resolve(request.result)
  })
}

export function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openUniqifyDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(storeName, mode)
        const store = tx.objectStore(storeName)
        const request = run(store)
        request.onsuccess = () => resolve(request.result as T)
        request.onerror = () => reject(request.error ?? new Error('Erreur IndexedDB'))
        tx.oncomplete = () => db.close()
        tx.onerror = () => reject(tx.error ?? new Error('Transaction IndexedDB échouée'))
      }),
  )
}
