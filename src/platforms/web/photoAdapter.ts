import type { PhotoFile } from '@/core/types/photo'
import type { PhotoLibraryAdapter } from '@/platforms/types'

function createPhotoFile(file: File): PhotoFile {
  return {
    id: crypto.randomUUID(),
    file,
    name: file.name,
    size: file.size,
    lastModified: file.lastModified,
    source: 'file',
  }
}

export const webPhotoAdapter: PhotoLibraryAdapter = {
  platformLabel: 'Web',

  canPickFolder:
    typeof window !== 'undefined' &&
    ('showDirectoryPicker' in window ||
      HTMLInputElement.prototype.hasOwnProperty('webkitdirectory')),

  canDeleteFromGallery: false,

  async pickPhotos(options = { multiple: true }) {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.multiple = options.multiple ?? true
      input.onchange = () => {
        const files = Array.from(input.files ?? []).filter((f) =>
          f.type.startsWith('image/'),
        )
        resolve(files.map(createPhotoFile))
      }
      input.oncancel = () => resolve([])
      input.onerror = () => reject(new Error('Échec de la sélection'))
      input.click()
    })
  },

  async pickFolder() {
    if ('showDirectoryPicker' in window) {
      const dirHandle = await (
        window as Window & {
          showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>
        }
      ).showDirectoryPicker()
      const photos: PhotoFile[] = []

      async function walk(handle: FileSystemDirectoryHandle) {
        const iterable = handle as unknown as AsyncIterable<FileSystemHandle>
        for await (const entry of iterable) {
          if (entry.kind === 'file') {
            const file = await (entry as FileSystemFileHandle).getFile()
            if (file.type.startsWith('image/')) {
              photos.push(createPhotoFile(file))
            }
          } else if (entry.kind === 'directory') {
            await walk(entry as FileSystemDirectoryHandle)
          }
        }
      }

      await walk(dirHandle)
      return photos
    }

    return new Promise((resolve, reject) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.multiple = true
      ;(input as HTMLInputElement & { webkitdirectory: boolean }).webkitdirectory =
        true
      input.onchange = () => {
        const files = Array.from(input.files ?? []).filter((f) =>
          f.type.startsWith('image/'),
        )
        resolve(files.map(createPhotoFile))
      }
      input.oncancel = () => resolve([])
      input.onerror = () => reject(new Error('Échec de la sélection du dossier'))
      input.click()
    })
  },
}
