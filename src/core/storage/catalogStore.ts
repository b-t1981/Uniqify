import type { PhotoFile, PhotoGroup, ScanResult } from '@/core/types/photo'
import { APP_STATE_KEY, APP_STATE_STORE, withStore } from '@/core/storage/db'
import { deferToIdle } from '@/core/utils/async'

export interface StoredPhotoFile {
  id: string
  name: string
  size: number
  lastModified: number
  source: PhotoFile['source']
  mimeType?: string
  width?: number
  height?: number
  thumbnailUrl?: string
  nativeAssetId?: string
  hashExact?: string
  hashPHash?: string
}

interface StoredPhotoGroup {
  id: string
  photoIds: string[]
  type: PhotoGroup['type']
  similarity?: number
  qualityIssues?: PhotoGroup['qualityIssues']
  qualityScores?: PhotoGroup['qualityScores']
}

interface StoredScanResult {
  photoIds: string[]
  exactDuplicates: StoredPhotoGroup[]
  nearDuplicates: StoredPhotoGroup[]
  lowQuality: StoredPhotoGroup[]
}

interface StoredAppSession {
  key: string
  photos: StoredPhotoFile[]
  scanResult: StoredScanResult | null
  analyzedPhotoIds?: string[]
  updatedAt: number
}

function toStoredPhoto(photo: PhotoFile): StoredPhotoFile {
  return {
    id: photo.id,
    name: photo.name,
    size: photo.size,
    lastModified: photo.lastModified,
    source: photo.source,
    mimeType: photo.mimeType,
    width: photo.width,
    height: photo.height,
    thumbnailUrl: photo.thumbnailUrl,
    nativeAssetId: photo.nativeAssetId,
    hashExact: photo.hashExact,
    hashPHash: photo.hashPHash,
  }
}

function fromStoredPhoto(stored: StoredPhotoFile): PhotoFile {
  return { ...stored }
}

function toStoredGroup(group: PhotoGroup): StoredPhotoGroup {
  return {
    id: group.id,
    photoIds: group.photos.map((photo) => photo.id),
    type: group.type,
    similarity: group.similarity,
    qualityIssues: group.qualityIssues,
    qualityScores: group.qualityScores,
  }
}

function fromStoredGroup(group: StoredPhotoGroup, photosById: Map<string, PhotoFile>): PhotoGroup | null {
  const photos = group.photoIds
    .map((id) => photosById.get(id))
    .filter((photo): photo is PhotoFile => Boolean(photo))

  if (photos.length === 0) return null
  if (group.type !== 'low-quality' && photos.length < 2) return null

  return {
    id: group.id,
    photos,
    type: group.type,
    similarity: group.similarity,
    qualityIssues: group.qualityIssues,
    qualityScores: group.qualityScores,
  }
}

function toStoredScanResult(result: ScanResult): StoredScanResult {
  return {
    photoIds: result.photos.map((photo) => photo.id),
    exactDuplicates: result.exactDuplicates.map(toStoredGroup),
    nearDuplicates: result.nearDuplicates.map(toStoredGroup),
    lowQuality: result.lowQuality.map(toStoredGroup),
  }
}

function fromStoredScanResult(
  stored: StoredScanResult,
  photosById: Map<string, PhotoFile>,
): ScanResult {
  const relinkGroups = (groups: StoredPhotoGroup[]) =>
    groups
      .map((group) => fromStoredGroup(group, photosById))
      .filter((group): group is PhotoGroup => group !== null)

  const photos = stored.photoIds
    .map((id) => photosById.get(id))
    .filter((photo): photo is PhotoFile => Boolean(photo))

  return {
    photos,
    exactDuplicates: relinkGroups(stored.exactDuplicates),
    nearDuplicates: relinkGroups(stored.nearDuplicates),
    lowQuality: relinkGroups(stored.lowQuality),
  }
}

export async function loadAppSession(): Promise<{
  photos: PhotoFile[]
  scanResult: ScanResult | null
  analyzedPhotoIds: string[]
}> {
  try {
    const stored = (await withStore(APP_STATE_STORE, 'readonly', (store) =>
      store.get(APP_STATE_KEY),
    )) as StoredAppSession | undefined

    if (!stored?.photos?.length) {
      return { photos: [], scanResult: null, analyzedPhotoIds: [] }
    }

    const photos = stored.photos.map(fromStoredPhoto)
    const photosById = new Map(photos.map((photo) => [photo.id, photo]))
    const scanResult = stored.scanResult
      ? fromStoredScanResult(stored.scanResult, photosById)
      : null

    return {
      photos,
      scanResult,
      analyzedPhotoIds:
        stored.analyzedPhotoIds?.length
          ? stored.analyzedPhotoIds
          : (stored.scanResult?.photoIds ?? []),
    }
  } catch {
    return { photos: [], scanResult: null, analyzedPhotoIds: [] }
  }
}

export async function saveAppSession(
  photos: PhotoFile[],
  scanResult: ScanResult | null,
  analyzedPhotoIds: string[],
): Promise<void> {
  try {
    await deferToIdle()
    const payload: StoredAppSession = {
      key: APP_STATE_KEY,
      photos: photos.map(toStoredPhoto),
      scanResult: scanResult ? toStoredScanResult(scanResult) : null,
      analyzedPhotoIds,
      updatedAt: Date.now(),
    }
    await withStore(APP_STATE_STORE, 'readwrite', (store) => store.put(payload))
  } catch {
    // Persistance best-effort
  }
}

export async function clearAppSession(): Promise<void> {
  try {
    await withStore(APP_STATE_STORE, 'readwrite', (store) => store.delete(APP_STATE_KEY))
  } catch {
    // ignore
  }
}
