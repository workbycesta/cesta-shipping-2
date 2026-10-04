import { useEffect, useRef } from 'react'

export function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const revealChildren = () => {
      el.querySelectorAll('.lotz-reveal').forEach((node) => {
        node.classList.add('is-visible')
      })
    }
    if (typeof IntersectionObserver === 'undefined') {
      revealChildren()
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            revealChildren()
            io.disconnect()
          }
        })
      },
      { threshold: 0.01, rootMargin: '0px 0px 20% 0px' }
    )
    io.observe(el)
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
