import { createContext, useContext, useState, useEffect } from 'react'

const AdminContext = createContext(null)

// Clamp helper: only valid hike values (0-100) are ever used
const sanitizeHike = (value) => {
  const num = Number(value)
  if (isNaN(num) || num < 0 || num > 100) return 0
  return num
}

export function AdminProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('admin_auth') === 'true'
  })
  // Price hike is stored ON THE SERVER (DB), not in localStorage,
  // so every device sees the same pricing config.
  const [priceHike, setPriceHike] = useState(0)
  // Range-wise hikes: [{ min, max, percent }] — percent applied when the
  // raw item price falls inside [min, max). Prices above the last band
  // fall back to the global `priceHike`.
  const [rangeHikes, setRangeHikes] = useState([])

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
        if (data && Array.isArray(data.rangeHikes) && data.rangeHikes.length) {
          setRangeHikes(data.rangeHikes)
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

  // Persist the new hike to the server so ALL devices get the same price
  const updatePriceHike = async (value) => {
    const num = sanitizeHike(value)
    setPriceHike(num) // optimistic update for immediate UI feedback
    try {
      const res = await fetch('/api/admin/price-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceHike: num })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        console.error('Failed to save price config:', data.message || res.statusText)
        return false
      }
      return true
    } catch (err) {
      console.error('Failed to save price config:', err)
      return false
    }
  }

  // Persist range-wise hikes; expects the full array [{ min, max, percent }]
  const updateRangeHikes = async (ranges) => {
    try {
      const res = await fetch('/api/admin/price-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rangeHikes: ranges })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        console.error('Failed to save range hikes:', data.message || res.statusText)
        return { ok: false, message: data.message || 'Failed to save range hikes' }
      }
      if (Array.isArray(data.rangeHikes)) setRangeHikes(data.rangeHikes)
      return { ok: true }
    } catch (err) {
      console.error('Failed to save range hikes:', err)
      return { ok: false, message: 'Failed to save range hikes' }
    }
  }

  const applyPriceHike = (price) => {
    const numPrice = Number(price)
    if (isNaN(numPrice) || numPrice <= 0) return price
    // Pick the band the RAW price falls into: min <= price < max.
    // Prices beyond the last band (e.g. > 100000) fall back to the global hike.
    let percent = priceHike
    const band = rangeHikes.find(
      (r) => numPrice >= Number(r.min) && numPrice < Number(r.max)
    )
    // Only a band with an explicitly configured percent (> 0) overrides the global hike;
    // default zero-percent bands must not cancel out the global priceHike.
    if (band && Number(band.percent) > 0) percent = Number(band.percent)
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
      rangeHikes,
      updateRangeHikes,
      applyPriceHike
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
