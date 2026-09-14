import { Link } from 'react-router-dom'
import { IconArrowRight, IconCheck } from './LandingIcons'

const SELLER_STEPS = [
  { title: 'Submit your inventory list', desc: 'Send your stock list through the appraisal form. Include quantities, categories, and condition if known.' },
  { title: 'Agree the listing', desc: 'Lots are listed with your reserve price, manifest, warehouse location, and sale terms.' },
  { title: 'Buyers bid, you get paid', desc: 'Registered buyers compete openly. The winning amount is collected before dispatch.' }
]

const SELLER_NOTES = [
  { title: 'Your reserve, your terms', desc: 'Nothing sells below the minimum you set.' },
  { title: 'One manifest for all bidders', desc: 'Identical information for everyone keeps bidding fair and disputes down.' },
  { title: 'Any scale', desc: 'A few pallets of overstock or ongoing truckload volume.' }
]

const BUYER_STEPS = [
  { title: 'Find your category', desc: 'Browse live auctions by category, lot size, condition, and location.' },
  { title: 'Check the manifest', desc: 'Review every SKU, quantity, and the stated condition grade before bidding.' },
  { title: 'Bid and collect', desc: 'Win the lot, complete payment, and arrange pickup or coordinated dispatch.' }
]

const BUYER_NOTES = [
  { title: 'Manifest before money', desc: 'You see the full item list before placing a single bid.' },
  { title: 'Visible bid history', desc: 'Open auctions — you always know where you stand.' },
  { title: 'Buy at your scale', desc: 'Test a category with one pallet, scale to truckloads when it works.' }
]

function NotesList({ notes }) {
  return (
    <ul className="landing-check-list">
      {notes.map((item) => (
        <li key={item.title}>
          <IconCheck size={16} />
          <span><strong>{item.title}</strong>{item.desc}</span>
        </li>
      ))}
    </ul>
  )
}

function StepsList({ steps }) {
  return (
    <ol className="landing-hub__steps">
      {steps.map((step) => (
        <li key={step.title}>
          <span><strong>{step.title}</strong>{step.desc}</span>
        </li>
      ))}
    </ol>
  )
}

export default function SellerBuyerHubs({ onOpenSellerModal }) {
  return (
    <section className="landing-section" id="solutions">
      <div className="landing-container">
        <div className="landing-hub" id="sellers">
          <div className="landing-card">
            <span className="landing-card__tag">For sellers</span>
            <h3>Have excess stock sitting in a warehouse?</h3>
            <p>
              For retailers, manufacturers, brands, and distributors holding overstock,
              seasonal surplus, or customer returns.
            </p>
            <StepsList steps={SELLER_STEPS} />
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
            <span className="landing-card__tag">Selling notes</span>
            <h3>What to expect as a seller.</h3>
            <p>Straightforward terms, agreed before anything goes live.</p>
            <NotesList notes={SELLER_NOTES} />
          </div>
        </div>

        <div className="landing-hub" id="buyers">
          <div className="landing-card">
            <span className="landing-card__tag">For buyers</span>
            <h3>Need inventory with room to make margin?</h3>
            <p>
              For resellers, wholesalers, discount retailers, and export buyers
              sourcing by the pallet or truckload.
            </p>
            <StepsList steps={BUYER_STEPS} />
            <Link to="/products" className="landing-btn landing-btn--secondary landing-btn--block">
              <span>Browse Live Auctions</span>
              <IconArrowRight size={16} />
            </Link>
          </div>
          <div className="landing-card">
            <span className="landing-card__tag">Buying notes</span>
            <h3>What to expect as a buyer.</h3>
            <p>Registration is for businesses. Bidding is open and documented.</p>
            <NotesList notes={BUYER_NOTES} />
          </div>
        </div>
      </div>
    </section>
  )
}
