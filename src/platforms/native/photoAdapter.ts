import { PhotoLibrary } from '@capgo/capacitor-photo-library'
import type { PhotoFile } from '@/core/types/photo'
import type { GalleryImportProgress, PhotoLibraryAdapter } from '@/platforms/types'
import { assetToPhotoRef } from '@/platforms/native/assetToPhotoRef'
import { ensureGalleryDeleteAccess } from '@/platforms/native/uniqifyPhotosPlugin'

const CATALOG_PAGE_SIZE = 200

async function ensurePhotoAccess(): Promise<void> {
  const { state } = await PhotoLibrary.checkAuthorization()
  if (state === 'authorized' || state === 'limited') return

  const requested = await PhotoLibrary.requestAuthorization()
  if (requested.state !== 'authorized' && requested.state !== 'limited') {
    throw new Error('Accès à la photothèque refusé')
  }
}

async function importCatalogPage(
  offset: number,
  onProgress?: (progress: GalleryImportProgress) => void,
): Promise<{ photos: PhotoFile[]; hasMore: boolean; totalCount: number }> {
  const page = await PhotoLibrary.getLibrary({
    offset,
    limit: CATALOG_PAGE_SIZE,
    includeImages: true,
    includeVideos: false,
    includeCloudData: true,
    includeFullResolutionData: false,
    thumbnailWidth: 256,
    thumbnailHeight: 256,
    thumbnailQuality: 0.72,
  })

  const photos: PhotoFile[] = []
  for (const asset of page.assets) {
    if (asset.type !== 'image') continue
    photos.push(assetToPhotoRef(asset))
  }

  onProgress?.({
    phase: 'catalog',
    processed: Math.min(offset + page.assets.length, page.totalCount),
    total: page.totalCount,
    message: 'Indexation de la galerie…',
  })

  return {
    photos,
    hasMore: page.hasMore,
    totalCount: page.totalCount,
  }
}

export const nativePhotoAdapter: PhotoLibraryAdapter = {
  platformLabel: 'iPhone',

  canPickGallery: true,
  canImportFullGallery: true,
  canPickFolder: false,
  canDeleteFromGallery: true,
  canDeleteFromDisk: false,

  importHint:
    'Importez toute votre galerie (léger, sans charger les originaux) ou sélectionnez des photos précises.',
  deleteHint:
    'Les photos supprimées sont retirées définitivement de votre galerie (confirmation iOS).',

  async pickGallery() {
    return this.pickPhotos({ multiple: true })
  },

  async pickPhotos(options = { multiple: true }) {
    await ensurePhotoAccess()
    await ensureGalleryDeleteAccess()

    const result = await PhotoLibrary.pickMedia({
      selectionLimit: options.multiple === false ? 1 : 0,
      includeImages: true,
      includeVideos: false,
      thumbnailWidth: 256,
      thumbnailHeight: 256,
      thumbnailQuality: 0.72,
    })

    return result.assets
      .filter((asset) => asset.type === 'image')
      .map((asset) => assetToPhotoRef(asset))
  },

  async importFullGallery(onProgress, signal) {
    await ensurePhotoAccess()
    await ensureGalleryDeleteAccess()

    const catalog: PhotoFile[] = []
    let offset = 0
    let hasMore = true
    let totalCount = 0

    onProgress?.({
      phase: 'catalog',
      processed: 0,
      total: 0,
      message: 'Préparation de l’index galerie…',
    })

    while (hasMore) {
      if (signal?.aborted) {
        throw new DOMException('Import annulé', 'AbortError')
      }

      const page = await importCatalogPage(offset, onProgress)
      catalog.push(...page.photos)
      totalCount = page.totalCount
      offset += page.photos.length
      hasMore = page.hasMore && page.photos.length > 0

      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    }

    onProgress?.({
      phase: 'done',
      processed: catalog.length,
      total: totalCount || catalog.length,
      message: `${catalog.length} photo${catalog.length > 1 ? 's' : ''} indexée${catalog.length > 1 ? 's' : ''}`,
    })

    return catalog
  },
}
