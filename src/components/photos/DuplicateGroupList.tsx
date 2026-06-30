import { useEffect } from 'react'
import type { PhotoGroup } from '@/core/types/photo'
import { Button } from '@/components/ui/Button'
import { PhotoThumb } from '@/components/photos/PhotoThumb'

interface DuplicateGroupListProps {
  groups: PhotoGroup[]
  variant?: 'exact' | 'near'
  keepers: Record<string, string>
  onKeepersChange: (keepers: Record<string, string>) => void
  onKeepPhoto: (groupId: string, keepPhotoId: string) => void
  onRemovePhoto: (photoId: string) => void
}

export function DuplicateGroupList({
  groups,
  variant = 'exact',
  keepers,
  onKeepersChange,
  onKeepPhoto,
  onRemovePhoto,
}: DuplicateGroupListProps) {
  useEffect(() => {
    const next = { ...keepers }
    let changed = false

    for (const group of groups) {
      const first = group.photos[0]
      if (!first) continue
      if (!next[group.id] || !group.photos.some((photo) => photo.id === next[group.id])) {
        next[group.id] = first.id
        changed = true
      }
    }

    if (changed) onKeepersChange(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialise les gardiens par défaut
  }, [groups])

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
      {groups.map((group) => {
        const keeperId = keepers[group.id] ?? group.photos[0]?.id
        const copiesCount = Math.max(0, group.photos.length - 1)

        return (
          <article
            key={group.id}
            className="overflow-hidden rounded-[22px] bg-surface shadow-card"
          >
            <header className="flex items-center justify-between border-b border-separator/60 px-4 py-3">
              <p className="text-[15px] font-semibold text-label">
                {group.photos.length} photos
              </p>
              <span className="rounded-full bg-fill px-2.5 py-1 text-[11px] font-semibold text-label-secondary">
                {variant === 'near' ? `~${group.similarity ?? 0}%` : 'Identiques'}
              </span>
            </header>

            <div className="grid grid-cols-3 gap-1.5 p-3 sm:grid-cols-4">
              {group.photos.map((photo) => {
                const isKeeper = photo.id === keeperId

                return (
                  <figure key={photo.id} className="relative">
                    <PhotoThumb
                      photo={photo}
                      size={200}
                      className={[
                        'relative aspect-square w-full overflow-hidden rounded-xl bg-fill transition',
                        isKeeper ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : '',
                      ].join(' ')}
                      onClick={() =>
                        onKeepersChange({ ...keepers, [group.id]: photo.id })
                      }
                      overlay={
                        <span
                          className={[
                            'absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white',
                            isKeeper ? 'bg-accent' : 'bg-black/55',
                          ].join(' ')}
                        >
                          {isKeeper ? 'Garder' : 'Copie'}
                        </span>
                      }
                    />
                    {!isKeeper ? (
                      <button
                        type="button"
                        onClick={() => onRemovePhoto(photo.id)}
                        aria-label={`Supprimer ${photo.name}`}
                        className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-[11px] font-bold text-white shadow-sm"
                      >
                        ×
                      </button>
                    ) : null}
                  </figure>
                )
              })}
            </div>

            <div className="space-y-2 border-t border-separator/60 p-3">
              <p className="text-[13px] text-label-tertiary">
                Touchez une photo pour la garder. Les autres pourront être supprimées.
              </p>
              {keeperId && copiesCount > 0 ? (
                <Button
                  fullWidth
                  variant="danger"
                  onClick={() => onKeepPhoto(group.id, keeperId)}
                >
                  Garder la sélection · supprimer {copiesCount} copie
                  {copiesCount > 1 ? 's' : ''}
                </Button>
              ) : null}
            </div>
          </article>
        )
      })}
    </div>
  )
}
