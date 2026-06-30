export type QualityIssue =
  | 'blur'
  | 'dark'
  | 'tiny'
  | 'uniform'
  | 'letterbox'
  | 'obscured'

export interface PhotoQualityScores {
  sharpness: number
  brightness: number
  width: number
  height: number
}

export interface PhotoQualityResult {
  photoId: string
  issues: QualityIssue[]
  scores: PhotoQualityScores
}

export const QUALITY_ISSUE_LABELS: Record<QualityIssue, string> = {
  blur: 'Flou',
  dark: 'Sombre',
  tiny: 'Miniature',
  uniform: 'Peu de détail',
  letterbox: 'Bandes noires',
  obscured: 'Obstruction',
}

export const QUALITY_THRESHOLDS = {
  minSharpness: 80,
  minBrightness: 35,
  minShortEdge: 480,
  minPixels: 150_000,
  maxUniformStdDev: 22,
  borderRatio: 0.08,
  borderMaxStdDev: 18,
  obscuredCornerRatio: 0.15,
  obscuredMaxBrightness: 30,
  obscuredMaxStdDev: 15,
} as const
