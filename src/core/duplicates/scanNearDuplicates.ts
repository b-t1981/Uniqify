import type { PhotoFile, PhotoGroup } from '@/core/types/photo'
import { photoCacheKey } from '@/core/types/photo'
import { hammingDistance, similarityPercent } from '@/core/hash/hamming'
import type { PHashWorkerResponse } from '@/core/duplicates/phash.worker'
import { idle, loadThumbnailForScan, SCAN_BATCH_SIZE } from '@/core/photos/loadBytesForScan'
import { getCachedHashPHash, setCachedHashPHash } from '@/core/storage/scanCache'
import { withTimeout } from '@/core/utils/async'

const PHASH_WORKER_TIMEOUT_MS = 45_000

export const PHASH_MAX_DISTANCE = 10
const PHASH_BUCKET_PREFIX = 8

export interface NearScanProgress {
  phase: 'hashing' | 'comparing' | 'grouping'
  processed: number
  total: number
  currentName: string
}

let phashWorker: Worker | null = null

function getPHashWorker(): Worker {
  if (!phashWorker) {
    phashWorker = new Worker(new URL('./phash.worker.ts', import.meta.url), {
      type: 'module',
    })
  }
  return phashWorker
}

function pHashFileInWorker(photoId: string, file: File, photoName: string): Promise<string> {
  const work = new Promise<string>((resolve, reject) => {
    const worker = getPHashWorker()

    function onMessage(event: MessageEvent<PHashWorkerResponse>) {
      if (event.data.id !== photoId) return
      worker.removeEventListener('message', onMessage)
      worker.removeEventListener('error', onError)
      resolve(event.data.hash)
    }

    function onError(error: ErrorEvent) {
      worker.removeEventListener('message', onMessage)
      worker.removeEventListener('error', onError)
      reject(error.error ?? new Error('Échec du calcul pHash'))
    }

    worker.addEventListener('message', onMessage)
    worker.addEventListener('error', onError)
    worker.postMessage({ id: photoId, file })
  })

  return withTimeout(
    work,
    PHASH_WORKER_TIMEOUT_MS,
    `Analyse proche trop longue : ${photoName}`,
  )
}

async function resolvePHash(photo: PhotoFile): Promise<string | null> {
  if (photo.hashPHash) return photo.hashPHash

  const cacheKey = photoCacheKey(photo)
  const cached = await getCachedHashPHash(cacheKey)
  if (cached) {
    photo.hashPHash = cached
    return cached
  }

  try {
    const file = await loadThumbnailForScan(photo, 512)
    const hash = await pHashFileInWorker(photo.id, file, photo.name)
    photo.hashPHash = hash
    await setCachedHashPHash(cacheKey, hash)
    return hash
  } catch {
    return null
  }
}

function sizesAreComparable(a: PhotoFile, b: PhotoFile): boolean {
  const ratio = a.size / Math.max(b.size, 1)
  return ratio >= 0.4 && ratio <= 2.5
}

class UnionFind {
  private parent: number[]

  constructor(size: number) {
    this.parent = Array.from({ length: size }, (_, index) => index)
  }

  find(index: number): number {
    let root = index
    while (this.parent[root] !== root) {
      this.parent[root] = this.parent[this.parent[root]!]!
      root = this.parent[root]!
    }
    return root
  }

  union(a: number, b: number): void {
    const rootA = this.find(a)
    const rootB = this.find(b)
    if (rootA !== rootB) this.parent[rootB] = rootA
  }
}

function computeGroupSimilarity(hashes: string[]): number {
  const reference = hashes[0]
  if (!reference) return 0

  let bestDistance = hashes.length > 1 ? PHASH_MAX_DISTANCE : 0

  for (let i = 1; i < hashes.length; i++) {
    const hash = hashes[i]
    if (!hash) continue
    bestDistance = Math.min(bestDistance, hammingDistance(reference, hash))
  }

  return similarityPercent(bestDistance)
}

