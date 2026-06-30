import { useEffect, useState } from 'react'
import type { PhotoFile } from '@/core/types/photo'

interface PhotoGridProps {
  photos: PhotoFile[]
}

const THUMB_SIZE = 280

export function PhotoGrid({ photos }: PhotoGridProps) {
  return (
    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
      {photos.map((photo) => (
        <PhotoThumb key={photo.id} photo={photo} />
      ))}
    </div>
  )
}

function PhotoThumb({ photo }: { photo: PhotoFile }) {
  const [url, setUrl] = useState<string | null>(photo.thumbnailUrl ?? null)

  useEffect(() => {
    if (photo.thumbnailUrl) return

    let cancelled = false
    createThumbnail(photo.file, THUMB_SIZE).then((thumbUrl) => {
      if (!cancelled) setUrl(thumbUrl)
    })

    return () => {
      cancelled = true
    }
  }, [photo.file, photo.thumbnailUrl])

  useEffect(() => {
    return () => {
      if (url && !photo.thumbnailUrl) URL.revokeObjectURL(url)
    }
  }, [url, photo.thumbnailUrl])

  return (
    <figure className="relative aspect-square overflow-hidden rounded-2xl bg-fill shadow-card">
      {url ? (
        <img
          src={url}
          alt={photo.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-label-tertiary">
          …
        </div>
      )}
    </figure>
  )
}

async function createThumbnail(file: File, maxSize: number): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return URL.createObjectURL(file)
  }

  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(URL.createObjectURL(blob ?? file)),
      'image/jpeg',
      0.82,
    )
  })
}
