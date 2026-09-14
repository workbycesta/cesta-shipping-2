import { IconCheck, IconClose } from './LandingIcons'

const OLD_WAY = [
  'Goods pass through several intermediaries, each adding a margin',
  'Lots sold with partial or missing manifests',
  'Pricing set by negotiation behind closed doors',
  'Payment and delivery terms vary deal to deal'
]

const MARKETPLACE_WAY = [
  'Direct listings with open bidding — one marketplace in between',
  'Itemized manifests and condition grades published on every lot',
  'Open auctions with visible bid history',
  'Standard process: bid, pay, collect'
]

export default function DirectModelComparison() {
  return (
    <section className="landing-section landing-section--alt" id="no-middleman">
      <div className="landing-container">
        <div className="landing-section__header text-center">
          <span className="landing-eyebrow">Why a marketplace</span>
          <h2 className="landing-section__title">The old way vs. open bidding.</h2>
          <p className="landing-section__subtitle">
            Excess inventory has traditionally changed hands through broker chains.
            This platform replaces that with direct listings and public auctions.
          </p>
        </div>

        <div className="landing-compare">
          <div className="landing-compare__card">
            <span className="landing-compare__label">Broker-led deals</span>
            <h3>Passed hand to hand</h3>
            <p>Each intermediary takes a cut and controls what the next party sees.</p>
            <ul className="landing-plain-list">
              {OLD_WAY.map((item) => (
                <li key={item}>
                  <IconClose size={17} className="landing-mark-bad" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="landing-compare__card landing-compare__card--highlight">
            <span className="landing-compare__label">Wholelot Traders</span>
            <h3>Listed once, bid openly</h3>
            <p>One listing, one manifest, every registered buyer sees the same terms.</p>
            <ul className="landing-plain-list">
              {MARKETPLACE_WAY.map((item) => (
                <li key={item}>
                  <IconCheck size={17} className="landing-mark-good" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
