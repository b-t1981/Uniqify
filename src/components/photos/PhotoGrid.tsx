import type { PhotoFile } from '@/core/types/photo'
import { PhotoThumb } from '@/components/photos/PhotoThumb'

interface PhotoGridProps {
  photos: PhotoFile[]
  maxVisible?: number
}

export function PhotoGrid({ photos, maxVisible = 120 }: PhotoGridProps) {
  const visible = photos.slice(0, maxVisible)
  const hiddenCount = Math.max(0, photos.length - visible.length)

  return (
    <div className="space-y-2">
      {hiddenCount > 0 ? (
        <p className="px-1 text-[13px] text-label-tertiary">
          Aperçu des {visible.length} premières photos — {hiddenCount} autre
          {hiddenCount > 1 ? 's' : ''} indexée{hiddenCount > 1 ? 's' : ''}.
        </p>
      ) : null}
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
        {visible.map((photo) => (
          <PhotoThumb key={photo.id} photo={photo} />
        ))}
      </div>
    </div>
  )
}
