import { Capacitor } from '@capacitor/core'
import { KeepAwake } from '@capacitor-community/keep-awake'

let awake = false

export async function beginScanKeepAwake(enabled: boolean): Promise<void> {
  if (!enabled || !Capacitor.isNativePlatform()) return
  if (awake) return

  try {
    await KeepAwake.keepAwake()
    awake = true
  } catch {
    // Plugin indisponible (web)
  }
}

export async function endScanKeepAwake(): Promise<void> {
  if (!awake) return

  try {
    await KeepAwake.allowSleep()
  } catch {
    // ignore
  } finally {
    awake = false
  }
}

export function isKeepAwakeSupported(): boolean {
  return Capacitor.isNativePlatform()
}
