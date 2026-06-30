import type { PreAnalysis, ScanScopeMode } from '@/core/scan/preAnalyze'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface ScanPlanCardProps {
  preAnalysis: PreAnalysis
  mode: ScanScopeMode
  onModeChange: (mode: ScanScopeMode) => void
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export function ScanPlanCard({
  preAnalysis,
  mode,
  onModeChange,
  onConfirm,
  onCancel,
  loading = false,
}: ScanPlanCardProps) {
  const {
    totalPhotos,
    alreadyAnalyzed,
    remainingPhotos,
    batchSize,
    batchPhotoCount,
    batchIterations,
    estimatedLabelFull,
    estimatedLabelBatch,
  } = preAnalysis

  const scopeCount = mode === 'full' ? remainingPhotos : batchPhotoCount
  const scopeLabel =
    mode === 'full'
      ? estimatedLabelFull
      : estimatedLabelBatch

  const allDone = remainingPhotos === 0

  return (
    <Card title="Pré-analyse" description="Estimation avant lancement — rien n’est modifié tant que vous n’avez pas confirmé.">
      <dl className="space-y-2 text-[14px]">
        <Row label="Galerie indexée" value={`${totalPhotos} photo${totalPhotos > 1 ? 's' : ''}`} />
        {alreadyAnalyzed > 0 ? (
          <Row
            label="Déjà analysées"
            value={`${alreadyAnalyzed} photo${alreadyAnalyzed > 1 ? 's' : ''}`}
          />
        ) : null}
        <Row
          label={allDone ? 'À ré-analyser' : 'Restantes'}
          value={
            allDone
              ? `${totalPhotos} (toute la galerie)`
              : `${remainingPhotos} photo${remainingPhotos > 1 ? 's' : ''}`
          }
        />
      </dl>

      <div className="mt-4 space-y-2">
        <ScopeOption
          selected={mode === 'full'}
          onSelect={() => onModeChange('full')}
          title={allDone ? 'Tout analyser à nouveau' : 'Analyser tout le reste'}
          subtitle={
            allDone
              ? `Durée estimée : ${estimatedLabelFull} — vous pouvez fermer l’app, les résultats sont sauvegardés.`
              : `${remainingPhotos} photo${remainingPhotos > 1 ? 's' : ''} · ${estimatedLabelFull} · traitement en arrière-plan possible`
          }
        />
        {!allDone && remainingPhotos > batchSize ? (
          <ScopeOption
            selected={mode === 'batch'}
            onSelect={() => onModeChange('batch')}
            title={`Par lot (${batchSize} plus anciennes)`}
            subtitle={`${batchPhotoCount} photos ce lot · ${estimatedLabelBatch} · ${batchIterations} passage${batchIterations > 1 ? 's' : ''} pour tout couvrir`}
          />
        ) : null}
        {!allDone && remainingPhotos > 0 && remainingPhotos <= batchSize ? (
          <p className="rounded-xl bg-fill-secondary px-3 py-2 text-[13px] leading-snug text-label-secondary">
            Moins de {batchSize} photos restantes — un seul lot suffit pour tout couvrir.
          </p>
        ) : null}
      </div>

      <div className="mt-4 rounded-xl bg-accent-soft px-3 py-2.5">
        <p className="text-[13px] font-medium text-accent">
          Ce passage : {scopeCount} photo{scopeCount > 1 ? 's' : ''} · {scopeLabel}
        </p>
        <p className="mt-1 text-[12px] leading-snug text-label-secondary">
          Doublons exacts, proches et photos inutiles (flou, sombre, mal cadré).
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <Button fullWidth size="lg" onClick={onConfirm} disabled={loading}>
          {loading ? 'Préparation…' : 'Lancer l’analyse'}
        </Button>
        <Button fullWidth variant="secondary" onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
      </div>
    </Card>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-label-secondary">{label}</dt>
      <dd className="font-medium text-label">{value}</dd>
    </div>
  )
}

function ScopeOption({
  selected,
  onSelect,
  title,
  subtitle,
}: {
  selected: boolean
  onSelect: () => void
  title: string
  subtitle: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'w-full rounded-2xl border-2 px-3 py-3 text-left transition',
        selected ? 'border-accent bg-accent-soft/40' : 'border-transparent bg-fill-secondary',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <span
          className={[
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
            selected ? 'border-accent bg-accent' : 'border-label-tertiary',
          ].join(' ')}
        >
          {selected ? (
            <span className="h-2 w-2 rounded-full bg-white" />
          ) : null}
        </span>
        <span>
          <span className="block text-[15px] font-medium text-label">{title}</span>
          <span className="mt-1 block text-[13px] leading-snug text-label-secondary">
            {subtitle}
          </span>
        </span>
      </div>
    </button>
  )
}
