import type { PhotoFile, PhotoGroup, ScanResult } from '@/core/types/photo'

function photoIds(groups: PhotoGroup[]): Set<string> {
  const ids = new Set<string>()
  for (const group of groups) {
    for (const photo of group.photos) ids.add(photo.id)
  }
  return ids
}

export function mergeExactDuplicateGroups(
  existing: PhotoGroup[],
  incoming: PhotoGroup[],
): PhotoGroup[] {
  const byHash = new Map<string, Map<string, PhotoFile>>()

  function addPhoto(photo: PhotoFile) {
    const hash = photo.hashExact
    if (!hash) return
    let bucket = byHash.get(hash)
    if (!bucket) {
      bucket = new Map()
      byHash.set(hash, bucket)
    }
    bucket.set(photo.id, photo)
  }

  for (const group of [...existing, ...incoming]) {
    for (const photo of group.photos) addPhoto(photo)
  }

  const groups: PhotoGroup[] = []
  for (const bucket of byHash.values()) {
    if (bucket.size < 2) continue
    groups.push({
      id: crypto.randomUUID(),
      type: 'exact',
      photos: [...bucket.values()],
    })
  }

  groups.sort((a, b) => b.photos.length - a.photos.length)
  return groups
}

export function mergeNearDuplicateGroups(
  existing: PhotoGroup[],
  incoming: PhotoGroup[],
): PhotoGroup[] {
  const allGroups = [...existing, ...incoming]
  if (allGroups.length === 0) return []

  const parent = new Map<string, string>()

  function find(id: string): string {
    let root = id
    while (parent.get(root) !== root) {
      root = parent.get(root)!
    }
    return root
  }

  function union(a: string, b: string) {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent.set(rb, ra)
  }

  const photosById = new Map<string, PhotoFile>()

  for (const group of allGroups) {
    for (const photo of group.photos) {
      photosById.set(photo.id, photo)
      if (!parent.has(photo.id)) parent.set(photo.id, photo.id)
    }
    const anchor = group.photos[0]?.id
    if (!anchor) continue
    for (const photo of group.photos.slice(1)) {
      union(anchor, photo.id)
    }
  }

  const clusters = new Map<string, Map<string, PhotoFile>>()
  for (const [id, photo] of photosById) {
    const root = find(id)
    let bucket = clusters.get(root)
    if (!bucket) {
      bucket = new Map()
      clusters.set(root, bucket)
    }
    bucket.set(id, photo)
  }

  const groups: PhotoGroup[] = []
  for (const bucket of clusters.values()) {
    if (bucket.size < 2) continue
    const photos = [...bucket.values()]
    groups.push({
      id: crypto.randomUUID(),
      type: 'near',
      photos,
      similarity: photos.length > 1 ? undefined : undefined,
    })
  }

  groups.sort((a, b) => b.photos.length - a.photos.length)
  return groups
}

export function mergeLowQualityGroups(
  existing: PhotoGroup[],
  incoming: PhotoGroup[],
): PhotoGroup[] {
  const seen = new Set(photoIds(existing))
  const merged = [...existing]

  for (const group of incoming) {
    const photo = group.photos[0]
    if (!photo || seen.has(photo.id)) continue
    seen.add(photo.id)
    merged.push(group)
  }

  return merged
}

export function mergeScanResult(
  current: ScanResult | null,
  scopedPhotos: PhotoFile[],
  partial: Pick<ScanResult, 'exactDuplicates' | 'nearDuplicates' | 'lowQuality'>,
): ScanResult {
  const previousPhotos = current?.photos ?? []
  const photoById = new Map<string, PhotoFile>()

  for (const photo of previousPhotos) photoById.set(photo.id, photo)
  for (const photo of scopedPhotos) photoById.set(photo.id, photo)

  return {
    photos: [...photoById.values()],
    exactDuplicates: mergeExactDuplicateGroups(
      current?.exactDuplicates ?? [],
      partial.exactDuplicates,
    ),
    nearDuplicates: mergeNearDuplicateGroups(
      current?.nearDuplicates ?? [],
      partial.nearDuplicates,
    ),
    lowQuality: mergeLowQualityGroups(current?.lowQuality ?? [], partial.lowQuality),
  }
}
