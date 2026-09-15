import { IconBox, IconLayers, IconPackageCheck } from '../LandingIcons'
import { OFFERINGS } from './lotzData'
import { useReveal } from './useReveal'

const ICONS = [IconBox, IconLayers, IconPackageCheck]

export default function OfferingCards() {
  const ref = useReveal()
  return (
    <section className="lotz-offerings" ref={ref}>
      <div className="lotz-container lotz-offerings__grid">
        {OFFERINGS.map((o, i) => {
          const Icon = ICONS[i % ICONS.length]
          return (
            <article key={o.title} className={`lotz-offer lotz-reveal${o.highlight ? ' lotz-offer--highlight' : ''}`}>
              <span className="lotz-offer__icon" aria-hidden="true"><Icon size={30} /></span>
              <div>
                <h2>{o.title}</h2>
                <p>{o.text}</p>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
