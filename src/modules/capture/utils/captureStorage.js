// captureStorage.js — IndexedDB wrapper para media capturado

const DB_NAME = 'frame-capture-media'
const DB_VERSION = 1
const STORE_NAME = 'media'

let dbPromise = null

function openDB() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('createdAt', 'createdAt', { unique: false })
      }
    }
    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror = (e) => {
      dbPromise = null
      reject(e.target.error)
    }
  })
  return dbPromise
}

const MAX_BLOB_SIZE = 50 * 1024 * 1024 // 50MB

export async function saveMedia(id, blob) {
  // Verificar tamanho — rejeitar blobs > 50MB
  if (blob?.size > MAX_BLOB_SIZE) {
    throw new Error(`Ficheiro demasiado grande (${Math.round(blob.size / 1024 / 1024)}MB). Máximo: 50MB.`)
  }

  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.put({ id, blob, createdAt: Date.now() })
    req.onsuccess = () => resolve(id)
    req.onerror = (e) => reject(e.target.error)
  })
}

export async function getMedia(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.get(id)
    req.onsuccess = (e) => resolve(e.target.result?.blob || null)
    req.onerror = (e) => reject(e.target.error)
  })
}

export async function deleteMedia(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.delete(id)
    req.onsuccess = () => resolve()
    req.onerror = (e) => reject(e.target.error)
  })
}

export async function clearOld(maxItems = 100) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const idx = store.index('createdAt')
    const req = idx.openCursor(null, 'prev') // newest first
    const ids = []
    req.onsuccess = (e) => {
      const cursor = e.target.result
      if (cursor) {
        ids.push(cursor.primaryKey)
        cursor.continue()
      } else {
        // delete items beyond maxItems (oldest)
        const toDelete = ids.slice(maxItems)
        toDelete.forEach(id => store.delete(id))
        resolve(toDelete.length)
      }
    }
    req.onerror = (e) => reject(e.target.error)
  })
}
