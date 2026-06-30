import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, StatPill } from '@/components/ui/Card'
import { ScanProgress } from '@/components/ui/ScanProgress'
import { DeleteFeedback } from '@/components/ui/DeleteFeedback'
import { LowQualityList } from '@/components/photos/LowQualityList'
import { DuplicateGroupList } from '@/components/photos/DuplicateGroupList'
import { Button } from '@/components/ui/Button'
import { ScanPlanCard } from '@/components/scan/ScanPlanCard'
import {
  ScanCompleteCard,
  type ScanCompleteSummary,
} from '@/components/scan/ScanCompleteCard'
import { useAppState } from '@/hooks/useAppState'
import type { DiskDeleteResult } from '@/core/photos/deleteFromDisk'
import {
  confirmGalleryDelete,
  photosWithoutGalleryId,
} from '@/core/photos/confirmDelete'
import {
  allDuplicateCopiesToRemove,
  duplicatePhotosToRemove,
} from '@/core/photos/pruneScanResult'
import { isNativeIOS } from '@/platforms/native/uniqifyPhotosPlugin'
import { beginScanKeepAwake, endScanKeepAwake, isKeepAwakeSupported } from '@/core/scan/keepAwake'
import { ensureNotificationPermission, notifyScanComplete } from '@/core/scan/scanNotifications'
import { mergeScanResult } from '@/core/scan/mergeScanResults'
import {
  buildPreAnalysis,
  resolveScanScope,
  type ScanScopeMode,
} from '@/core/scan/preAnalyze'
import { runFullAnalysis, type FullScanProgress } from '@/core/scan/runFullAnalysis'

type PlanPhase = 'idle' | 'preview' | 'scanning' | 'finalizing' | 'complete'

