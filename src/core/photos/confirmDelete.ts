import { isNativeIOS } from '@/platforms/native/uniqifyPhotosPlugin'

export function confirmGalleryDelete(count: number): boolean {
  if (count <= 0) return false
  if (!isNativeIOS()) return true

  const label = count === 1 ? '1 photo' : `${count} photos`
  return window.confirm(
    `Supprimer ${label} de votre galerie ?\n\nCette action est définitive. iOS peut demander une confirmation supplémentaire.`,
  )
}

export function photosWithoutGalleryId(count: number): string | null {
  if (count <= 0) return null
  if (count === 1) {
    return '1 photo ne peut pas être supprimée de la galerie (importée sans identifiant).'
  }
  return `${count} photos ne peuvent pas être supprimées de la galerie (importées sans identifiant).`
}
