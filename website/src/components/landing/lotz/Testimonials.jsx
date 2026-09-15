import { TESTIMONIALS } from './lotzData'
import { useReveal } from './useReveal'

export default function Testimonials() {
  const ref = useReveal()
  return (
    <section className="lotz-section" ref={ref}>
      <div className="lotz-container lotz-center">
        <h2 className="lotz-h2 lotz-reveal">What our Customers say About Us</h2>
        <p className="lotz-body lotz-reveal">Check out what our satisfied customers have said about Lotmart and our products. Read their testimonials below:</p>
        <div className="lotz-t-grid">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="lotz-t lotz-reveal">
              <blockquote>&ldquo;{t.text}&rdquo;</blockquote>
              <figcaption>— {t.name}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
