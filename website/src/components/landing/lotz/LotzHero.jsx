import { Link } from 'react-router-dom'
import { useReveal } from './useReveal'

export default function LotzHero() {
  const ref = useReveal()
  return (
    <section className="lotz-hero" id="top" ref={ref}>
      <div className="lotz-hero__bg" data-asset="hero-warehouse" role="img" aria-label="Warehouse aisle with liquidation inventory" />
      <div className="lotz-hero__overlay" aria-hidden="true" />
      <div className="lotz-container lotz-hero__content">
        <p className="lotz-eyebrow lotz-eyebrow--light lotz-reveal">Lotmart - Leading Liquidation Company</p>
        <h1 className="lotz-hero__title lotz-reveal">
          Maximize your<br />Profits with us.
        </h1>
        <p className="lotz-hero__sub lotz-reveal">
          Buy Amazon and Flipkart return inventory lots and branded stock deals in bulk at unbeatable prices and increase your profit margins with ease.
        </p>
        <Link to="/products" className="lotz-btn lotz-reveal">Explore All Categories</Link>
      </div>
    </section>
  )
}
