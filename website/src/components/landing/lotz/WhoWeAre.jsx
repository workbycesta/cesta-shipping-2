import { Link } from 'react-router-dom'
import { useReveal } from './useReveal'

export default function WhoWeAre() {
  const ref = useReveal()
  return (
    <section className="lotz-section" id="about" ref={ref}>
      <div className="lotz-container lotz-split">
        <div>
          <p className="lotz-eyebrow lotz-reveal">Who We Are</p>
          <h2 className="lotz-h2 lotz-reveal">We Are The Leading Liquidation Company In India.</h2>
          <p className="lotz-body lotz-reveal">
            Lotmart, leading liquidation company in India that specializes in selling bulk Amazon and Flipkart lots at unbeatable prices. With a wide range of categories available and a commitment to customer satisfaction.
          </p>
          <Link to="/products" className="lotz-btn lotz-reveal">Learn More</Link>
        </div>
        <div className="lotz-img-placeholder lotz-img-placeholder--wide lotz-reveal" data-asset="who-we-are-warehouse" role="img" aria-label="Warehouse inventory placeholder">
          <span>25+ Categories Available</span>
        </div>
      </div>
    </section>
  )
}
