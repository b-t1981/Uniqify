export function supportsGalleryPick(): boolean {
  return typeof document !== 'undefined'
}

export function supportsWritableFilePick(): boolean {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window
}

export function supportsFolderPick(): boolean {
  if (typeof window === 'undefined') return false
  return (
    'showDirectoryPicker' in window ||
    HTMLInputElement.prototype.hasOwnProperty('webkitdirectory')
  )
}

export function supportsDiskDelete(): boolean {
  if (typeof window === 'undefined') return false
  return 'showOpenFilePicker' in window || 'showDirectoryPicker' in window
}

export function isMobileWeb(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}
