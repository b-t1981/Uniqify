import { Capacitor } from '@capacitor/core'
import type { PhotoLibraryAdapter } from '@/platforms/types'
import { nativePhotoAdapter } from '@/platforms/native/photoAdapter'
import { isNativeIOS } from '@/platforms/native/uniqifyPhotosPlugin'
import { webPhotoAdapter } from '@/platforms/web/photoAdapter'

export function getPhotoAdapter(): PhotoLibraryAdapter {
  if (isNativeIOS()) {
    return nativePhotoAdapter
  }

  return webPhotoAdapter
}

export function getPlatformLabel(): string {
  if (Capacitor.isNativePlatform()) {
    return Capacitor.getPlatform() === 'ios' ? 'iPhone' : 'Android'
  }

  return webPhotoAdapter.platformLabel
}
