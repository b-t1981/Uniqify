import type { PhotoFile } from '@/core/types/photo'
import { formatDuration } from '@/core/scan/formatDuration'

export const DEFAULT_SCAN_BATCH_SIZE = 1000

/** Temps moyen par photo (secondes) — ajusté empiriquement pour mobile / web. */
const SEC_EXACT_CACHED = 0.01
const SEC_EXACT_NEW = 0.18
const SEC_NEAR_CACHED = 0.01
const SEC_NEAR_NEW = 0.28
const SEC_QUALITY = 0.12

export type ScanScopeMode = 'full' | 'batch'

export interface PreAnalysis {
  totalPhotos: number
  alreadyAnalyzed: number
  remainingPhotos: number
  batchSize: number
  batchPhotoCount: number
  batchIterations: number
  estimatedSecondsFull: number
  estimatedSecondsBatch: number
  estimatedLabelFull: string
  estimatedLabelBatch: string
  oldestFirst: PhotoFile[]
  nextBatch: PhotoFile[]
}

export function sortPhotosOldestFirst(photos: PhotoFile[]): PhotoFile[] {
  return [...photos].sort((a, b) => {
    if (a.lastModified !== b.lastModified) return a.lastModified - b.lastModified
    return a.name.localeCompare(b.name)
  })
}

function estimateSecondsForPhotos(photos: PhotoFile[]): number {
  let total = 0
  for (const photo of photos) {
    total += photo.hashExact ? SEC_EXACT_CACHED : SEC_EXACT_NEW
    if (photos.length >= 2) {
      total += photo.hashPHash ? SEC_NEAR_CACHED : SEC_NEAR_NEW
    }
    total += SEC_QUALITY
  }
  return total
}

export function buildPreAnalysis(
  photos: PhotoFile[],
  analyzedPhotoIds: ReadonlySet<string>,
  batchSize = DEFAULT_SCAN_BATCH_SIZE,
): PreAnalysis {
  const oldestFirst = sortPhotosOldestFirst(photos)
  const remaining = oldestFirst.filter((photo) => !analyzedPhotoIds.has(photo.id))
  const nextBatch = remaining.slice(0, batchSize)
  const batchIterations =
    remaining.length === 0 ? 0 : Math.ceil(remaining.length / batchSize)

  const estimatedSecondsFull = estimateSecondsForPhotos(remaining)
  const estimatedSecondsBatch = estimateSecondsForPhotos(nextBatch)

  return {
    totalPhotos: photos.length,
    alreadyAnalyzed: photos.length - remaining.length,
    remainingPhotos: remaining.length,
    batchSize,
    batchPhotoCount: nextBatch.length,
    batchIterations,
    estimatedSecondsFull,
    estimatedSecondsBatch,
    estimatedLabelFull: formatDuration(estimatedSecondsFull),
    estimatedLabelBatch: formatDuration(estimatedSecondsBatch),
    oldestFirst,
    nextBatch,
  }
}

export function resolveScanScope(
  photos: PhotoFile[],
  analyzedPhotoIds: ReadonlySet<string>,
  mode: ScanScopeMode,
  batchSize = DEFAULT_SCAN_BATCH_SIZE,
): PhotoFile[] {
  const pre = buildPreAnalysis(photos, analyzedPhotoIds, batchSize)
  if (pre.remainingPhotos === 0) {
    return sortPhotosOldestFirst(photos)
  }
  if (mode === 'full') {
    return oldestFirstRemaining(photos, analyzedPhotoIds)
  }
  return pre.nextBatch
}

function oldestFirstRemaining(
  photos: PhotoFile[],
  analyzedPhotoIds: ReadonlySet<string>,
): PhotoFile[] {
  return sortPhotosOldestFirst(photos).filter((photo) => !analyzedPhotoIds.has(photo.id))
}
