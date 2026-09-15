import { useEffect, useRef } from 'react'

export function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-visible')
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15 }
    )
    el.querySelectorAll('.lotz-reveal').forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])
  return ref
}

export function formatIndian(n) {
  const s = String(Math.floor(n))
  if (s.length <= 3) return s
  const last3 = s.slice(-3)
  let rest = s.slice(0, -3)
  rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')
  return `${rest},${last3}`
}
