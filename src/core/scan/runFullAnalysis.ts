import type { PhotoFile, PhotoGroup } from '@/core/types/photo'
import { scanExactDuplicates } from '@/core/duplicates/scanExactDuplicates'
import { scanNearDuplicates } from '@/core/duplicates/scanNearDuplicates'
import { scanLowQuality } from '@/core/quality/scanLowQuality'

export type FullScanPhase = 'exact' | 'near' | 'quality'

export interface FullScanProgress {
  phase: FullScanPhase
  phaseLabel: string
  processed: number
  total: number
  currentName: string
  overallProcessed: number
  overallTotal: number
}

export interface FullScanResult {
  exactDuplicates: PhotoGroup[]
  nearDuplicates: PhotoGroup[]
  lowQuality: PhotoGroup[]
  exactCount: number
  nearCount: number
  lowQualityCount: number
}

const PHASE_LABELS: Record<FullScanPhase, string> = {
  exact: 'Doublons exacts',
  near: 'Doublons proches',
  quality: 'Qualité',
}

function phaseIndex(phase: FullScanPhase, withNear: boolean): number {
  if (phase === 'exact') return 0
  if (phase === 'near') return withNear ? 1 : 0
  return withNear ? 2 : 1
}

export async function runFullAnalysis(
  photos: PhotoFile[],
  onProgress: (progress: FullScanProgress) => void,
  signal?: AbortSignal,
): Promise<FullScanResult> {
  const withNear = photos.length >= 2
  const phaseCount = withNear ? 3 : 2
  const scopeTotal = Math.max(photos.length, 1)
  const overallTotal = scopeTotal * phaseCount

  let exactDuplicates: PhotoGroup[] = []
  let nearDuplicates: PhotoGroup[] = []
  let lowQuality: PhotoGroup[] = []

  const report = (
    phase: FullScanPhase,
    processed: number,
    total: number,
    currentName: string,
  ) => {
    const idx = phaseIndex(phase, withNear)
    onProgress({
      phase,
      phaseLabel: PHASE_LABELS[phase],
      processed,
      total,
      currentName,
      overallProcessed: idx * scopeTotal + processed,
      overallTotal,
    })
  }

  exactDuplicates = await scanExactDuplicates(
    photos,
    (p) =>
      report('exact', p.processed, p.total, p.currentName || 'Regroupement…'),
    signal,
  )

  if (signal?.aborted) throw new DOMException('Analyse annulée', 'AbortError')

  if (withNear) {
    nearDuplicates = await scanNearDuplicates(
      photos,
      (p) => {
        const label =
          p.phase === 'hashing'
            ? p.currentName
            : p.phase === 'comparing'
              ? 'Comparaison…'
              : 'Regroupement…'
        report('near', p.processed, p.total, label)
      },
      signal,
    )
  }

  if (signal?.aborted) throw new DOMException('Analyse annulée', 'AbortError')

  lowQuality = await scanLowQuality(
    photos,
    (p) => report('quality', p.processed, p.total, p.currentName),
    signal,
  )

  return {
    exactDuplicates,
    nearDuplicates,
    lowQuality,
    exactCount: exactDuplicates.length,
    nearCount: nearDuplicates.length,
    lowQualityCount: lowQuality.length,
  }
}
