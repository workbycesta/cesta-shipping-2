export const inr = (n) => {
  const num = Number(n)
  if (!Number.isFinite(num)) return '—'
  return '₹' + num.toLocaleString('en-IN')
}

export const fmtDateTime = (v) => {
  if (!v) return '—'
  const d = new Date(v)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function formatCountdown(totalSeconds) {
  if (totalSeconds === null || totalSeconds === undefined) return '—'
  if (totalSeconds <= 0) return '00:00:00'
  const s = Math.floor(totalSeconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}
