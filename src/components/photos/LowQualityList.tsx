import type { PhotoGroup } from '@/core/types/photo'
import { QUALITY_ISSUE_LABELS } from '@/core/types/quality'
import { PhotoThumb } from '@/components/photos/PhotoThumb'

interface LowQualityListProps {
  groups: PhotoGroup[]
  onRemovePhoto: (photoId: string) => void
}

export function LowQualityList({ groups, onRemovePhoto }: LowQualityListProps) {
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
            <PhotoThumb
              photo={photo}
              size={144}
              className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl bg-fill"
            />
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
              <button
                type="button"
                onClick={() => onRemovePhoto(photo.id)}
                className="mt-3 text-[15px] font-semibold text-danger"
              >
                Supprimer
              </button>
            </div>
          </article>
        )
      })}
    </div>
  )
}
