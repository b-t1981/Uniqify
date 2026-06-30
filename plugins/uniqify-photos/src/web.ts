import { WebPlugin } from '@capacitor/core'
import type { DeleteAssetsResult, GalleryAuthState, UniqifyPhotosPlugin } from './definitions'

export class UniqifyPhotosWeb extends WebPlugin implements UniqifyPhotosPlugin {
  async checkAuthorization(): Promise<{ state: GalleryAuthState }> {
    return { state: 'denied' }
  }

  async requestAuthorization(): Promise<{ state: GalleryAuthState }> {
    return { state: 'denied' }
  }

  async deleteAssets(): Promise<DeleteAssetsResult> {
    return { deleted: [], failed: [] }
  }
}
