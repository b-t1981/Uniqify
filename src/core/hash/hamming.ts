export const PHASH_BITS = 64

export function hammingDistance(a: string, b: string): number {
  const length = Math.min(a.length, b.length)
  let distance = 0

  for (let i = 0; i < length; i++) {
    if (a[i] !== b[i]) distance++
  }

  distance += Math.abs(a.length - b.length)
  return distance
}

export function similarityPercent(distance: number, bits = PHASH_BITS): number {
  return Math.round((1 - distance / bits) * 100)
}
