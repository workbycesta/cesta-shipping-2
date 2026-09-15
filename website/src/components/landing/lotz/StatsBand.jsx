import { useEffect, useRef, useState } from 'react'
import { STATS } from './lotzData'
import { formatIndian } from './useReveal'

function Counter({ stat }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVal(stat.value)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true
          const dur = 1200
          const t0 = performance.now()
          const tick = (t) => {
            const p = Math.min(1, (t - t0) / dur)
            setVal(Math.floor(stat.value * p))
            if (p < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
          io.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [stat.value])

  const num = stat.indian ? formatIndian(val) : val.toLocaleString('en-IN')
  return (
    <div ref={ref}>
      <strong>{stat.prefix || ''}{num}{stat.suffix || ''}</strong>
      <span>{stat.label}</span>
    </div>
  )
}

export default function StatsBand() {
  return (
    <section className="lotz-stats" aria-label="Company statistics">
      <div className="lotz-container lotz-stats__grid">
        {STATS.map((s) => (
          <Counter key={s.label} stat={s} />
        ))}
      </div>
    </section>
  )
}
