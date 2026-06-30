import type { PhotoFile, PhotoGroup } from '@/core/types/photo'
import { analyzePhotoQuality } from '@/core/quality/analyzePhoto'
import { idle, SCAN_BATCH_SIZE } from '@/core/photos/loadBytesForScan'

export interface QualityScanProgress {
  processed: number
  total: number
  currentName: string
}

export async function scanLowQuality(
  photos: PhotoFile[],
  onProgress?: (progress: QualityScanProgress) => void,
  signal?: AbortSignal,
): Promise<PhotoGroup[]> {
  const groups: PhotoGroup[] = []

  for (let i = 0; i < photos.length; i++) {
    if (signal?.aborted) throw new DOMException('Analyse annulée', 'AbortError')

    const photo = photos[i]!
    onProgress?.({
      processed: i + 1,
      total: photos.length,
      currentName: photo.name,
    })

    try {
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
    } catch {
      // Fichier inaccessible (iCloud, etc.)
    }

    if ((i + 1) % SCAN_BATCH_SIZE === 0) {
      await idle(8)
    } else {
      await idle()
    }
  }

  return groups
}
