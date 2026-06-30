interface ScanProgressProps {
  processed: number
  total: number
  label: string
}

export function ScanProgress({ processed, total, label }: ScanProgressProps) {
  const percent = total > 0 ? Math.round((processed / total) * 100) : 0

  return (
    <div className="rounded-2xl bg-fill-secondary px-4 py-3">
      <div className="mb-2 flex items-center justify-between text-[13px] font-medium text-label-secondary">
        <span>{label || 'Analyse en cours'}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-fill">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
