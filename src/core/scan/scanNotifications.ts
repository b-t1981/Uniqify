import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { isNativeIOS } from '@/platforms/native/uniqifyPhotosPlugin'

export interface ScanSummary {
  exact: number
  near: number
  lowQuality: number
  photoCount: number
}

let permissionRequested = false

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    if (typeof Notification === 'undefined') return false
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false
    if (!permissionRequested) {
      permissionRequested = true
      const result = await Notification.requestPermission()
      return result === 'granted'
    }
    return false
  }

  const { display } = await LocalNotifications.checkPermissions()
  if (display === 'granted') return true

  if (!permissionRequested) {
    permissionRequested = true
    const requested = await LocalNotifications.requestPermissions()
    return requested.display === 'granted'
  }

  return false
}

function formatBody(summary: ScanSummary): string {
  const parts: string[] = []
  if (summary.exact > 0) parts.push(`${summary.exact} doublon${summary.exact > 1 ? 's' : ''} exact${summary.exact > 1 ? 's' : ''}`)
  if (summary.near > 0) parts.push(`${summary.near} doublon${summary.near > 1 ? 's' : ''} proche${summary.near > 1 ? 's' : ''}`)
  if (summary.lowQuality > 0) {
    parts.push(
      `${summary.lowQuality} photo${summary.lowQuality > 1 ? 's' : ''} inutile${summary.lowQuality > 1 ? 's' : ''}`,
    )
  }

  if (parts.length === 0) {
    return `${summary.photoCount.toLocaleString('fr-FR')} photos analysées — aucun problème détecté.`
  }

  return parts.join(' · ')
}

export async function notifyScanComplete(summary: ScanSummary): Promise<void> {
  const allowed = await ensureNotificationPermission()
  if (!allowed) return

  const title = 'Analyse Uniqify terminée'
  const body = formatBody(summary)

  if (isNativeIOS() || Capacitor.isNativePlatform()) {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Date.now() % 1_000_000,
          title,
          body,
          schedule: { at: new Date(Date.now() + 500) },
        },
      ],
    })
    return
  }

  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification(title, { body })
  }
}
