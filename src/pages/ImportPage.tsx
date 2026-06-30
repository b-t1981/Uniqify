import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
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
        title="Importer"
        description="Sélectionnez des photos ou un dossier. Sur iPhone, utilisez le sélecteur Photos."
      />

      <div className="space-y-4">
        <Card
          title="Sélection"
          description={
            adapter.canPickFolder
              ? 'Desktop : dossier entier ou fichiers. Mobile : sélection multiple.'
              : 'Ouvrez le sélecteur natif et choisissez vos photos.'
          }
        >
          <div className="flex flex-wrap gap-3">
            <Button onClick={handlePickPhotos} disabled={loading}>
              {loading ? 'Chargement…' : 'Choisir des photos'}
            </Button>
            {adapter.canPickFolder && adapter.pickFolder ? (
              <Button
                variant="secondary"
                onClick={handlePickFolder}
                disabled={loading}
              >
                Choisir un dossier
              </Button>
            ) : null}
            {photos.length > 0 ? (
              <Button variant="ghost" onClick={clearAll}>
                Tout effacer
              </Button>
            ) : null}
          </div>
        </Card>

        {photos.length > 0 ? (
          <div>
            <p className="mb-3 text-sm text-text-muted">
              {photos.length} photo{photos.length > 1 ? 's' : ''} importée
              {photos.length > 1 ? 's' : ''}
            </p>
            <PhotoGrid photos={photos} />
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
      <p className="text-4xl">📷</p>
      <p className="mt-3 font-medium">Aucune photo importée</p>
      <p className="mt-1 max-w-sm text-sm text-text-muted">
        Appuyez sur « Choisir des photos » pour commencer l'analyse.
      </p>
    </div>
  )
}
