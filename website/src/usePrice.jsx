import { useAdmin } from './AdminContext'

export function usePrice() {
  const { applyPriceHike, timerEarlyHours } = useAdmin()

  const formatMoney = (value) => {
    if (value === null || value === undefined) return '-'
    const num = Number(value)
    if (isNaN(num)) return '-'
    const inflated = applyPriceHike(num)
    return `₹ ${inflated.toLocaleString('en-IN')}`
  }

  const formatRawMoney = (value) => {
    if (value === null || value === undefined) return '-'
    const num = Number(value)
    if (isNaN(num)) return '-'
    return `₹ ${num.toLocaleString('en-IN')}`
  }

  return { formatMoney, formatRawMoney, applyPriceHike, timerOffsetSeconds: Number(timerEarlyHours ?? 1) * 3600 }
}
