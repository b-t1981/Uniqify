import type { PhotoFile, PhotoGroup } from '@/core/types/photo'
import { analyzePhotoQuality } from '@/core/quality/analyzePhoto'

export interface QualityScanProgress {
  processed: number
  total: number
  currentName: string
}

export async function scanLowQuality(
  photos: PhotoFile[],
  onProgress?: (progress: QualityScanProgress) => void,
): Promise<PhotoGroup[]> {
  const groups: PhotoGroup[] = []

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]
    onProgress?.({
      processed: i + 1,
      total: photos.length,
      currentName: photo.name,
    })

    const result = await analyzePhotoQuality(photo)
    if (result.issues.length > 0) {
      groups.push({
        id: crypto.randomUUID(),
        photos: [photo],
        type: 'low-quality',
        qualityIssues: result.issues,
        qualityScores: result.scores,
      })
    }

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve())
    })
  }

  return groups
}
