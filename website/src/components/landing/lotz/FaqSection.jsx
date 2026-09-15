import { useState } from 'react'
import { FAQS } from './lotzData'
import { useReveal } from './useReveal'

export default function FaqSection() {
  const [open, setOpen] = useState(0)
  const ref = useReveal()
  return (
    <section className="lotz-section lotz-section--tint" ref={ref}>
      <div className="lotz-container lotz-faq">
        <div>
          <p className="lotz-eyebrow lotz-reveal">Common Questions</p>
          <h2 className="lotz-h2 lotz-reveal">Most Popular Questions.</h2>
          <p className="lotz-body lotz-reveal">For your convenience, here are the most commonly asked questions and answers about Lotmart and our products.</p>
        </div>
        <div className="lotz-accordion">
          {FAQS.map((f, i) => {
            const isOpen = open === i
            return (
              <div key={f.q} className={`lotz-acc-item lotz-reveal${isOpen ? ' is-open' : ''}`}>
                <button
                  type="button"
                  className="lotz-acc-btn"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                >
                  <span>{f.q}</span>
                  <span className="lotz-acc-icon" aria-hidden="true">{isOpen ? '−' : '+'}</span>
                </button>
                <div className="lotz-acc-panel" hidden={!isOpen}>
                  <p>{f.a}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
