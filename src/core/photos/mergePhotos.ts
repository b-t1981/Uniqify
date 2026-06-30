import type { PhotoFile } from '@/core/types/photo'

export function mergePhotosDeduped(current: PhotoFile[], incoming: PhotoFile[]): PhotoFile[] {
  if (incoming.length === 0) return current

  const nativeIds = new Set(
    current.map((photo) => photo.nativeAssetId).filter((id): id is string => Boolean(id)),
  )
  const sessionIds = new Set(current.map((photo) => photo.id))

  const merged = [...current]

  for (const photo of incoming) {
    if (photo.nativeAssetId) {
      if (nativeIds.has(photo.nativeAssetId)) continue
      nativeIds.add(photo.nativeAssetId)
      merged.push(photo)
      continue
    }

    if (sessionIds.has(photo.id)) continue
    sessionIds.add(photo.id)
    merged.push(photo)
  }

  return merged
}
