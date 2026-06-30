import { SCAN_CACHE_STORE, withStore } from '@/core/storage/db'

export interface ScanCacheEntry {
  key: string
  hashExact?: string
  hashPHash?: string
  updatedAt: number
}

export async function getScanCacheEntry(key: string): Promise<ScanCacheEntry | null> {
  try {
    return (await withStore(SCAN_CACHE_STORE, 'readonly', (store) => store.get(key))) ?? null
  } catch {
    return null
  }
}

export async function putScanCacheEntry(entry: ScanCacheEntry): Promise<void> {
  try {
    await withStore(SCAN_CACHE_STORE, 'readwrite', (store) => store.put(entry))
  } catch {
    // Cache optionnel — ne bloque pas l'analyse
  }
}

export async function getCachedHashExact(key: string): Promise<string | undefined> {
  const entry = await getScanCacheEntry(key)
  return entry?.hashExact
}

export async function getCachedHashPHash(key: string): Promise<string | undefined> {
  const entry = await getScanCacheEntry(key)
  return entry?.hashPHash
}

export async function setCachedHashExact(key: string, hashExact: string): Promise<void> {
  const existing = (await getScanCacheEntry(key)) ?? { key, updatedAt: Date.now() }
  await putScanCacheEntry({ ...existing, key, hashExact, updatedAt: Date.now() })
}

export async function setCachedHashPHash(key: string, hashPHash: string): Promise<void> {
  const existing = (await getScanCacheEntry(key)) ?? { key, updatedAt: Date.now() }
  await putScanCacheEntry({ ...existing, key, hashPHash, updatedAt: Date.now() })
}
