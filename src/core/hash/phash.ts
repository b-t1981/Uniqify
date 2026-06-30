const PHASH_SIZE = 32
const PHASH_LOW_SIZE = 8

function dct1d(input: Float64Array, size: number): Float64Array {
  const output = new Float64Array(size)
  const factor = Math.PI / (2 * size)
  const scale0 = Math.sqrt(1 / size)
  const scale = Math.sqrt(2 / size)

  for (let k = 0; k < size; k++) {
    let sum = 0
    for (let i = 0; i < size; i++) {
      sum += input[i]! * Math.cos((2 * i + 1) * k * factor)
    }
    output[k] = sum * (k === 0 ? scale0 : scale)
  }

  return output
}

function dct2d(values: Float64Array, size: number): Float64Array {
  const temp = new Float64Array(size * size)
  const result = new Float64Array(size * size)

  for (let y = 0; y < size; y++) {
    const row = new Float64Array(size)
    for (let x = 0; x < size; x++) {
      row[x] = values[y * size + x]!
    }
    const dctRow = dct1d(row, size)
    for (let x = 0; x < size; x++) {
      temp[y * size + x] = dctRow[x]!
    }
  }

  for (let x = 0; x < size; x++) {
    const col = new Float64Array(size)
    for (let y = 0; y < size; y++) {
      col[y] = temp[y * size + x]!
    }
    const dctCol = dct1d(col, size)
    for (let y = 0; y < size; y++) {
      result[y * size + x] = dctCol[y]!
    }
  }

  return result
}

export async function computePHash(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = PHASH_SIZE
  canvas.height = PHASH_SIZE
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    bitmap.close()
    throw new Error('Canvas 2D indisponible')
  }

  ctx.drawImage(bitmap, 0, 0, PHASH_SIZE, PHASH_SIZE)
  bitmap.close()

  const { data } = ctx.getImageData(0, 0, PHASH_SIZE, PHASH_SIZE)
  const gray = new Float64Array(PHASH_SIZE * PHASH_SIZE)

  for (let i = 0; i < PHASH_SIZE * PHASH_SIZE; i++) {
    const offset = i * 4
    gray[i] = 0.299 * data[offset]! + 0.587 * data[offset + 1]! + 0.114 * data[offset + 2]!
  }

  const dct = dct2d(gray, PHASH_SIZE)
  const coeffs: number[] = []

  for (let y = 0; y < PHASH_LOW_SIZE; y++) {
    for (let x = 0; x < PHASH_LOW_SIZE; x++) {
      coeffs.push(dct[y * PHASH_SIZE + x]!)
    }
  }

  const sorted = [...coeffs].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]!

  return coeffs.map((value) => (value > median ? '1' : '0')).join('')
}
