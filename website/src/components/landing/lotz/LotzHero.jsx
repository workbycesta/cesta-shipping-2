import { Link } from 'react-router-dom'
import { useReveal } from './useReveal'

export default function LotzHero() {
  const ref = useReveal()
  return (
    <section className="lotz-hero" id="top" ref={ref}>
      <div className="lotz-container lotz-hero__content">
        <p className="lotz-eyebrow lotz-reveal">Lotmart — Leading Liquidation Company</p>
        <h1 className="lotz-hero__title lotz-reveal">
          Maximize your<br /><span className="lotz-hero__accent">Profits with us.</span>
        </h1>
        <p className="lotz-hero__sub lotz-reveal">
          Buy Amazon and Flipkart return inventory lots and branded stock deals in bulk at unbeatable prices and increase your profit margins with ease.
        </p>
        <div className="lotz-hero__actions lotz-reveal">
          <Link to="/products" className="lotz-btn lotz-btn--lg">Explore All Categories</Link>
        </div>
      </div>
    </section>
  )
}
