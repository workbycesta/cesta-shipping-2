const FLOW_STEPS = [
  {
    step: '01',
    title: 'Register your business',
    description: 'Create a buyer account with your business details to start bidding.'
  },
  {
    step: '02',
    title: 'Browse live lots',
    description: 'Filter auctions by category, lot size, condition grade, and warehouse location.'
  },
  {
    step: '03',
    title: 'Read the manifest',
    description: 'Every listing includes an itemized manifest and a stated condition grade. Review it before you bid.'
  },
  {
    step: '04',
    title: 'Place your bid',
    description: 'Bid competitively on open lots. When the timer ends, the highest qualifying bid wins the lot.'
  },
  {
    step: '05',
    title: 'Complete payment',
    description: 'Pay for the allotted lot through the platform. Funds are confirmed before dispatch is arranged.'
  },
  {
    step: '06',
    title: 'Arrange freight',
    description: 'Collect with your own carrier or coordinate dispatch with the seller from the listed warehouse.'
  },
  {
    step: '07',
    title: 'Receive and restock',
    description: 'Check the delivery against the manifest at your facility and put the stock into circulation.'
  }
]

export default function AuctionFlow() {
  return (
    <section className="landing-section landing-section--alt" id="how-it-works">
      <div className="landing-container">
        <div className="landing-section__header">
          <span className="landing-eyebrow">The process</span>
          <h2 className="landing-section__title">From registration to restock.</h2>
          <p className="landing-section__subtitle">
            Seven steps. Here is how a lot moves from a live listing
            to your warehouse shelf.
          </p>
        </div>

        <div className="landing-steps">
          {FLOW_STEPS.map((step) => (
            <div key={step.step} className="landing-step">
              <span className="landing-step__num">{step.step}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
