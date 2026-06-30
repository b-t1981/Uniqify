import { Capacitor } from '@capacitor/core'
import { Filesystem } from '@capacitor/filesystem'
import { PhotoLibrary } from '@capgo/capacitor-photo-library'
import type { PhotoFile } from '@/core/types/photo'
import { withTimeout } from '@/core/utils/async'

const NATIVE_LOAD_TIMEOUT_MS = 45_000

async function blobFromNativePath(path: string, mimeType: string): Promise<Blob> {
  const content = await withTimeout(
    Filesystem.readFile({ path }),
    NATIVE_LOAD_TIMEOUT_MS,
    'Lecture photo trop longue (iCloud ?)',
  )
  if (typeof content.data === 'string') {
    const response = await fetch(`data:${mimeType};base64,${content.data}`)
    return response.blob()
  }
  return content.data
}

function toFile(blob: Blob, photo: PhotoFile): File {
  return new File([blob], photo.name, {
    type: photo.mimeType || blob.type || 'image/jpeg',
    lastModified: photo.lastModified,
  })
}

export async function loadFullFileForScan(photo: PhotoFile): Promise<File> {
  if (photo.file) return photo.file

  if (photo.nativeAssetId) {
    const full = await withTimeout(
      PhotoLibrary.getPhotoUrl({ id: photo.nativeAssetId }),
      NATIVE_LOAD_TIMEOUT_MS,
      `Photo inaccessible : ${photo.name}`,
    )
    const blob = await blobFromNativePath(full.path, full.mimeType || photo.mimeType || 'image/jpeg')
    return toFile(blob, photo)
  }

  if (photo.diskHandle) {
    photo.file = await photo.diskHandle.getFile()
    return photo.file
  }

  throw new Error(`Impossible de charger ${photo.name}`)
}

export async function loadThumbnailForScan(photo: PhotoFile, size = 512): Promise<File> {
  if (photo.file) return photo.file

  if (photo.nativeAssetId) {
    const thumb = await withTimeout(
      PhotoLibrary.getThumbnailUrl({
        id: photo.nativeAssetId,
        width: size,
        height: size,
        quality: 0.82,
      }),
      NATIVE_LOAD_TIMEOUT_MS,
      `Miniature inaccessible : ${photo.name}`,
    )
    const blob = await blobFromNativePath(
      thumb.path,
      thumb.mimeType || photo.mimeType || 'image/jpeg',
    )
    return toFile(blob, photo)
  }

  return loadFullFileForScan(photo)
}

export async function resolvePhotoThumbnailUrl(
  photo: PhotoFile,
  size = 280,
): Promise<string | null> {
  if (photo.thumbnailUrl) return photo.thumbnailUrl

  if (photo.file) {
    return createThumbnailObjectUrl(photo.file, size)
  }

  if (photo.nativeAssetId) {
    const thumb = await PhotoLibrary.getThumbnailUrl({
      id: photo.nativeAssetId,
      width: size,
      height: size,
      quality: 0.75,
    })
    return Capacitor.convertFileSrc(thumb.webPath)
  }

  return null
}

export async function createThumbnailObjectUrl(file: File, maxSize: number): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return URL.createObjectURL(file)
  }

  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(URL.createObjectURL(blob ?? file)),
      'image/jpeg',
      0.82,
    )
  })
}

export function idle(ms = 0): Promise<void> {
  return new Promise((resolve) => {
    if (ms > 0) {
      window.setTimeout(resolve, ms)
      return
    }
    requestAnimationFrame(() => resolve())
  })
}

export const SCAN_BATCH_SIZE = 40
