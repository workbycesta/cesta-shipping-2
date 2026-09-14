import { Link } from 'react-router-dom'
import { IconArrowRight, IconCheck } from './LandingIcons'

const SELLER_POINTS = [
  { title: 'List excess stock the way you hold it', desc: 'Pallets, master cartons, or full truckloads — listed with your reserve price and terms.' },
  { title: 'Set your own rules', desc: 'Minimum bids, buyer eligibility, regional restrictions, and sale conditions are yours to define.' },
  { title: 'One manifest, every bidder sees the same thing', desc: 'Upload an itemized list once. Every buyer bids against identical information.' },
  { title: 'Payment held until delivery', desc: 'Winning amounts are collected before dispatch, so you ship knowing the funds exist.' }
]

const BUYER_POINTS = [
  { title: 'See exactly what you are bidding on', desc: 'Every lot carries an itemized manifest and a stated condition grade — no mystery boxes.' },
  { title: 'Bid against other businesses, not brokers', desc: 'Open auctions with visible bid history. The highest qualifying bid wins.' },
  { title: 'Start small or buy at scale', desc: 'Single pallets for testing a category, truckloads when you know your numbers.' },
  { title: 'Arrange freight your way', desc: 'Collect with your own carrier or coordinate dispatch with the seller.' }
]

export default function ValueSplit({ onOpenSellerModal }) {
  return (
    <section className="landing-section" id="value-prop">
      <div className="landing-container">
        <div className="landing-section__header text-center">
          <span className="landing-eyebrow">How the marketplace works</span>
          <h2 className="landing-section__title">One platform, two sides of the trade.</h2>
          <p className="landing-section__subtitle">
            Sellers convert idle stock into cash. Buyers source inventory below wholesale.
            The platform handles listings, bidding, and settlement in between.
          </p>
        </div>

        <div className="landing-cards-2">
          <div className="landing-card">
            <span className="landing-card__tag">For sellers</span>
            <h3>Sell excess inventory without a broker chain.</h3>
            <p>
              For retailers, manufacturers, distributors, and brands holding overstock,
              returns, or closeout goods.
            </p>
            <ul className="landing-check-list">
              {SELLER_POINTS.map((item) => (
                <li key={item.title}>
                  <IconCheck size={16} />
                  <span><strong>{item.title}</strong>{item.desc}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="landing-btn landing-btn--primary landing-btn--block"
              onClick={onOpenSellerModal}
            >
              <span>Request a Lot Appraisal</span>
              <IconArrowRight size={16} />
            </button>
          </div>

          <div className="landing-card">
            <span className="landing-card__tag">For buyers</span>
            <h3>Source inventory with the paperwork to prove it.</h3>
            <p>
              For resellers, wholesalers, discount chains, and export buyers
              who need margin and certainty.
            </p>
            <ul className="landing-check-list">
              {BUYER_POINTS.map((item) => (
                <li key={item.title}>
                  <IconCheck size={16} />
                  <span><strong>{item.title}</strong>{item.desc}</span>
                </li>
              ))}
            </ul>
            <Link to="/products" className="landing-btn landing-btn--secondary landing-btn--block">
              <span>Browse Live Auctions</span>
              <IconArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
