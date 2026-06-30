import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { useAppState } from '@/hooks/useAppState'

export function DuplicatesPage() {
  const { photos, scanResult } = useAppState()

  const exact = scanResult?.exactDuplicates.length ?? 0
  const near = scanResult?.nearDuplicates.length ?? 0
  const lowQuality = scanResult?.lowQuality.length ?? 0

  return (
    <div>
      <PageHeader
        title="Doublons"
        description="Analyse des doublons exacts et proches — disponible à la v0.4."
      />

      {photos.length === 0 ? (
        <Card
          title="Importez d'abord des photos"
          description="Allez dans l'onglet Importer pour sélectionner vos fichiers."
        />
      ) : (
        <div className="space-y-4">
          <Card
            title="Scan en attente"
            description="Le moteur d'analyse sera branché dans les prochaines versions."
          >
            <ul className="space-y-2 text-sm text-text-muted">
              <li>· Doublons exacts (hash SHA-256) — v0.4</li>
              <li>· Doublons proches (pHash) — v0.5</li>
              <li>· Photos inutiles (flou, sombre…) — v0.6</li>
            </ul>
          </Card>

          <div className="grid grid-cols-3 gap-3">
            <Metric label="Exactes" value={exact} />
            <Metric label="Proches" value={near} />
            <Metric label="Inutiles" value={lowQuality} />
          </div>
        </div>
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface-raised p-3 text-center">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  )
}
