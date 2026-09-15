import { IconBox, IconShieldCheck, IconDollarSign, IconSearch, IconTruck, IconUsers } from '../LandingIcons'
import { WHY_ITEMS } from './lotzData'
import { useReveal } from './useReveal'

const ICONS = [IconBox, IconShieldCheck, IconDollarSign, IconSearch, IconTruck, IconUsers]

export default function WhyChooseUs() {
  const ref = useReveal()
  return (
    <section className="lotz-section lotz-section--dark" ref={ref}>
      <div className="lotz-container lotz-center">
        <p className="lotz-eyebrow lotz-eyebrow--light lotz-reveal">Why Choose Us</p>
        <h2 className="lotz-h2 lotz-h2--light lotz-reveal">Real Value. Real Savings. Real Solutions.</h2>
        <p className="lotz-body lotz-body--light lotz-reveal">
          If you&rsquo;re looking for a reliable and trustworthy liquidation company in India, Lotmart should be your top choice.
        </p>
        <div className="lotz-why-grid">
          {WHY_ITEMS.map((item, i) => {
            const Icon = ICONS[i % ICONS.length]
            return (
              <div key={item.title} className="lotz-why lotz-reveal">
                <span className="lotz-why__icon" aria-hidden="true"><Icon size={26} /></span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
