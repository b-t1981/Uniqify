import type { PhotoLibraryAdapter } from '@/platforms/types'
import { webPhotoAdapter } from '@/platforms/web/photoAdapter'

/** Point d'entrée plateforme — remplacé par l'adaptateur natif Capacitor en phase 2. */
export function getPhotoAdapter(): PhotoLibraryAdapter {
  return webPhotoAdapter
}
