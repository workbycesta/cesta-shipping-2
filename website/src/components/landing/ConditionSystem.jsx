const CONDITIONS = [
  {
    name: 'Brand New',
    desc: 'Factory-sealed merchandise in original packaging. Never sold to a consumer.'
  },
  {
    name: 'Open Box',
    desc: 'Returned or display-opened goods, tested and functional with all essential accessories.'
  },
  {
    name: 'Refurbished',
    desc: 'Restored to working condition by the manufacturer or a certified facility.'
  },
  {
    name: 'Grade A/B Returns',
    desc: 'Customer returns with light cosmetic signs. Mostly functional out of the box.'
  },
  {
    name: 'Grade C / Raw Returns',
    desc: 'Untested returns sold as-is. May include missing parts or defects. Priced accordingly.'
  },
  {
    name: 'Salvage',
    desc: 'Non-functional or damaged goods, sold for parts recovery or materials.'
  }
]

export default function ConditionSystem() {
  return (
    <section className="landing-section" id="conditions">
      <div className="landing-container">
        <div className="landing-section__header">
          <span className="landing-eyebrow">Condition standards</span>
          <h2 className="landing-section__title">Every lot states its condition up front.</h2>
          <p className="landing-section__subtitle">
            Listings use a standard six-grade scale, and the grade appears on the manifest —
            so you know whether you are buying sealed stock or raw returns before you bid.
          </p>
        </div>

        <div className="landing-grades">
          {CONDITIONS.map((cond) => (
            <div key={cond.name} className="landing-grade">
              <h3>{cond.name}</h3>
              <p>{cond.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
