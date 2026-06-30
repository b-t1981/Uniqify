import type { PhotoFile } from '@/core/types/photo'
import type { PhotoLibraryAsset } from '@capgo/capacitor-photo-library'
import { Capacitor } from '@capacitor/core'

export function assetToPhotoRef(asset: PhotoLibraryAsset): PhotoFile {
  return {
    id: asset.id,
    name: asset.fileName,
    size: asset.size ?? 0,
    lastModified: asset.modificationDate
      ? new Date(asset.modificationDate).getTime()
      : Date.now(),
    source: 'native',
    mimeType: asset.mimeType || 'image/jpeg',
    width: asset.width,
    height: asset.height,
    nativeAssetId: asset.id,
    thumbnailUrl: asset.thumbnail?.webPath
      ? Capacitor.convertFileSrc(asset.thumbnail.webPath)
      : undefined,
  }
}
