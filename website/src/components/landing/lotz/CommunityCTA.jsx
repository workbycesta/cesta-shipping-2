import { FACEBOOK_PAGE, WHATSAPP_GROUP } from './lotzData'
import { useReveal } from './useReveal'

export default function CommunityCTA() {
  const ref = useReveal()
  return (
    <section className="lotz-section" ref={ref}>
      <div className="lotz-container lotz-split lotz-split--flip">
        <div className="lotz-img-placeholder lotz-img-placeholder--tall lotz-reveal" data-asset="community-team" role="img" aria-label="Customer community placeholder">
          <span>Community</span>
        </div>
        <div>
          <h2 className="lotz-h2 lotz-reveal">Join our Community of Customers to Get Regular Updates.</h2>
          <p className="lotz-body lotz-reveal">
            Lotmart values its customers and works hard to keep them up to date about our latest deals and inventory. Join our community of customers to receive regular updates on our latest stock, exclusive deals, and promotions.
          </p>
          <div className="lotz-btn-row lotz-reveal">
            <a className="lotz-btn" href={WHATSAPP_GROUP} target="_blank" rel="noreferrer">Whatsapp Group</a>
            <a className="lotz-btn" href={FACEBOOK_PAGE} target="_blank" rel="noreferrer">Facebook Page</a>
          </div>
        </div>
      </div>
    </section>
  )
}
