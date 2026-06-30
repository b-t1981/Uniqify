import type { PhotoFile } from '@/core/types/photo'
import type { PhotoQualityResult, QualityIssue } from '@/core/types/quality'
import { QUALITY_THRESHOLDS } from '@/core/types/quality'
import { decodeImageFile } from '@/core/image/decodeImage'
import { loadThumbnailForScan } from '@/core/photos/loadBytesForScan'

function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

function toGrayscale(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): Float32Array {
  const gray = new Float32Array(width * height)
  for (let i = 0; i < width * height; i++) {
    const offset = i * 4
    gray[i] = luminance(data[offset], data[offset + 1], data[offset + 2])
  }
  return gray
}

function mean(values: Float32Array): number {
  let sum = 0
  for (const value of values) sum += value
  return sum / values.length
}

function stdDev(values: Float32Array): number {
  const avg = mean(values)
  let sumSq = 0
  for (const value of values) {
    const delta = value - avg
    sumSq += delta * delta
  }
  return Math.sqrt(sumSq / values.length)
}

function laplacianVariance(gray: Float32Array, width: number, height: number): number {
  let sum = 0
  let sumSq = 0
  let count = 0

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const center = gray[y * width + x]!
      const laplacian =
        -4 * center +
        gray[(y - 1) * width + x]! +
        gray[(y + 1) * width + x]! +
        gray[y * width + (x - 1)]! +
        gray[y * width + (x + 1)]!
      sum += laplacian
      sumSq += laplacian * laplacian
      count++
    }
  }

  if (count === 0) return 0
  const avg = sum / count
  return sumSq / count - avg * avg
}

function sampleBand(
  gray: Float32Array,
  width: number,
  height: number,
  side: 'top' | 'bottom' | 'left' | 'right',
): Float32Array {
  const bandSize = Math.max(1, Math.round(Math.min(width, height) * 0.08))
  const samples: number[] = []

  if (side === 'top' || side === 'bottom') {
    const yStart = side === 'top' ? 0 : height - bandSize
    for (let y = yStart; y < yStart + bandSize; y++) {
      for (let x = 0; x < width; x++) {
        samples.push(gray[y * width + x]!)
      }
    }
  } else {
    const xStart = side === 'left' ? 0 : width - bandSize
    for (let x = xStart; x < xStart + bandSize; x++) {
      for (let y = 0; y < height; y++) {
        samples.push(gray[y * width + x]!)
      }
    }
  }

  return Float32Array.from(samples)
}

function hasLetterbox(gray: Float32Array, width: number, height: number): boolean {
  const sides: Array<'top' | 'bottom' | 'left' | 'right'> = [
    'top',
    'bottom',
    'left',
    'right',
  ]

  return sides.some((side) => {
    const band = sampleBand(gray, width, height, side)
    return stdDev(band) < QUALITY_THRESHOLDS.borderMaxStdDev
  })
}

function hasObscuredCorner(
  gray: Float32Array,
  width: number,
  height: number,
): boolean {
  const cornerW = Math.max(1, Math.round(width * QUALITY_THRESHOLDS.obscuredCornerRatio))
  const cornerH = Math.max(1, Math.round(height * QUALITY_THRESHOLDS.obscuredCornerRatio))
  const corners = [
    { x: 0, y: 0 },
    { x: width - cornerW, y: 0 },
    { x: 0, y: height - cornerH },
    { x: width - cornerW, y: height - cornerH },
  ]

  return corners.some(({ x, y }) => {
    const samples: number[] = []
    for (let row = y; row < y + cornerH; row++) {
      for (let col = x; col < x + cornerW; col++) {
        samples.push(gray[row * width + col]!)
      }
    }
    const band = Float32Array.from(samples)
    return (
      mean(band) < QUALITY_THRESHOLDS.obscuredMaxBrightness &&
      stdDev(band) < QUALITY_THRESHOLDS.obscuredMaxStdDev
    )
  })
}

export async function analyzePhotoQuality(photo: PhotoFile): Promise<PhotoQualityResult> {
  const scanFile = await loadThumbnailForScan(photo, 512)
  const { data, width, height } = await decodeImageFile(scanFile, 512)
  const gray = toGrayscale(data, width, height)

  const sharpness = laplacianVariance(gray, width, height)
  const brightness = mean(gray)
  const uniformity = stdDev(gray)

  const originalWidth = photo.width ?? width
  const originalHeight = photo.height ?? height

  const issues: QualityIssue[] = []

  if (sharpness < QUALITY_THRESHOLDS.minSharpness) issues.push('blur')
  if (brightness < QUALITY_THRESHOLDS.minBrightness) issues.push('dark')
  if (
    Math.min(originalWidth, originalHeight) < QUALITY_THRESHOLDS.minShortEdge ||
    originalWidth * originalHeight < QUALITY_THRESHOLDS.minPixels
  ) {
    issues.push('tiny')
  }
  if (uniformity < QUALITY_THRESHOLDS.maxUniformStdDev) issues.push('uniform')
  if (hasLetterbox(gray, width, height)) issues.push('letterbox')
  if (hasObscuredCorner(gray, width, height)) issues.push('obscured')

  return {
    photoId: photo.id,
    issues,
    scores: {
      sharpness,
      brightness,
      width: originalWidth,
      height: originalHeight,
    },
  }
}
