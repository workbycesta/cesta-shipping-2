const TIMELINE = [
  {
    tag: 'The problem',
    title: 'Good stock written off',
    desc: 'Retailers and manufacturers regularly end up with overstock, surplus, and customer returns that cost money to store and effort to move.'
  },
  {
    tag: 'The old route',
    title: 'Sold down a broker chain',
    desc: 'Traditionally this stock moved through intermediaries — each taking a margin, with buyers seeing less and less of what they were actually getting.'
  },
  {
    tag: 'This marketplace',
    title: 'Listed once, bid openly',
    desc: 'Wholelot Traders lists each lot with its manifest and condition grade, and lets registered businesses bid against each other in the open.'
  },
  {
    tag: 'The outcome',
    title: 'Stock keeps moving',
    desc: 'Buyers get documented stock at wholesale economics, and goods stay in circulation instead of going to waste.'
  }
]

export default function CompanyStory() {
  return (
    <section className="landing-section landing-section--alt" id="about">
      <div className="landing-container">
        <div className="landing-section__header">
          <span className="landing-eyebrow">About the business</span>
          <h2 className="landing-section__title">What Wholelot Traders is.</h2>
          <p className="landing-section__subtitle">
            A business-to-business marketplace for excess inventory — overstock,
            customer returns, closeouts, and surplus goods — traded in pallet
            and truckload quantities through open auctions.
          </p>
        </div>

        <div className="landing-timeline">
          {TIMELINE.map((item) => (
            <div key={item.tag} className="landing-timeline__item">
              <span>{item.tag}</span>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="landing-mission">
          <div className="landing-mission__card">
            <span>How we operate</span>
            <h3>Buyers bid. Terms are public.</h3>
            <p>
              Every lot carries a manifest, a condition grade, a warehouse location,
              and the seller&apos;s terms. Bidding history is visible. The highest
              qualifying bid wins.
            </p>
          </div>
          <div className="landing-mission__card">
            <span>Who it is for</span>
            <h3>Businesses buying by the pallet.</h3>
            <p>
              Resellers, wholesalers, retail chains, and exporters buying
              liquidation and surplus stock at wholesale scale.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
