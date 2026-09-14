import { Link } from 'react-router-dom'
import { IconArrowRight, IconBox } from './LandingIcons'

export default function LandingFooter({ onOpenSellerModal }) {
  return (
    <>
      <section className="landing-cta">
        <div className="landing-container landing-cta__row">
          <div>
            <h2>Have inventory to move, or stock to source?</h2>
            <p>
              Browse the live auctions, or send your stock list for a lot appraisal.
              Registration is open to businesses.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link to="/products" className="landing-btn landing-btn--primary landing-btn--lg">
              <span>Browse Live Auctions</span>
              <IconArrowRight size={18} />
            </Link>
            <button
              type="button"
              className="landing-btn landing-btn--secondary landing-btn--lg"
              onClick={onOpenSellerModal}
            >
              Request a Lot Appraisal
            </button>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer__top">
            <div>
              <span className="landing-logo">
                <span className="landing-logo__emblem">
                  <IconBox size={18} />
                </span>
                <span>WHOLELOT<span className="landing-logo__accent">TRADERS</span></span>
              </span>
              <p className="landing-footer__tagline">
                A B2B marketplace for liquidation, overstock, customer returns,
                and surplus inventory — traded by the pallet and truckload.
              </p>
              <div className="landing-footer__contact">
                <p><strong>Phone:</strong> 1800-419-0431</p>
                <p><strong>Email:</strong> support@wholelottraders.com</p>
              </div>
            </div>

            <div className="landing-footer__col">
              <h4>Marketplace</h4>
              <ul>
                <li><Link to="/products">All Live Auctions</Link></li>
                <li><Link to="/marketplaces">Member Marketplaces</Link></li>
                <li><Link to="/signup">Create a Buyer Account</Link></li>
                <li><Link to="/my-account">My Account</Link></li>
              </ul>
            </div>

            <div className="landing-footer__col">
              <h4>Business</h4>
              <ul>
                <li><button type="button" className="footer-link-btn" onClick={onOpenSellerModal}>Request a Lot Appraisal</button></li>
                <li><a href="#how-it-works">How It Works</a></li>
                <li><a href="#conditions">Condition Standards</a></li>
                <li><a href="#about">About</a></li>
              </ul>
            </div>
          </div>

          <div className="landing-footer__bottom">
            <span>© {new Date().getFullYear()} Wholelot Traders. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </>
  )
}
