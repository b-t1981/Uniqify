import type { PhotoLibraryAdapter } from '@/platforms/types'

/**
 * Adaptateur natif Capacitor (PhotoKit iOS / MediaStore Android).
 * Branché en phase 2 pour accès galerie complet et suppression.
 */
export const nativePhotoAdapter: PhotoLibraryAdapter = {
  platformLabel: 'Natif',

  canPickFolder: false,
  canDeleteFromGallery: true,

  async pickPhotos() {
    throw new Error('Adaptateur natif non configuré — utilisez la build Capacitor.')
  },
}
