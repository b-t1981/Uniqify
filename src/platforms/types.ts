import type { PhotoFile } from '@/core/types/photo'

export interface PhotoLibraryAdapter {
  pickPhotos: (options?: { multiple?: boolean }) => Promise<PhotoFile[]>
  pickFolder?: () => Promise<PhotoFile[]>
  canPickFolder: boolean
  canDeleteFromGallery: boolean
  platformLabel: string
}
