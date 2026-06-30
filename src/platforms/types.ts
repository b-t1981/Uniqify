import type { PhotoFile } from '@/core/types/photo'

export interface GalleryImportProgress {
  phase: 'catalog' | 'done'
  processed: number
  total: number
  message: string
}

export interface PhotoLibraryAdapter {
  pickPhotos: (options?: { multiple?: boolean }) => Promise<PhotoFile[]>
  pickGallery?: () => Promise<PhotoFile[]>
  importFullGallery?: (
    onProgress?: (progress: GalleryImportProgress) => void,
    signal?: AbortSignal,
  ) => Promise<PhotoFile[]>
  pickWritableFiles?: () => Promise<PhotoFile[]>
  pickFolder?: () => Promise<PhotoFile[]>
  canPickGallery: boolean
  canImportFullGallery: boolean
  canPickFolder: boolean
  canDeleteFromDisk: boolean
  canDeleteFromGallery: boolean
  platformLabel: string
  importHint: string
  deleteHint: string
}
