import { Capacitor } from '@capacitor/core'
import {
  UniqifyPhotos,
  type GalleryAuthState,
} from 'capacitor-uniqify-photos'

export { UniqifyPhotos }
export type { DeleteAssetsResult, GalleryAuthState } from 'capacitor-uniqify-photos'

export function isNativeIOS(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'
}

export async function ensureGalleryDeleteAccess(): Promise<void> {
  if (!isNativeIOS()) return

  const current = await UniqifyPhotos.checkAuthorization()
  if (current.state === 'authorized' || current.state === 'limited') return

  const requested = await UniqifyPhotos.requestAuthorization()
  if (requested.state !== 'authorized' && requested.state !== 'limited') {
    throw new Error(
      'Autorisez Uniqify à modifier vos photos dans Réglages > Confidentialité > Photothèque.',
    )
  }
}

export function canDeleteFromGallery(state: GalleryAuthState): boolean {
  return state === 'authorized' || state === 'limited'
}