function bucketKey(hash: string): string {
  return hash.slice(0, PHASH_BUCKET_PREFIX)
}

export async function scanNearDuplicates(
  photos: PhotoFile[],
  onProgress?: (progress: NearScanProgress) => void,
  signal?: AbortSignal,
): Promise<PhotoGroup[]> {
  if (photos.length < 2) return []

  const hashes: Array<string | null> = []

  for (let i = 0; i < photos.length; i++) {
    if (signal?.aborted) throw new DOMException('Analyse annulée', 'AbortError')

    const photo = photos[i]!
    onProgress?.({
      phase: 'hashing',
      processed: i + 1,
      total: photos.length,
      currentName: photo.name,
    })

    hashes.push(await resolvePHash(photo))

    if ((i + 1) % SCAN_BATCH_SIZE === 0) {
      await idle(8)
    } else {
      await idle()
    }
  }

  const indexed = photos
    .map((photo, index) => ({ photo, index, hash: hashes[index] }))
    .filter((item): item is { photo: PhotoFile; index: number; hash: string } =>
      Boolean(item.hash),
    )

  const buckets = new Map<string, number[]>()
  for (const item of indexed) {
    const key = bucketKey(item.hash)
    const list = buckets.get(key) ?? []
    list.push(item.index)
    buckets.set(key, list)
  }

  const unionFind = new UnionFind(photos.length)
  const bucketKeys = [...buckets.keys()]
  let comparedPairs = 0
  const compareTotal = bucketKeys.reduce((sum, key) => {
    const size = buckets.get(key)?.length ?? 0
    return sum + (size * (size - 1)) / 2
  }, 0)

  for (const key of bucketKeys) {
    const indices = buckets.get(key) ?? []

    for (let a = 0; a < indices.length; a++) {
      for (let b = a + 1; b < indices.length; b++) {
        if (signal?.aborted) throw new DOMException('Analyse annulée', 'AbortError')

        comparedPairs++
        if (comparedPairs === 1 || comparedPairs % 25 === 0) {
          onProgress?.({
            phase: 'comparing',
            processed: comparedPairs,
            total: Math.max(compareTotal, 1),
            currentName: 'Comparaison…',
          })
        }

        const indexA = indices[a]!
        const indexB = indices[b]!
        const photoA = photos[indexA]!
        const photoB = photos[indexB]!
        if (!sizesAreComparable(photoA, photoB)) continue

        const hashA = hashes[indexA]!
        const hashB = hashes[indexB]!
        if (hammingDistance(hashA, hashB) <= PHASH_MAX_DISTANCE) {
          unionFind.union(indexA, indexB)
        }
      }
    }

    if (comparedPairs % 50 === 0) await idle(4)
  }

  onProgress?.({
    phase: 'grouping',
    processed: Math.max(compareTotal, 1),
    total: Math.max(compareTotal, 1),
    currentName: '',
  })

  const clusters = new Map<number, { photos: PhotoFile[]; hashes: string[] }>()

  for (const { photo, index, hash } of indexed) {
    const root = unionFind.find(index)
    const bucket = clusters.get(root) ?? { photos: [], hashes: [] }
    bucket.photos.push(photo)
    bucket.hashes.push(hash)
    clusters.set(root, bucket)
  }

  const groups: PhotoGroup[] = []

  for (const cluster of clusters.values()) {
    if (cluster.photos.length < 2) continue

    groups.push({
      id: crypto.randomUUID(),
      photos: cluster.photos,
      type: 'near',
      similarity: computeGroupSimilarity(cluster.hashes),
    })
  }

  groups.sort((a, b) => {
    const sizeDiff = b.photos.length - a.photos.length
    if (sizeDiff !== 0) return sizeDiff
    return (b.similarity ?? 0) - (a.similarity ?? 0)
  })

  return groups
}
