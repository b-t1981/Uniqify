import type { PhotoFile } from '@/core/types/photo'
import {
  ensureGalleryDeleteAccess,
  UniqifyPhotos,
} from '@/platforms/native/uniqifyPhotosPlugin'
import { deferToIdle, withTimeout } from '@/core/utils/async'

export interface DiskDeleteFailure {
  id: string
  name: string
  reason: string
}

export interface DiskDeleteResult {
  deleted: string[]
  skipped: string[]
  failed: DiskDeleteFailure[]
}

const NATIVE_DELETE_BATCH = 25
const NATIVE_DELETE_TIMEOUT_MS = 120_000

async function deleteNativeBatch(photos: PhotoFile[]): Promise<{
  deleted: string[]
  failed: DiskDeleteFailure[]
}> {
  const ids = photos.map((photo) => photo.nativeAssetId!)
  const result = await withTimeout(
    UniqifyPhotos.deleteAssets({ ids }),
    NATIVE_DELETE_TIMEOUT_MS,
    'Suppression galerie trop longue',
  )

  const deleted: string[] = []
  const failed: DiskDeleteFailure[] = []
  const deletedSet = new Set(result.deleted)
  const failedSet = new Set(result.failed)

  for (const photo of photos) {
    const assetId = photo.nativeAssetId!
    if (deletedSet.has(assetId)) {
      deleted.push(photo.id)
    } else if (failedSet.has(assetId)) {
      failed.push({
        id: photo.id,
        name: photo.name,
        reason: 'Photo introuvable ou accès limité à la photothèque',
      })
    } else {
      failed.push({
        id: photo.id,
        name: photo.name,
        reason: 'Suppression refusée dans la galerie',
      })
    }
  }

  return { deleted, failed }
}

export async function deletePhotosFromDisk(
  photos: PhotoFile[],
): Promise<DiskDeleteResult> {
  const result: DiskDeleteResult = {
    deleted: [],
    skipped: [],
    failed: [],
  }

  const nativePhotos = photos.filter((photo) => photo.nativeAssetId)
  const diskPhotos = photos.filter((photo) => photo.diskHandle && !photo.nativeAssetId)
  const sessionOnly = photos.filter(
    (photo) => !photo.nativeAssetId && !photo.diskHandle,
  )

  if (nativePhotos.length > 0) {
    try {
      await ensureGalleryDeleteAccess()

      for (let index = 0; index < nativePhotos.length; index += NATIVE_DELETE_BATCH) {
        const batch = nativePhotos.slice(index, index + NATIVE_DELETE_BATCH)
        const batchResult = await deleteNativeBatch(batch)
        result.deleted.push(...batchResult.deleted)
        result.failed.push(...batchResult.failed)
        await deferToIdle()
      }
    } catch (error) {
      for (const photo of nativePhotos) {
        if (result.deleted.includes(photo.id) || result.failed.some((item) => item.id === photo.id)) {
          continue
        }
        result.failed.push({
          id: photo.id,
          name: photo.name,
          reason: error instanceof Error ? error.message : 'Suppression galerie impossible',
        })
      }
    }
  }

  for (const photo of diskPhotos) {
    try {
      await photo.diskHandle!.remove()
      result.deleted.push(photo.id)
    } catch (error) {
      result.failed.push({
        id: photo.id,
        name: photo.name,
        reason: error instanceof Error ? error.message : 'Suppression impossible',
      })
    }
    await deferToIdle()
  }

  for (const photo of sessionOnly) {
    result.skipped.push(photo.id)
  }

  return result
}

export function formatDiskDeleteResult(
  result: DiskDeleteResult,
  options?: { fromGallery?: boolean },
): string {
  const parts: string[] = []
  const fromGallery = options?.fromGallery ?? false

  if (result.deleted.length > 0) {
    parts.push(
      fromGallery
        ? `${result.deleted.length} photo${result.deleted.length > 1 ? 's' : ''} supprimée${result.deleted.length > 1 ? 's' : ''} de la galerie`
        : `${result.deleted.length} photo${result.deleted.length > 1 ? 's' : ''} supprimée${result.deleted.length > 1 ? 's' : ''}`,
    )
  }

  if (result.skipped.length > 0) {
    parts.push(
      `${result.skipped.length} retirée${result.skipped.length > 1 ? 's' : ''} de la session uniquement`,
    )
  }

  if (result.failed.length > 0) {
    parts.push(
      `${result.failed.length} échec${result.failed.length > 1 ? 's' : ''} de suppression`,
    )
  }

  return parts.join(' · ')
}

export function hasDiskDeleteFailures(result: DiskDeleteResult): boolean {
  return result.failed.length > 0
}
