import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { IconPhotos } from '@/components/ui/Icons'
import { PhotoGrid } from '@/components/photos/PhotoGrid'
import { ScanProgress } from '@/components/ui/ScanProgress'
import { useAppState } from '@/hooks/useAppState'
import { getPhotoAdapter } from '@/platforms'
import type { GalleryImportProgress } from '@/platforms/types'
import type { PhotoFile } from '@/core/types/photo'
import { deferToIdle } from '@/core/utils/async'

type ImportUiPhase = 'idle' | 'indexing' | 'committing' | 'done'

export function ImportPage() {
  const { photos, commitCatalogImport, clearAll } = useAppState()
  const [uiPhase, setUiPhase] = useState<ImportUiPhase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [importProgress, setImportProgress] = useState<GalleryImportProgress | null>(null)
  const [importSummary, setImportSummary] = useState<{ count: number } | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const adapter = getPhotoAdapter()

  const loading = uiPhase === 'indexing' || uiPhase === 'committing'

  async function finalizeImport(catalog: PhotoFile[]) {
    const count = catalog.length

    setUiPhase('committing')
    setImportProgress({
      phase: 'done',
      processed: count,
      total: count,
      message: count > 0 ? 'Préparation de l’affichage…' : 'Aucune nouvelle photo',
    })

    await deferToIdle()

    if (count > 0) {
      await commitCatalogImport(catalog)
    }

    setUiPhase('done')
    setImportProgress(null)
    if (count > 0) {
      setImportSummary({ count })
    }
  }

  async function runImport(
    action: () => Promise<PhotoFile[]>,
    loadingMessage = 'Chargement…',
  ) {
    setError(null)
    setImportSummary(null)
    setUiPhase('indexing')
    setImportProgress({
      phase: 'catalog',
      processed: 0,
      total: 0,
      message: loadingMessage,
    })

    try {
      const picked = await action()
      await finalizeImport(picked)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setUiPhase('idle')
        setImportProgress(null)
        return
      }
      setError(err instanceof Error ? err.message : 'Import impossible')
      setUiPhase('idle')
      setImportProgress(null)
    } finally {
      abortRef.current = null
    }
  }

  async function handleImportFullGallery() {
    if (!adapter.importFullGallery) return

    setError(null)
    setImportSummary(null)
    setUiPhase('indexing')
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const catalog = await adapter.importFullGallery({
        signal: controller.signal,
        onProgress: setImportProgress,
      })
      await finalizeImport(catalog)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setUiPhase('idle')
        setImportProgress(null)
        return
      }
      setError(err instanceof Error ? err.message : 'Indexation galerie impossible')
      setUiPhase('idle')
      setImportProgress(null)
    } finally {
      abortRef.current = null
    }
  }

  function handleCancelImport() {
    abortRef.current?.abort()
  }

  function dismissImportSummary() {
    setImportSummary(null)
    setUiPhase('idle')
  }

  const galleryLabel = adapter.canDeleteFromGallery
    ? 'Choisir dans la galerie'
    : 'Ouvrir la galerie / photothèque'

  const showGrid = photos.length > 0 && !loading

  return (
    <div>
      <PageHeader
        title="Photos"
        description="Indexez votre galerie iPhone sans charger toutes les images en mémoire."
        large={false}
      />

      <div className="space-y-4">
        <Card padding="none">
          <div className="space-y-3 p-4">
            <p
              className={[
                'rounded-2xl px-3 py-2 text-[13px] leading-snug',
                adapter.canDeleteFromGallery || adapter.canDeleteFromDisk
                  ? 'bg-accent-soft text-accent'
                  : 'bg-fill-secondary text-label-tertiary',
              ].join(' ')}
            >
              {adapter.importHint}
            </p>

            {adapter.canImportFullGallery && adapter.importFullGallery ? (
              <Button
                fullWidth
                size="lg"
                onClick={handleImportFullGallery}
                disabled={loading}
              >
                {uiPhase === 'indexing' && importProgress
                  ? `Indexation… ${importProgress.processed}/${importProgress.total || '…'}`
                  : uiPhase === 'committing'
                    ? 'Finalisation…'
                    : 'Indexer toute ma galerie'}
              </Button>
            ) : null}

            {adapter.canPickGallery && adapter.pickGallery ? (
              <Button
                fullWidth
                size="lg"
                variant={adapter.canImportFullGallery ? 'secondary' : 'primary'}
                onClick={() =>
                  runImport(
                    () => adapter.pickGallery!(),
                    'Copie des photos sélectionnées… (peut être long)',
                  )
                }
                disabled={loading}
              >
                {loading && importProgress ? importProgress.message : galleryLabel}
              </Button>
            ) : (
              <Button
                fullWidth
                size="lg"
                onClick={() => runImport(() => adapter.pickPhotos({ multiple: true }))}
                disabled={loading}
              >
                {loading ? 'Chargement…' : 'Choisir des photos'}
              </Button>
            )}

            {adapter.pickWritableFiles ? (
              <Button
                fullWidth
                variant="secondary"
                onClick={() => runImport(() => adapter.pickWritableFiles!())}
                disabled={loading}
              >
                Choisir des fichiers (suppression possible)
              </Button>
            ) : null}

            {adapter.canPickFolder && adapter.pickFolder ? (
              <Button
                fullWidth
                variant="secondary"
                onClick={() => runImport(() => adapter.pickFolder!())}
                disabled={loading}
              >
                Choisir un dossier (suppression possible)
              </Button>
            ) : null}

            {uiPhase === 'indexing' && adapter.canImportFullGallery ? (
              <Button fullWidth variant="secondary" onClick={handleCancelImport}>
                Annuler l’indexation
              </Button>
            ) : null}

            {importProgress && (importProgress.total > 0 || uiPhase === 'committing') ? (
              <ScanProgress
                processed={importProgress.processed}
                total={Math.max(importProgress.total, 1)}
                label={importProgress.message}
                status={uiPhase === 'committing' ? 'finalizing' : 'running'}
              />
            ) : null}

            {importSummary ? (
              <Card className="border-2 border-[#34c759]/30 bg-[#f0fdf4]">
                <p className="text-[15px] font-medium text-label">
                  {importSummary.count.toLocaleString('fr-FR')} photo
                  {importSummary.count > 1 ? 's' : ''} indexée
                  {importSummary.count > 1 ? 's' : ''}
                </p>
                <p className="mt-1 text-[13px] text-label-secondary">
                  Votre galerie est prête. Les aperçus se chargent progressivement.
                </p>
                <div className="mt-3 flex gap-2">
                  <Button fullWidth onClick={dismissImportSummary}>
                    OK
                  </Button>
                  <Link to="/doublons" className="flex-1">
                    <Button fullWidth variant="secondary">
                      Analyser
                    </Button>
                  </Link>
                </div>
              </Card>
            ) : null}

            {error ? (
              <p className="rounded-2xl bg-danger-soft px-3 py-2 text-[13px] leading-snug text-danger">
                {error}
              </p>
            ) : null}

            <p className="px-1 text-[12px] leading-snug text-label-tertiary">
              {adapter.deleteHint}
            </p>
          </div>
        </Card>

        {showGrid ? (
          <>
            <div className="flex items-center justify-between gap-3 px-1">
              <p className="text-[15px] font-medium text-label-secondary">
                {photos.length.toLocaleString('fr-FR')} photo{photos.length > 1 ? 's' : ''}{' '}
                indexée{photos.length > 1 ? 's' : ''}
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
        ) : photos.length === 0 ? (
          <EmptyState canOpenGallery={adapter.canPickGallery} />
        ) : (
          <p className="text-center text-[14px] text-label-secondary">
            {photos.length.toLocaleString('fr-FR')} photos en mémoire — finalisation…
          </p>
        )}
      </div>
    </div>
  )
}

function EmptyState({ canOpenGallery }: { canOpenGallery: boolean }) {
  return (
    <div className="flex flex-col items-center rounded-[28px] bg-surface px-6 py-14 text-center shadow-card">
      <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-fill-secondary">
        <IconPhotos className="h-10 w-10 text-label-tertiary" />
      </div>
      <p className="mt-5 text-[20px] font-semibold text-label">Aucune photo indexée</p>
      <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-label-tertiary">
        {canOpenGallery
          ? 'Indexez toute votre galerie ou sélectionnez un lot de photos à analyser.'
          : 'Sélectionnez vos photos pour détecter les doublons et les clichés inutiles.'}
      </p>
    </div>
  )
}
