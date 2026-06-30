import type { PhotoFile } from '@/core/types/photo'
import type { PhotoQualityResult, QualityIssue } from '@/core/types/quality'
import { QUALITY_THRESHOLDS } from '@/core/types/quality'
import { decodeImageFile, getImageDimensions } from '@/core/image/decodeImage'

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
      const i = y * width + x
      const lap =
        -4 * gray[i] +
        gray[i - 1] +
        gray[i + 1] +
        gray[i - width] +
        gray[i + width]
      sum += lap
      sumSq += lap * lap
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
  const bandW = Math.max(1, Math.round(width * QUALITY_THRESHOLDS.borderRatio))
  const bandH = Math.max(1, Math.round(height * QUALITY_THRESHOLDS.borderRatio))
  const samples: number[] = []

  if (side === 'top' || side === 'bottom') {
    const yStart = side === 'top' ? 0 : height - bandH
    for (let y = yStart; y < yStart + bandH; y++) {
      for (let x = 0; x < width; x++) {
        samples.push(gray[y * width + x])
      }
    }
  } else {
    const xStart = side === 'left' ? 0 : width - bandW
    for (let y = 0; y < height; y++) {
      for (let x = xStart; x < xStart + bandW; x++) {
        samples.push(gray[y * width + x])
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
        samples.push(gray[row * width + col])
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
  const { width: originalWidth, height: originalHeight } = await getImageDimensions(
    photo.file,
  )
  const { data, width, height } = await decodeImageFile(photo.file, 512)
  const gray = toGrayscale(data, width, height)

  const sharpness = laplacianVariance(gray, width, height)
  const brightness = mean(gray)
  const uniformity = stdDev(gray)

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
