export type GalleryAuthState = 'authorized' | 'limited' | 'denied' | 'notDetermined'

export interface DeleteAssetsResult {
  deleted: string[]
  failed: string[]
}

export interface UniqifyPhotosPlugin {
  checkAuthorization(): Promise<{ state: GalleryAuthState }>
  requestAuthorization(): Promise<{ state: GalleryAuthState }>
  deleteAssets(options: { ids: string[] }): Promise<DeleteAssetsResult>
}
