import { Link } from 'react-router-dom'
import { IconArrowRight, IconCheck } from './LandingIcons'

const POINTS = [
  'Liquidation, overstock, and customer-return lots from businesses',
  'Lots sold by the pallet up to full truckload quantities',
  'Itemized manifests and condition grades on every listing',
  'Open to registered buyers — resellers, wholesalers, and retail chains'
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
            Wholelot Traders is a business-to-business auction marketplace where
            registered buyers bid on excess inventory — overstock, customer returns,
            and closeout lots — sold by the pallet and truckload.
          </p>

          <div className="landing-hero__actions">
            <Link to="/marketplaces" className="landing-btn landing-btn--primary landing-btn--lg">
              <span>Browse Marketplaces</span>
              <IconArrowRight size={18} />
            </Link>
            <Link to="/products" className="landing-btn landing-btn--secondary landing-btn--lg">
              <span>Shop All Auctions</span>
              <IconArrowRight size={18} />
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
          <h3>What you can bid on</h3>
          <ul className="landing-hero__stock-list">
            {STOCK_TYPES.map((item) => (
              <li key={item.name}>
                <strong>{item.name}</strong>
                <span>{item.desc}</span>
              </li>
            ))}
          </ul>
          <p className="landing-hero__side-note">
            New lots are listed on an ongoing basis. Quantities, conditions,
            and locations vary per listing.
          </p>
          <Link to="/signup" className="landing-btn landing-btn--secondary landing-btn--block" style={{ marginTop: '16px' }}>
            Create a Buyer Account
          </Link>
        </aside>
      </div>
    </section>
  )
}
