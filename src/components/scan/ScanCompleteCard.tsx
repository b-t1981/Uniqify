import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export interface ScanCompleteSummary {
  photoCount: number
  exact: number
  near: number
  lowQuality: number
}

interface ScanCompleteCardProps {
  summary: ScanCompleteSummary
  onDismiss: () => void
}

export function ScanCompleteCard({ summary, onDismiss }: ScanCompleteCardProps) {
  const { photoCount, exact, near, lowQuality } = summary
  const found = exact + near + lowQuality

  return (
    <Card className="border-2 border-[#34c759]/30 bg-[#f0fdf4]">
      <div className="flex items-start gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#34c759] text-white"
          aria-hidden
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-semibold text-label">Analyse terminée</h2>
          <p className="mt-1 text-[14px] leading-snug text-label-secondary">
            {photoCount} photo{photoCount > 1 ? 's' : ''} analysée{photoCount > 1 ? 's' : ''}.
            {found > 0
              ? ` ${found} catégorie${found > 1 ? 's' : ''} avec des résultats.`
              : ' Aucun doublon ni photo inutile détecté.'}
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <ResultChip label="Exactes" value={exact} />
        <ResultChip label="Proches" value={near} />
        <ResultChip label="Inutiles" value={lowQuality} />
      </dl>

      <Button fullWidth className="mt-4" onClick={onDismiss}>
        Voir les résultats
      </Button>
    </Card>
  )
}

function ResultChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/80 px-2 py-2.5">
      <dd className="text-[20px] font-semibold text-label">{value}</dd>
      <dt className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-label-tertiary">
        {label}
      </dt>
    </div>
  )
}
