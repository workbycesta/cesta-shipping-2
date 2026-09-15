import { Link } from 'react-router-dom'
import { useReveal } from './useReveal'

export default function WhoWeAre() {
  const ref = useReveal()
  return (
    <section className="lotz-section" id="about" ref={ref}>
      <div className="lotz-container lotz-split">
        <div>
          <p className="lotz-eyebrow lotz-reveal">Who We Are</p>
          <h2 className="lotz-h2 lotz-reveal">Bulk deals on Amazon &amp; Flipkart surplus stock.</h2>
          <p className="lotz-body lotz-reveal">
            Lotmart helps resellers buy Amazon and Flipkart return lots and branded surplus stock in bulk at honest prices. With plenty of categories to choose from, we keep the process simple so you can restock and sell with confidence.
          </p>
          <Link to="/products" className="lotz-btn lotz-reveal">Learn More</Link>
        </div>
        <div className="lotz-who-img lotz-reveal">
          <img src="/who-we-are.jpg" alt="Warehouse shelves stocked with bulk inventory lots" loading="lazy" />
          <span className="lotz-who-img__badge">25+ Categories Available</span>
        </div>
      </div>
    </section>
  )
}
