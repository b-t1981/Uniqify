import { PhotoLibrary } from '@capgo/capacitor-photo-library'
import type { PhotoFile } from '@/core/types/photo'
import type {
  GalleryImportProgress,
  PhotoLibraryAdapter,
} from '@/platforms/types'
import { assetToPhotoRef } from '@/platforms/native/assetToPhotoRef'
import { deferToIdle } from '@/core/utils/async'

/** Moins d’allers-retours natifs ; les métadonnées restent légères. */
const CATALOG_PAGE_SIZE = 400

/** Index galerie : métadonnées seulement, pas d’attente iCloud ni grosses vignettes. */
const CATALOG_LIBRARY_OPTIONS = {
  includeImages: true,
  includeVideos: false,
  includeCloudData: false,
  includeFullResolutionData: false,
  thumbnailWidth: 1,
  thumbnailHeight: 1,
  thumbnailQuality: 0.4,
} as const

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
    ...CATALOG_LIBRARY_OPTIONS,
  })

  const photos: PhotoFile[] = []
  for (const asset of page.assets) {
    if (asset.type !== 'image') continue
    photos.push(assetToPhotoRef(asset))
  }

  onProgress?.({
    phase: 'catalog',
    processed: Math.min(offset + photos.length, page.totalCount),
    total: page.totalCount,
    message: `Indexation… ${Math.min(offset + photos.length, page.totalCount)}/${page.totalCount || '…'}`,
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
    'Pour toute la galerie, préférez « Indexer toute ma galerie » (rapide, sans copier les originaux). La sélection manuelle copie chaque photo et peut être lente.',
  deleteHint:
    'Les photos supprimées sont retirées définitivement de votre galerie (confirmation iOS).',

  async pickGallery() {
    return this.pickPhotos({ multiple: true })
  },

  async pickPhotos(options = { multiple: true }) {
    await ensurePhotoAccess()

    const result = await PhotoLibrary.pickMedia({
      selectionLimit: options.multiple === false ? 1 : 0,
      includeImages: true,
      includeVideos: false,
      thumbnailWidth: 96,
      thumbnailHeight: 96,
      thumbnailQuality: 0.65,
    })

    return result.assets
      .filter((asset) => asset.type === 'image')
      .map((asset) => assetToPhotoRef(asset))
  },

  async importFullGallery(options = {}) {
    const { onProgress, signal, onBatch } = options
    await ensurePhotoAccess()

    const catalog: PhotoFile[] = []
    let offset = 0
    let hasMore = true
    let totalCount = 0

    onProgress?.({
      phase: 'catalog',
      processed: 0,
      total: 0,
      message: 'Lecture de la photothèque…',
    })

    while (hasMore) {
      if (signal?.aborted) {
        throw new DOMException('Import annulé', 'AbortError')
      }

      const page = await importCatalogPage(offset, onProgress)
      if (page.photos.length > 0) {
        catalog.push(...page.photos)
        onBatch?.(page.photos)
      }
      totalCount = page.totalCount
      offset += page.photos.length > 0 ? page.photos.length : CATALOG_PAGE_SIZE
      hasMore = page.hasMore && (page.photos.length > 0 || offset < page.totalCount)

      await deferToIdle()
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
