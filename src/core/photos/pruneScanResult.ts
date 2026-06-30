import type { PhotoGroup, ScanResult } from '@/core/types/photo'

function withoutIds<T extends { id: string }>(items: T[], removedIds: Set<string>): T[] {
  return items.filter((item) => !removedIds.has(item.id))
}

function pruneDuplicateGroups(groups: PhotoGroup[], removedIds: Set<string>): PhotoGroup[] {
  return groups
    .map((group) => ({
      ...group,
      photos: withoutIds(group.photos, removedIds),
    }))
    .filter((group) => group.photos.length > 1)
}

function pruneLowQualityGroups(groups: PhotoGroup[], removedIds: Set<string>): PhotoGroup[] {
  return groups
    .map((group) => ({
      ...group,
      photos: withoutIds(group.photos, removedIds),
    }))
    .filter((group) => group.photos.length > 0)
}

export function pruneScanResult(result: ScanResult, removedIds: string[]): ScanResult {
  const removed = new Set(removedIds)

  return {
    photos: withoutIds(result.photos, removed),
    exactDuplicates: pruneDuplicateGroups(result.exactDuplicates, removed),
    nearDuplicates: pruneDuplicateGroups(result.nearDuplicates, removed),
    lowQuality: pruneLowQualityGroups(result.lowQuality, removed),
  }
}

export function duplicatePhotosToRemove(
  groups: PhotoGroup[],
  keepPhotoId: string,
): string[] {
  const group = groups.find((item) => item.photos.some((photo) => photo.id === keepPhotoId))
  if (!group) return []

  return group.photos.filter((photo) => photo.id !== keepPhotoId).map((photo) => photo.id)
}

export function allDuplicateCopiesToRemove(
  groups: PhotoGroup[],
  keepers: Record<string, string> = {},
): string[] {
  return groups.flatMap((group) => {
    const keeperId = keepers[group.id] ?? group.photos[0]?.id
    if (!keeperId) return []
    return group.photos
      .filter((photo) => photo.id !== keeperId)
      .map((photo) => photo.id)
  })
}
