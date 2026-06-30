import type { PhotoFile } from '@/core/types/photo'

export interface GalleryImportProgress {
  phase: 'catalog' | 'done'
  processed: number
  total: number
  message: string
}

export interface ImportFullGalleryOptions {
  onProgress?: (progress: GalleryImportProgress) => void
  signal?: AbortSignal
  /** Ajoute chaque page au catalogue sans attendre la fin (UI plus réactive). */
  onBatch?: (photos: PhotoFile[]) => void
}

export interface PhotoLibraryAdapter {
  pickPhotos: (options?: { multiple?: boolean }) => Promise<PhotoFile[]>
  pickGallery?: () => Promise<PhotoFile[]>
  importFullGallery?: (options?: ImportFullGalleryOptions) => Promise<PhotoFile[]>
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
