import { useEffect, useState } from 'react'
import type { PhotoGroup } from '@/core/types/photo'
import { QUALITY_ISSUE_LABELS } from '@/core/types/quality'

interface LowQualityListProps {
  groups: PhotoGroup[]
}

const THUMB_SIZE = 280

export function LowQualityList({ groups }: LowQualityListProps) {
  if (groups.length === 0) {
    return (
      <p className="px-1 text-[15px] text-label-tertiary">
        Aucune photo inutile détectée.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const photo = group.photos[0]
        if (!photo) return null

        return (
          <article
            key={group.id}
            className="flex gap-3 rounded-[22px] bg-surface p-3 shadow-card"
          >
            <LowQualityThumb photo={photo} />
            <div className="min-w-0 flex-1 py-0.5">
              <p className="truncate text-[15px] font-semibold text-label">{photo.name}</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {(group.qualityIssues ?? []).map((issue) => (
                  <li
                    key={issue}
                    className="rounded-full bg-danger-soft px-2.5 py-1 text-[11px] font-semibold text-danger"
                  >
                    {QUALITY_ISSUE_LABELS[issue]}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        )
      })}
    </div>
  )
}

function LowQualityThumb({ photo }: { photo: PhotoGroup['photos'][0] }) {
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
    <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl bg-fill">
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-label-tertiary">
          …
        </div>
      )}
    </div>
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
