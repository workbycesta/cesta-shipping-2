import { Link } from 'react-router-dom'
import { useReveal } from './useReveal'

export default function CommunityCTA() {
  const ref = useReveal()
  return (
    <section className="lotz-section lotz-section--tint" ref={ref}>
      <div className="lotz-container lotz-center lotz-signup-cta">
        <p className="lotz-eyebrow lotz-reveal">Free buyer account</p>
        <h2 className="lotz-h2 lotz-reveal">Stop watching deals sell out. Start bidding on them.</h2>
        <p className="lotz-body lotz-reveal">
          Create your free Lotmart account to browse live Amazon and Flipkart lots, track every bid
          in one place, and pick up winning stock straight from the warehouse. New lots drop
          regularly — members see them first.
        </p>
        <Link to="/signup" className="lotz-btn lotz-btn--lg lotz-reveal">Give Me Access to Live Lots</Link>
        <span className="lotz-signup-note lotz-reveal">Free to join · Browse live lots as soon as your account is approved</span>
      </div>
    </section>
  )
}
