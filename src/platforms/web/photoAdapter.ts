import type { PhotoFile } from '@/core/types/photo'
import type { PhotoLibraryAdapter } from '@/platforms/types'
import {
  collectPhotosFromDirectory,
  isImageFile,
} from '@/platforms/web/collectFolderPhotos'
import {
  isMobileWeb,
  supportsDiskDelete,
  supportsFolderPick,
  supportsGalleryPick,
  supportsWritableFilePick,
} from '@/platforms/web/capabilities'

const IMAGE_TYPES = [
  {
    description: 'Images',
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif', '.bmp'],
    },
  },
]

function createPhotoFile(
  file: File,
  displayName?: string,
  diskHandle?: FileSystemFileHandle,
): PhotoFile {
  return {
    id: crypto.randomUUID(),
    file,
    name: displayName ?? file.name,
    size: file.size,
    lastModified: file.lastModified,
    source: 'file',
    diskHandle,
  }
}

function pickViaFileInput(multiple: boolean): Promise<PhotoFile[]> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = multiple
    input.onchange = () => {
      const files = Array.from(input.files ?? []).filter(isImageFile)
      resolve(files.map((file) => createPhotoFile(file)))
    }
    input.oncancel = () => resolve([])
    input.onerror = () => reject(new Error('Échec de la sélection'))
    input.click()
  })
}

async function pickViaWritableFilePicker(multiple: boolean): Promise<PhotoFile[]> {
  const handles = await (
    window as Window & {
      showOpenFilePicker: (options?: {
        multiple?: boolean
        mode?: 'read' | 'readwrite'
        types?: Array<{
          description: string
          accept: Record<string, string[]>
        }>
      }) => Promise<FileSystemFileHandle[]>
    }
  ).showOpenFilePicker({
    multiple,
    mode: 'readwrite',
    types: IMAGE_TYPES,
  })

  const photos: PhotoFile[] = []
  for (const handle of handles) {
    const file = await handle.getFile()
    if (!isImageFile(file)) continue
    photos.push(createPhotoFile(file, file.name, handle))
  }

  return photos
}

function getImportHint(): string {
  if (supportsDiskDelete()) {
    return 'Ouvrez votre galerie ou importez un dossier pour pouvoir supprimer les doublons sur l’appareil.'
  }

  if (isMobileWeb()) {
    return 'Vous pouvez parcourir la galerie. Pour supprimer réellement les fichiers, utilisez Chrome ou Edge sur ordinateur, ou l’app iPhone Uniqify.'
  }

  return 'Utilisez Chrome ou Edge pour importer avec suppression (dossier ou fichiers).'
}

function getDeleteHint(): string {
  if (supportsDiskDelete()) {
    return 'Suppression réelle : importez via « dossier » ou « fichiers » (Chrome/Edge). La galerie seule retire les photos de la session.'
  }

  return 'Sans permission d’écriture, les photos ne sont retirées que de la session Uniqify.'
}

export const webPhotoAdapter: PhotoLibraryAdapter = {
  platformLabel: 'Web',

  canPickGallery: supportsGalleryPick(),
  canImportFullGallery: false,
  canPickFolder: supportsFolderPick(),
  canDeleteFromGallery: false,
  canDeleteFromDisk: supportsDiskDelete(),

  importHint: getImportHint(),
  deleteHint: getDeleteHint(),

  async pickGallery() {
    return pickViaFileInput(true)
  },

  async pickWritableFiles() {
    if (!supportsWritableFilePick()) {
      throw new Error('Sélection de fichiers avec suppression non supportée')
    }

    return pickViaWritableFilePicker(true)
  },

  async pickPhotos(options = { multiple: true }) {
    const multiple = options.multiple ?? true

    if (!isMobileWeb() && supportsWritableFilePick()) {
      try {
        return await pickViaWritableFilePicker(multiple)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return []
        }
      }
    }

    return pickViaFileInput(multiple)
  },

  async pickFolder() {
    if ('showDirectoryPicker' in window) {
      const dirHandle = await (
        window as Window & {
          showDirectoryPicker: (options?: {
            mode?: 'read' | 'readwrite'
          }) => Promise<FileSystemDirectoryHandle>
        }
      ).showDirectoryPicker({ mode: 'readwrite' })

      const collected = await collectPhotosFromDirectory(dirHandle)
      return collected.map((item) =>
        createPhotoFile(item.file, item.relativePath, item.handle),
      )
    }

    return new Promise((resolve, reject) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.multiple = true
      const directoryInput = input as HTMLInputElement & {
        webkitdirectory: boolean
        directory: boolean
      }
      directoryInput.webkitdirectory = true
      directoryInput.directory = true

      input.onchange = () => {
        const files = Array.from(input.files ?? []).filter(isImageFile)
        resolve(
          files.map((file) =>
            createPhotoFile(file, file.webkitRelativePath || file.name),
          ),
        )
      }
      input.oncancel = () => resolve([])
      input.onerror = () => reject(new Error('Échec de la sélection du dossier'))
      input.click()
    })
  },
}
