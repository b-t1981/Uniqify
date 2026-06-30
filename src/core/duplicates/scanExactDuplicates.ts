import type { PhotoFile, PhotoGroup } from '@/core/types/photo'
import { photoCacheKey } from '@/core/types/photo'
import type { HashWorkerResponse } from '@/core/duplicates/hash.worker'
import { idle, loadFullFileForScan, SCAN_BATCH_SIZE } from '@/core/photos/loadBytesForScan'
import { getCachedHashExact, setCachedHashExact } from '@/core/storage/scanCache'

export interface ExactScanProgress {
  phase: 'hashing' | 'grouping'
  processed: number
  total: number
  currentName: string
}

let hashWorker: Worker | null = null

function getHashWorker(): Worker {
  if (!hashWorker) {
    hashWorker = new Worker(new URL('./hash.worker.ts', import.meta.url), {
      type: 'module',
    })
  }
  return hashWorker
}

function hashFileInWorker(photoId: string, file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const worker = getHashWorker()

    function onMessage(event: MessageEvent<HashWorkerResponse>) {
      if (event.data.id !== photoId) return
      worker.removeEventListener('message', onMessage)
      worker.removeEventListener('error', onError)
      resolve(event.data.hash)
    }

    function onError(error: ErrorEvent) {
      worker.removeEventListener('message', onMessage)
      worker.removeEventListener('error', onError)
      reject(error.error ?? new Error('Échec du calcul de hash'))
    }

    worker.addEventListener('message', onMessage)
    worker.addEventListener('error', onError)
    worker.postMessage({ id: photoId, file })
  })
}

async function resolveExactHash(photo: PhotoFile): Promise<string> {
  if (photo.hashExact) return photo.hashExact

  const cacheKey = photoCacheKey(photo)
  const cached = await getCachedHashExact(cacheKey)
  if (cached) {
    photo.hashExact = cached
    return cached
  }

  const file = await loadFullFileForScan(photo)
  const hash = await hashFileInWorker(photo.id, file)
  photo.hashExact = hash
  await setCachedHashExact(cacheKey, hash)
  return hash
}

function groupCandidatesBySize(photos: PhotoFile[]): PhotoFile[] {
  const bySize = new Map<number, PhotoFile[]>()

  for (const photo of photos) {
    const bucket = bySize.get(photo.size) ?? []
    bucket.push(photo)
    bySize.set(photo.size, bucket)
  }

  const candidates: PhotoFile[] = []
  for (const bucket of bySize.values()) {
    if (bucket.length > 1) candidates.push(...bucket)
  }

  return candidates
}

export async function scanExactDuplicates(
  photos: PhotoFile[],
  onProgress?: (progress: ExactScanProgress) => void,
  signal?: AbortSignal,
): Promise<PhotoGroup[]> {
  const candidates = groupCandidatesBySize(photos)

  if (candidates.length === 0) {
    onProgress?.({
      phase: 'grouping',
      processed: photos.length,
      total: photos.length,
      currentName: '',
    })
    return []
  }

  const hashByPhotoId = new Map<string, string>()

  for (let i = 0; i < candidates.length; i++) {
    if (signal?.aborted) throw new DOMException('Analyse annulée', 'AbortError')

    const photo = candidates[i]!
    onProgress?.({
      phase: 'hashing',
      processed: i + 1,
      total: candidates.length,
      currentName: photo.name,
    })

    try {
      const hash = await resolveExactHash(photo)
      hashByPhotoId.set(photo.id, hash)
    } catch {
      // Photo iCloud hors ligne ou fichier inaccessible — ignorée pour ce scan
    }

    if ((i + 1) % SCAN_BATCH_SIZE === 0) {
      await idle(8)
    } else {
      await idle()
    }
  }

  onProgress?.({
    phase: 'grouping',
    processed: candidates.length,
    total: candidates.length,
    currentName: '',
  })

  const byHash = new Map<string, PhotoFile[]>()

  for (const photo of candidates) {
    const hash = hashByPhotoId.get(photo.id)
    if (!hash) continue

    const bucket = byHash.get(hash) ?? []
    bucket.push(photo)
    byHash.set(hash, bucket)
  }

  const groups: PhotoGroup[] = []

  for (const bucket of byHash.values()) {
    if (bucket.length < 2) continue

    groups.push({
      id: crypto.randomUUID(),
      photos: bucket,
      type: 'exact',
    })
  }

  groups.sort((a, b) => b.photos.length - a.photos.length)

  return groups
}
