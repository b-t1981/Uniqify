import {
  formatDiskDeleteResult,
  hasDiskDeleteFailures,
  type DiskDeleteResult,
} from '@/core/photos/deleteFromDisk'

interface DeleteFeedbackProps {
  result: DiskDeleteResult | null
  fromGallery?: boolean
  onDismiss: () => void
}

export function DeleteFeedback({ result, fromGallery = false, onDismiss }: DeleteFeedbackProps) {
  if (!result) return null

  const message = formatDiskDeleteResult(result, { fromGallery })
  if (!message) return null

  const isError = hasDiskDeleteFailures(result)

  return (
    <div
      className={[
        'rounded-2xl px-4 py-3 text-[14px] leading-snug shadow-card',
        isError ? 'bg-danger-soft text-danger' : 'bg-accent-soft text-accent',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <p>{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-[13px] font-semibold opacity-80"
        >
          OK
        </button>
      </div>
      {isError ? (
        <p className="mt-2 text-[13px] opacity-90">
          {fromGallery
            ? 'Vérifiez que les photos ont été importées via « Ouvrir la galerie » et que l’accès complet est autorisé dans Réglages.'
            : 'Les fichiers en échec restent dans la liste. Réessayez ou vérifiez les permissions.'}
        </p>
      ) : null}
    </div>
  )
}
