import { CONTACT_CTA_URL } from './lotzData'
import { useReveal } from './useReveal'

export default function FinalCTA() {
  const ref = useReveal()
  return (
    <section className="lotz-final" id="contact" ref={ref}>
      <div className="lotz-container lotz-center">
        <p className="lotz-eyebrow lotz-eyebrow--light lotz-reveal">Need Help?</p>
        <h2 className="lotz-h2 lotz-h2--light lotz-reveal">Don&rsquo;t hesitate to contact us for more information about company or products.</h2>
        <a className="lotz-btn lotz-btn--white lotz-reveal" href={CONTACT_CTA_URL} target="_blank" rel="noreferrer">Contact Us</a>
      </div>
    </section>
  )
}
