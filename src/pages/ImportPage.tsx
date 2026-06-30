import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { IconPhotos } from '@/components/ui/Icons'
import { PhotoGrid } from '@/components/photos/PhotoGrid'
import { useAppState } from '@/hooks/useAppState'
import { getPhotoAdapter } from '@/platforms'

export function ImportPage() {
  const { photos, addPhotos, clearAll } = useAppState()
  const [loading, setLoading] = useState(false)
  const adapter = getPhotoAdapter()

  async function handlePickPhotos() {
    setLoading(true)
    try {
      const picked = await adapter.pickPhotos({ multiple: true })
      if (picked.length > 0) addPhotos(picked)
    } finally {
      setLoading(false)
    }
  }

  async function handlePickFolder() {
    if (!adapter.pickFolder) return
    setLoading(true)
    try {
      const picked = await adapter.pickFolder()
      if (picked.length > 0) addPhotos(picked)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Photos"
        description="Choisissez les images à analyser."
        large={false}
      />

      <div className="space-y-4">
        <Card padding="none">
          <div className="space-y-2 p-4">
            <Button fullWidth size="lg" onClick={handlePickPhotos} disabled={loading}>
              {loading ? 'Chargement…' : 'Choisir des photos'}
            </Button>
            {adapter.canPickFolder && adapter.pickFolder ? (
              <Button
                fullWidth
                variant="secondary"
                onClick={handlePickFolder}
                disabled={loading}
              >
                Choisir un dossier
              </Button>
            ) : null}
          </div>
        </Card>

        {photos.length > 0 ? (
          <>
            <div className="flex items-center justify-between gap-3 px-1">
              <p className="text-[15px] font-medium text-label-secondary">
                {photos.length} photo{photos.length > 1 ? 's' : ''}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-[15px] font-medium text-danger"
                >
                  Tout effacer
                </button>
                <Link to="/doublons" className="text-[15px] font-medium text-accent">
                  Analyser
                </Link>
              </div>
            </div>
            <PhotoGrid photos={photos} />
          </>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-[28px] bg-surface px-6 py-14 text-center shadow-card">
      <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-fill-secondary">
        <IconPhotos className="h-10 w-10 text-label-tertiary" />
      </div>
      <p className="mt-5 text-[20px] font-semibold text-label">Votre galerie est vide</p>
      <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-label-tertiary">
        Sélectionnez vos photos pour détecter les doublons et les clichés inutiles.
      </p>
    </div>
  )
}
