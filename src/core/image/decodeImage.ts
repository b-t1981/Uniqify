export interface DecodedImage {
  data: Uint8ClampedArray
  width: number
  height: number
}

export async function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(file)
  const dimensions = { width: bitmap.width, height: bitmap.height }
  bitmap.close()
  return dimensions
}

export async function decodeImageFile(
  file: File,
  maxSize = 512,
): Promise<DecodedImage> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    bitmap.close()
    throw new Error('Canvas 2D indisponible')
  }

  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const imageData = ctx.getImageData(0, 0, width, height)
  return { data: imageData.data, width, height }
}
