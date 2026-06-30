export function formatDuration(seconds: number): string {
  const s = Math.max(1, Math.round(seconds))
  if (s < 60) return `environ ${s} s`
  if (s < 3600) {
    const min = Math.max(1, Math.round(s / 60))
    return `environ ${min} min`
  }
  const hours = Math.floor(s / 3600)
  const mins = Math.round((s % 3600) / 60)
  if (mins === 0) return `environ ${hours} h`
  return `environ ${hours} h ${mins} min`
}
