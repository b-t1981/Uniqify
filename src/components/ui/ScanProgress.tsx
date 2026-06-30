interface ScanProgressProps {
  processed: number
  total: number
  label: string
  status?: 'running' | 'finalizing'
}

export function ScanProgress({
  processed,
  total,
  label,
  status = 'running',
}: ScanProgressProps) {
  const percent = total > 0 ? Math.round((processed / total) * 100) : 0
  const showFraction = total > 0 && percent === 0 && processed > 0
  const isFinalizing = status === 'finalizing'
  const displayPercent = isFinalizing ? 100 : percent
  const displayLabel = isFinalizing ? 'Finalisation…' : label || 'Analyse en cours'
  const barColor = isFinalizing ? 'bg-[#34c759]' : 'bg-accent'

  return (
    <div
      className={[
        'rounded-2xl px-4 py-3',
        isFinalizing ? 'bg-[#f0fdf4]' : 'bg-fill-secondary',
      ].join(' ')}
      role="progressbar"
      aria-valuenow={displayPercent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={isFinalizing ? 'Finalisation de l’analyse' : 'Progression de l’analyse'}
    >
      <div className="mb-2 flex items-center justify-between gap-2 text-[13px] font-medium text-label-secondary">
        <span className="min-w-0 truncate">{displayLabel}</span>
        <span className="shrink-0">
          {isFinalizing ? '✓' : showFraction ? `${processed}/${total}` : `${displayPercent}%`}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-fill">
        <div
          className={['h-full rounded-full transition-all duration-300 ease-out', barColor].join(' ')}
          style={{ width: `${Math.max(displayPercent, processed > 0 || isFinalizing ? 2 : 0)}%` }}
        />
      </div>
    </div>
  )
}
