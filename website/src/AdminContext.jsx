import { createContext, useContext, useState, useEffect } from 'react'

const AdminContext = createContext(null)

// Clamp helper: only valid hike values (0-100) are ever used
const sanitizeHike = (value) => {
  const num = Number(value)
  if (isNaN(num) || num < 0 || num > 100) return 0
  return num
}

// Clamp helper: timer earliness in hours, 0 or more. Defaults to 1 (current behaviour).
const sanitizeTimerEarlyHours = (value) => {
  const num = Number(value)
  if (isNaN(num) || num < 0) return 1
  return num
}

export function AdminProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('admin_auth') === 'true'
  })
  // Price hike is stored ON THE SERVER (DB), not in localStorage,
  // so every device sees the same pricing config.
  const [priceHike, setPriceHike] = useState(0)
  // Custom admin-defined ranges: [{ min, max, percent }], inclusive on both
  // ends, never overlapping. A matching range ALWAYS wins (even at 0%);
  // prices outside all ranges use the global `priceHike`.
  const [rangeHikes, setRangeHikes] = useState([])
  // Timer earliness (hours): product countdowns display
  // (raw remaining time − this). Default 1 = current one-hour-early behaviour.
  const [timerEarlyHours, setTimerEarlyHours] = useState(1)

  // Load the global pricing config from the server on startup
  useEffect(() => {
    let cancelled = false
    const loadPriceConfig = async () => {
      try {
        const res = await fetch('/api/price-config')
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        if (data && typeof data.priceHike === 'number') {
          setPriceHike(sanitizeHike(data.priceHike))
        }
        if (data && Array.isArray(data.rangeHikes)) {
          setRangeHikes(data.rangeHikes)
        }
        if (data && typeof data.timerEarlyHours === 'number') {
          setTimerEarlyHours(sanitizeTimerEarlyHours(data.timerEarlyHours))
        }
      } catch (err) {
        console.warn('Could not load price config from server:', err)
      }
    }
    loadPriceConfig()
    return () => { cancelled = true }
  }, [])

  const login = (username, password) => {
    if (username === 'gopi' && password === 'gopi12') {
      setIsAuthenticated(true)
      sessionStorage.setItem('admin_auth', 'true')
      return true
    }
    return false
  }

  const logout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('admin_auth')
  }

  // Set the local default hike value in the editor (NOT saved — admin presses Save)
  const updatePriceHike = (value) => {
    setPriceHike(sanitizeHike(value))
  }

  // Save BOTH the default hike and the range hikes in one request.
  // Nothing is reflected on the website until this is called.
  const savePriceConfig = async ({ priceHike: ph, rangeHikes: rh, timerEarlyHours: teh }) => {
    const body = {}
    if (ph !== undefined) body.priceHike = sanitizeHike(ph)
    if (rh !== undefined) body.rangeHikes = rh
    if (teh !== undefined) body.timerEarlyHours = sanitizeTimerEarlyHours(teh)
    try {
      const res = await fetch('/api/admin/price-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        console.error('Failed to save price config:', data.message || res.statusText)
        return { ok: false, message: data.message || 'Failed to save price config' }
      }
      if (typeof data.priceHike === 'number') setPriceHike(sanitizeHike(data.priceHike))
      if (Array.isArray(data.rangeHikes)) setRangeHikes(data.rangeHikes)
      if (typeof data.timerEarlyHours === 'number') setTimerEarlyHours(sanitizeTimerEarlyHours(data.timerEarlyHours))
      return { ok: true }
    } catch (err) {
      console.error('Failed to save price config:', err)
      return { ok: false, message: 'Failed to save price config' }
    }
  }

  // Legacy single-field save (kept for compatibility); prefers savePriceConfig
  const updateRangeHikes = async (ranges) => savePriceConfig({ rangeHikes: ranges })

  const applyPriceHike = (price) => {
    const numPrice = Number(price)
    if (isNaN(numPrice) || numPrice <= 0) return price
    // Pick the custom range the RAW price falls into (inclusive both ends).
    // A matching range ALWAYS wins (even at 0%); prices outside all ranges
    // use the global hike.
    let percent = priceHike
    const band = rangeHikes.find(
      (r) => numPrice >= Number(r.min) && numPrice <= Number(r.max)
    )
    if (band) percent = Number(band.percent)
    // Step 1: add the hike on top of the raw API price (rounding only AFTER this step, never before)
    const hiked = percent > 0 ? numPrice * (1 + percent / 100) : numPrice
    // Step 2: round UP to the next ₹1000 multiple for display pricing
    // e.g. 1200 -> 2000, 5600 -> 6000, exact multiples stay as-is (2000 -> 2000)
    return Math.ceil(hiked / 1000) * 1000
  }

  return (
    <AdminContext.Provider value={{
      isAuthenticated,
      login,
      logout,
      priceHike,
      updatePriceHike,
      savePriceConfig,
      rangeHikes,
      updateRangeHikes,
      applyPriceHike,
      timerEarlyHours
    }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider')
  }
  return context
}
