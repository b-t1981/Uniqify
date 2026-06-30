import { useEffect, useState } from 'react'
import type { PhotoFile } from '@/core/types/photo'
import { resolvePhotoThumbnailUrl } from '@/core/photos/loadBytesForScan'

interface PhotoThumbProps {
  photo: PhotoFile
  size?: number
  className?: string
  onClick?: () => void
  overlay?: React.ReactNode
}

export function PhotoThumb({
  photo,
  size = 280,
  className = 'relative aspect-square overflow-hidden rounded-2xl bg-fill shadow-card',
  onClick,
  overlay,
}: PhotoThumbProps) {
  const [url, setUrl] = useState<string | null>(photo.thumbnailUrl ?? null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (photo.thumbnailUrl) {
      setUrl(photo.thumbnailUrl)
      return
    }

    let cancelled = false
    let objectUrl: string | null = null

    resolvePhotoThumbnailUrl(photo, size)
      .then((resolved) => {
        if (cancelled) {
          if (resolved?.startsWith('blob:')) URL.revokeObjectURL(resolved)
          return
        }
        if (!resolved) {
          setError(true)
          return
        }
        objectUrl = resolved.startsWith('blob:') ? resolved : null
        setUrl(resolved)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [photo, size, photo.thumbnailUrl])

  const content = (
    <>
      {url ? (
        <img src={url} alt={photo.name} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-label-tertiary">
          {error ? '—' : '…'}
        </div>
      )}
      {overlay}
    </>
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    )
  }

  return <figure className={className}>{content}</figure>
}
