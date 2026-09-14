import { Link } from 'react-router-dom'
import { IconArrowRight, IconCheck } from './LandingIcons'

const POINTS = [
  'Manufacturer overstock, retail surplus, and inspected customer returns',
  'Lots sold by the pallet up to full truckload quantities',
  'Itemized manifests and condition grades on every listing',
  'Open to registered businesses — resellers, wholesalers, and retail chains'
]

const STOCK_TYPES = [
  { name: 'Liquidation Lots', desc: 'Store closures, shelf pulls, and mixed merchandise' },
  { name: 'Customer Returns', desc: 'Graded A/B/C with stated functional condition' },
  { name: 'Overstock & Surplus', desc: 'Factory-sealed excess from brands and distributors' },
  { name: 'Bulk & Truckloads', desc: 'High-volume lots for established buyers' }
]

export default function HeroSection() {
  return (
    <section className="landing-hero" id="hero">
      <div className="landing-container landing-hero__container">
        <div>
          <h1 className="landing-hero__title">
            Wholesale liquidation lots, sold by the pallet.
          </h1>

          <p className="landing-hero__description">
            Wholelot Traders is a business-to-business marketplace where companies buy
            and sell excess inventory — overstock, customer returns, and closeout lots —
            through open competitive bidding.
          </p>

          <div className="landing-hero__actions">
            <Link to="/products" className="landing-btn landing-btn--primary landing-btn--lg">
              <span>Browse Live Auctions</span>
              <IconArrowRight size={18} />
            </Link>
            <Link to="/signup" className="landing-btn landing-btn--secondary landing-btn--lg">
              Create a Buyer Account
            </Link>
          </div>

          <ul className="landing-hero__points">
            {POINTS.map((point) => (
              <li key={point}>
                <IconCheck size={16} />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <aside className="landing-hero__side-card">
          <h3>What trades on the marketplace</h3>
          <ul className="landing-hero__stock-list">
            {STOCK_TYPES.map((item) => (
              <li key={item.name}>
                <strong>{item.name}</strong>
                <span>{item.desc}</span>
              </li>
            ))}
          </ul>
          <p className="landing-hero__side-note">
            New lots are listed by sellers on an ongoing basis. Quantities, conditions,
            and locations vary per listing.
          </p>
        </aside>
      </div>
    </section>
  )
}
