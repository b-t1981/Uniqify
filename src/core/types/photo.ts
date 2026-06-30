export type PhotoSource = 'file' | 'native'

export interface PhotoFile {
  id: string
  file: File
  name: string
  size: number
  lastModified: number
  source: PhotoSource
  thumbnailUrl?: string
}

export interface PhotoGroup {
  id: string
  photos: PhotoFile[]
  type: 'exact' | 'near' | 'low-quality'
  similarity?: number
}

export interface ScanProgress {
  phase: 'idle' | 'hashing' | 'grouping' | 'done'
  processed: number
  total: number
  message: string
}

export interface ScanResult {
  photos: PhotoFile[]
  exactDuplicates: PhotoGroup[]
  nearDuplicates: PhotoGroup[]
  lowQuality: PhotoGroup[]
}
