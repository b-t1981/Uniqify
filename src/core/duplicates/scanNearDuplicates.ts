import type { PhotoFile, PhotoGroup } from '@/core/types/photo'
import { hammingDistance, similarityPercent } from '@/core/hash/hamming'
import type { PHashWorkerResponse } from '@/core/duplicates/phash.worker'

export const PHASH_MAX_DISTANCE = 10

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

function pHashPhotoInWorker(photo: PhotoFile): Promise<string> {
  return new Promise((resolve, reject) => {
    const worker = getPHashWorker()

    function onMessage(event: MessageEvent<PHashWorkerResponse>) {
      if (event.data.id !== photo.id) return
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
    worker.postMessage({ id: photo.id, file: photo.file })
  })
}

function sizesAreComparable(a: PhotoFile, b: PhotoFile): boolean {
  const ratio = a.size / b.size
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

export async function scanNearDuplicates(
  photos: PhotoFile[],
  onProgress?: (progress: NearScanProgress) => void,
): Promise<PhotoGroup[]> {
  if (photos.length < 2) return []

  const hashes: string[] = []

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]!
    onProgress?.({
      phase: 'hashing',
      processed: i + 1,
      total: photos.length,
      currentName: photo.name,
    })

    hashes.push(await pHashPhotoInWorker(photo))

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve())
    })
  }

  const unionFind = new UnionFind(photos.length)
  const totalPairs = (photos.length * (photos.length - 1)) / 2
  let comparedPairs = 0

  for (let i = 0; i < photos.length; i++) {
    for (let j = i + 1; j < photos.length; j++) {
      comparedPairs++
      onProgress?.({
        phase: 'comparing',
        processed: comparedPairs,
        total: totalPairs,
        currentName: '',
      })

      const photoA = photos[i]!
      const photoB = photos[j]!
      if (!sizesAreComparable(photoA, photoB)) continue

      const hashA = hashes[i]!
      const hashB = hashes[j]!
      if (hammingDistance(hashA, hashB) <= PHASH_MAX_DISTANCE) {
        unionFind.union(i, j)
      }
    }

    if (i % 8 === 0) {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve())
      })
    }
  }

  onProgress?.({
    phase: 'grouping',
    processed: totalPairs,
    total: totalPairs,
    currentName: '',
  })

  const clusters = new Map<number, { photos: PhotoFile[]; hashes: string[] }>()

  for (let i = 0; i < photos.length; i++) {
    const root = unionFind.find(i)
    const bucket = clusters.get(root) ?? { photos: [], hashes: [] }
    bucket.photos.push(photos[i]!)
    bucket.hashes.push(hashes[i]!)
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
