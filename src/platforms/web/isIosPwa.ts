export function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

/** Safari iOS, pas déjà installé comme app (écran d’accueil). */
export function shouldShowIosPwaInstall(): boolean {
  if (typeof window === 'undefined') return false
  if (!isIosDevice()) return false
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as Navigator & { standalone?: boolean }).standalone)
  return !standalone
}
