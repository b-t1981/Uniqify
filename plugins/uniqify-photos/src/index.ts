import { registerPlugin } from '@capacitor/core'
import type { UniqifyPhotosPlugin } from './definitions'

export * from './definitions'

export const UniqifyPhotos = registerPlugin<UniqifyPhotosPlugin>('UniqifyPhotos', {
  web: () => import('./web').then((module) => new module.UniqifyPhotosWeb()),
})
