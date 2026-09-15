import { BRANDS } from './lotzData'
import { useReveal } from './useReveal'

export default function BrandsStrip() {
  const ref = useReveal()
  return (
    <section className="lotz-section" ref={ref}>
      <div className="lotz-container lotz-center">
        <h2 className="lotz-h2 lotz-h2--sm lotz-reveal">From Puma to Flipkart, we offer a wide variety of lots from 4+ top companies.</h2>
        <div className="lotz-brands lotz-reveal">
          {BRANDS.map((b) => (
            <span key={b} className="lotz-brand" data-asset={`brand-${b.toLowerCase()}`}>{b}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