export function DuplicatesPage() {
  const {
    photos,
    scanResult,
    analyzedPhotoIds,
    setScanResult,
    markPhotosAnalyzed,
    removePhotos,
  } = useAppState()

  const [planPhase, setPlanPhase] = useState<PlanPhase>('idle')
  const [scopeMode, setScopeMode] = useState<ScanScopeMode>('full')
  const [scanProgress, setScanProgress] = useState<FullScanProgress | null>(null)
  const [completeSummary, setCompleteSummary] = useState<ScanCompleteSummary | null>(null)
  const [deleteResult, setDeleteResult] = useState<DiskDeleteResult | null>(null)
  const [removing, setRemoving] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [exactKeepers, setExactKeepers] = useState<Record<string, string>>({})
  const [nearKeepers, setNearKeepers] = useState<Record<string, string>>({})
  const [keepScreenOn, setKeepScreenOn] = useState(isKeepAwakeSupported())
  const [notifyWhenDone, setNotifyWhenDone] = useState(true)
  const scanAbortRef = useRef<AbortController | null>(null)

  const analyzedSet = useMemo(() => new Set(analyzedPhotoIds), [analyzedPhotoIds])

  const preAnalysis = useMemo(
    () => buildPreAnalysis(photos, analyzedSet),
    [photos, analyzedSet],
  )

  useEffect(() => {
    if (isNativeIOS()) {
      void ensureNotificationPermission()
    }
    return () => {
      scanAbortRef.current?.abort()
      void endScanKeepAwake()
    }
  }, [])

  const scanning = planPhase === 'scanning' || planPhase === 'finalizing'
  const showScanControls = planPhase === 'idle' || planPhase === 'complete'

  const exactGroups = scanResult?.exactDuplicates ?? []
  const nearGroups = scanResult?.nearDuplicates ?? []
  const lowQualityGroups = scanResult?.lowQuality ?? []

  const exact = exactGroups.length
  const near = nearGroups.length
  const lowQuality = lowQualityGroups.length
  const hasResults = exact > 0 || near > 0 || lowQuality > 0

  function abortActiveScan() {
    scanAbortRef.current?.abort()
    scanAbortRef.current = null
    setPlanPhase('idle')
    setScanProgress(null)
    void endScanKeepAwake()
  }

  function openPreAnalysis() {
    if (photos.length === 0 || scanning || removing) return
    setScanError(null)
    setCompleteSummary(null)
    setScopeMode(preAnalysis.remainingPhotos > preAnalysis.batchSize ? 'batch' : 'full')
    setPlanPhase('preview')
  }

  function dismissComplete() {
    setCompleteSummary(null)
    setPlanPhase('idle')
  }

  async function confirmAndRunScan() {
    const scope = resolveScanScope(photos, analyzedSet, scopeMode)
    if (scope.length === 0) return

    setPlanPhase('scanning')
    setScanError(null)
    setCompleteSummary(null)

    scanAbortRef.current?.abort()
    const controller = new AbortController()
    scanAbortRef.current = controller
    const signal = controller.signal

    await beginScanKeepAwake(keepScreenOn)
    let finishedSuccessfully = false

    try {
      const result = await runFullAnalysis(scope, setScanProgress, signal)
      if (signal.aborted) return

      setPlanPhase('finalizing')
      setScanProgress((current) =>
        current
          ? { ...current, currentName: '', overallProcessed: current.overallTotal }
          : current,
      )

      setScanResult((current) =>
        mergeScanResult(current, scope, {
          exactDuplicates: result.exactDuplicates,
          nearDuplicates: result.nearDuplicates,
          lowQuality: result.lowQuality,
        }),
      )
      markPhotosAnalyzed(scope.map((photo) => photo.id))

      setCompleteSummary({
        photoCount: scope.length,
        exact: result.exactCount,
        near: result.nearCount,
        lowQuality: result.lowQualityCount,
      })
      setPlanPhase('complete')
      setScanProgress(null)
      finishedSuccessfully = true

      if (notifyWhenDone) {
        void notifyScanComplete({
          exact: result.exactCount,
          near: result.nearCount,
          lowQuality: result.lowQualityCount,
          photoCount: scope.length,
        })
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setPlanPhase('idle')
        return
      }
      setScanError(error instanceof Error ? error.message : 'Analyse échouée')
      setPlanPhase('idle')
    } finally {
      if (scanAbortRef.current?.signal === signal) scanAbortRef.current = null
      if (!finishedSuccessfully) setScanProgress(null)
      await endScanKeepAwake()
    }
  }

  async function runRemoval(photoIds: string[]) {
    if (photoIds.length === 0) return

    if (scanning) {
      abortActiveScan()
    }

    const targets = photos.filter((photo) => photoIds.includes(photo.id))
    const withoutGalleryId = targets.filter((photo) => !photo.nativeAssetId && !photo.diskHandle)
    const deletableCount = targets.length - withoutGalleryId.length

    if (deletableCount === 0) {
      window.alert(
        photosWithoutGalleryId(withoutGalleryId.length) ??
          'Ces photos ne peuvent pas être supprimées de la galerie. Réimportez-les via « Ouvrir la galerie ».',
      )
      return
    }

    if (!confirmGalleryDelete(deletableCount)) return

    setRemoving(true)
    try {
      const result = await removePhotos(photoIds)
      setDeleteResult(result)
    } finally {
      setRemoving(false)
    }
  }

  async function handleKeepInGroup(_groupId: string, keepPhotoId: string) {
    const groups = [...exactGroups, ...nearGroups]
    const toRemove = duplicatePhotosToRemove(groups, keepPhotoId)
    await runRemoval(toRemove)
  }

  async function handleRemovePhoto(photoId: string) {
    await runRemoval([photoId])
  }

  async function handleCleanAllExactDuplicates() {
    await runRemoval(allDuplicateCopiesToRemove(exactGroups, exactKeepers))
  }

  async function handleCleanAllNearDuplicates() {
    await runRemoval(allDuplicateCopiesToRemove(nearGroups, nearKeepers))
  }

  const progress = scanProgress
    ? {
        processed: scanProgress.overallProcessed,
        total: scanProgress.overallTotal,
        label:
          scanProgress.overallProcessed >= scanProgress.overallTotal
            ? 'Enregistrement des résultats…'
            : `${scanProgress.phaseLabel} · ${scanProgress.currentName || '…'}`,
      }
    : null

  const scanAtEnd =
    scanProgress !== null &&
    scanProgress.overallTotal > 0 &&
    scanProgress.overallProcessed >= scanProgress.overallTotal

  const coverageLabel =
    preAnalysis.alreadyAnalyzed > 0
      ? `${preAnalysis.alreadyAnalyzed}/${preAnalysis.totalPhotos} analysées`
      : null

  if (photos.length === 0) {
    return (
      <div>
        <PageHeader title="Analyser" description="Détectez ce qui encombre votre galerie." large={false} />
        <Card>
          <p className="text-[15px] text-label-secondary">
            Importez d&apos;abord vos photos pour lancer une analyse.
          </p>
          <Link to="/import" className="mt-4 block">
            <Button fullWidth>Importer des photos</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Analyser"
        description={
          coverageLabel
            ? `${photos.length} photo${photos.length > 1 ? 's' : ''} · ${coverageLabel}`
            : `${photos.length} photo${photos.length > 1 ? 's' : ''} importée${photos.length > 1 ? 's' : ''}.`
        }
        large={false}
      />

      <div className="space-y-4">
        <DeleteFeedback
          result={deleteResult}
          fromGallery={isNativeIOS()}
          onDismiss={() => setDeleteResult(null)}
        />

        {scanError ? (
          <p className="rounded-2xl bg-danger-soft px-3 py-2 text-[13px] leading-snug text-danger">
            {scanError}
          </p>
        ) : null}

        {isNativeIOS() ? (
          <p className="rounded-2xl bg-accent-soft px-3 py-2 text-[13px] leading-snug text-accent">
            Les photos supprimées disparaissent de votre galerie iPhone (double confirmation iOS).
          </p>
        ) : null}

        {hasResults || scanResult ? (
          <div className="grid grid-cols-3 gap-2">
            <StatPill label="Exactes" value={exact} />
            <StatPill label="Proches" value={near} />
            <StatPill label="Inutiles" value={lowQuality} />
          </div>
        ) : null}

        {planPhase === 'preview' ? (
          <ScanPlanCard
            preAnalysis={preAnalysis}
            mode={scopeMode}
            onModeChange={setScopeMode}
            onConfirm={() => void confirmAndRunScan()}
            onCancel={() => setPlanPhase('idle')}
          />
        ) : planPhase === 'complete' && completeSummary ? (
          <ScanCompleteCard summary={completeSummary} onDismiss={dismissComplete} />
        ) : showScanControls ? (
          <>
            <Card padding="sm">
              <div className="space-y-3">
                {isKeepAwakeSupported() ? (
                  <ScanOptionToggle
                    label="Garder l’écran actif pendant l’analyse"
                    checked={keepScreenOn}
                    onChange={setKeepScreenOn}
                  />
                ) : null}
                <ScanOptionToggle
                  label="Me notifier quand l’analyse est terminée"
                  checked={notifyWhenDone}
                  onChange={setNotifyWhenDone}
                />
                <p className="text-[12px] leading-snug text-label-tertiary">
                  Votre galerie et les résultats sont sauvegardés localement. Vous pouvez fermer
                  l’app et revenir plus tard.
                </p>
              </div>
            </Card>

            <Button fullWidth size="lg" onClick={openPreAnalysis} disabled={removing}>
              {hasResults ? 'Relancer l’analyse' : 'Analyser ma galerie'}
            </Button>

            {preAnalysis.remainingPhotos > 0 && preAnalysis.alreadyAnalyzed > 0 ? (
              <p className="text-center text-[13px] text-label-secondary">
                {preAnalysis.remainingPhotos} photo{preAnalysis.remainingPhotos > 1 ? 's' : ''}{' '}
                restante{preAnalysis.remainingPhotos > 1 ? 's' : ''} à analyser
                {preAnalysis.remainingPhotos > preAnalysis.batchSize
                  ? ` · ${preAnalysis.batchIterations} lots possibles`
                  : ''}
              </p>
            ) : null}
          </>
        ) : null}

        {planPhase === 'scanning' && progress ? (
          <ScanProgress
            {...progress}
            status={scanAtEnd ? 'finalizing' : 'running'}
          />
        ) : null}

        {planPhase === 'finalizing' && progress ? (
          <ScanProgress {...progress} status="finalizing" />
        ) : null}

        {planPhase === 'scanning' && !scanAtEnd ? (
          <Button fullWidth variant="secondary" onClick={abortActiveScan}>
            Annuler l’analyse
          </Button>
        ) : null}

        {exact > 0 ? (
          <section className="space-y-3">
            <SectionTitle title="Doublons exacts" count={exact} />
            <Button
              fullWidth
              variant="danger"
              onClick={handleCleanAllExactDuplicates}
              disabled={removing}
            >
              {removing ? 'Suppression…' : 'Supprimer toutes les copies en trop'}
            </Button>
            <DuplicateGroupList
              groups={exactGroups}
              variant="exact"
              keepers={exactKeepers}
              onKeepersChange={setExactKeepers}
              onKeepPhoto={handleKeepInGroup}
              onRemovePhoto={handleRemovePhoto}
            />
          </section>
        ) : null}

        {near > 0 ? (
          <section className="space-y-3">
            <SectionTitle title="Doublons proches" count={near} />
            <Button
              fullWidth
              variant="danger"
              onClick={handleCleanAllNearDuplicates}
              disabled={removing}
            >
              {removing ? 'Suppression…' : 'Supprimer toutes les copies en trop'}
            </Button>
            <DuplicateGroupList
              groups={nearGroups}
              variant="near"
              keepers={nearKeepers}
              onKeepersChange={setNearKeepers}
              onKeepPhoto={handleKeepInGroup}
              onRemovePhoto={handleRemovePhoto}
            />
          </section>
        ) : null}

        {lowQuality > 0 ? (
          <section className="space-y-3">
            <SectionTitle title="Photos inutiles" count={lowQuality} />
            <LowQualityList groups={lowQualityGroups} onRemovePhoto={handleRemovePhoto} />
          </section>
        ) : null}

        {scanResult && planPhase === 'idle' && !hasResults ? (
          <Card>
            <p className="text-[15px] text-label-secondary">
              Aucun doublon ni photo inutile détecté sur le périmètre analysé.
              {preAnalysis.remainingPhotos > 0
                ? ' Lancez un nouveau passage pour couvrir le reste de la galerie.'
                : ''}
            </p>
          </Card>
        ) : null}
      </div>
    </div>
  )
}

function SectionTitle({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between px-1">
      <h2 className="text-[20px] font-semibold tracking-tight text-label">{title}</h2>
      <span className="rounded-full bg-fill px-2.5 py-1 text-[12px] font-semibold text-label-secondary">
        {count}
      </span>
    </div>
  )
}

function ScanOptionToggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="text-[14px] text-label-secondary">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          'relative h-7 w-12 shrink-0 rounded-full transition',
          checked ? 'bg-accent' : 'bg-fill',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition',
            checked ? 'left-[22px]' : 'left-0.5',
          ].join(' ')}
        />
      </button>
    </label>
  )
}
