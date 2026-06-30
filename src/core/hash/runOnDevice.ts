import { Capacitor } from '@capacitor/core'
import { computePHash } from '@/core/hash/phash'
import { hashFile } from '@/core/hash/sha256'
import { withTimeout } from '@/core/utils/async'

const DEVICE_HASH_TIMEOUT_MS = 22_000

export function useMainThreadForImageHash(): boolean {
  return Capacitor.isNativePlatform()
}

export function hashExactFileOnDevice(file: File, label: string): Promise<string> {
  return withTimeout(
    hashFile(file),
    DEVICE_HASH_TIMEOUT_MS,
    `Hash exact trop long : ${label}`,
  )
}

export function hashNearFileOnDevice(file: File, label: string): Promise<string> {
  return withTimeout(
    computePHash(file),
    DEVICE_HASH_TIMEOUT_MS,
    `Empreinte proche trop longue : ${label}`,
  )
}
