const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.heic',
  '.heif',
  '.bmp',
  '.tif',
  '.tiff',
  '.avif',
  '.jfif',
])

export interface CollectedDiskPhoto {
  file: File
  handle: FileSystemFileHandle
  relativePath: string
}

export function isImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true

  const name = file.name.toLowerCase()
  const dot = name.lastIndexOf('.')
  if (dot === -1) return false

  return IMAGE_EXTENSIONS.has(name.slice(dot))
}

export async function collectPhotosFromDirectory(
  handle: FileSystemDirectoryHandle,
  basePath = '',
): Promise<CollectedDiskPhoto[]> {
  const photos: CollectedDiskPhoto[] = []

  const entries = handle as FileSystemDirectoryHandle & {
    values: () => AsyncIterableIterator<FileSystemHandle>
  }

  for await (const entry of entries.values()) {
    const entryPath = basePath ? `${basePath}/${entry.name}` : entry.name

    if (entry.kind === 'file') {
      const fileHandle = entry as FileSystemFileHandle
      const file = await fileHandle.getFile()
      if (isImageFile(file)) {
        photos.push({
          file,
          handle: fileHandle,
          relativePath: entryPath,
        })
      }
      continue
    }

    if (entry.kind === 'directory') {
      const nested = await collectPhotosFromDirectory(
        entry as FileSystemDirectoryHandle,
        entryPath,
      )
      photos.push(...nested)
    }
  }

  return photos
}
