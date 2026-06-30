import { useEffect, useState } from 'react'
import type { PhotoFile, PhotoGroup } from '@/core/types/photo'

interface DuplicateGroupListProps {
  groups: PhotoGroup[]
  variant?: 'exact' | 'near'
}

const THUMB_SIZE = 200

export function DuplicateGroupList({
  groups,
  variant = 'exact',
}: DuplicateGroupListProps) {
  if (groups.length === 0) {
    return (
      <p className="px-1 text-[15px] text-label-tertiary">
        {variant === 'near'
          ? 'Aucun doublon proche détecté.'
          : 'Aucun doublon exact détecté.'}
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <article key={group.id} className="overflow-hidden rounded-[22px] bg-surface shadow-card">
          <header className="flex items-center justify-between border-b border-separator/60 px-4 py-3">
            <p className="text-[15px] font-semibold text-label">
              {group.photos.length} photos
            </p>
            <span className="rounded-full bg-fill px-2.5 py-1 text-[11px] font-semibold text-label-secondary">
              {variant === 'near' ? `~${group.similarity ?? 0}%` : 'Identiques'}
            </span>
          </header>

          <div className="grid grid-cols-3 gap-1.5 p-3 sm:grid-cols-4">
            {group.photos.map((photo, index) => (
              <DuplicateThumb
                key={photo.id}
                photo={photo}
                label={variant === 'near' ? `${index + 1}` : index === 0 ? '★' : `${index}`}
              />
            ))}
          </div>
        </article>
      ))}
    </div>
  )
}

function DuplicateThumb({ photo, label }: { photo: PhotoFile; label: string }) {
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
    <figure className="relative aspect-square overflow-hidden rounded-xl bg-fill">
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-label-tertiary">…</div>
      )}
      <span className="absolute left-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-black/55 px-1 text-[10px] font-semibold text-white">
        {label}
      </span>
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
