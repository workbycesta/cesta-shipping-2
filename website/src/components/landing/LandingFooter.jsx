import { Link } from 'react-router-dom'
import { IconArrowRight, IconBox } from './LandingIcons'

export default function LandingFooter() {
  return (
    <>
      <section className="landing-cta">
        <div className="landing-container landing-cta__row">
          <div>
            <h2>Ready to start bidding?</h2>
            <p>
              Browse the marketplaces, or shop every live auction in one place.
              Registration is open to businesses.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link to="/marketplaces" className="landing-btn landing-btn--primary landing-btn--lg">
              <span>Browse Marketplaces</span>
              <IconArrowRight size={18} />
            </Link>
            <Link to="/products" className="landing-btn landing-btn--secondary landing-btn--lg">
              <span>Shop All Auctions</span>
              <IconArrowRight size={18} />
            </Link>
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
                A B2B auction marketplace for liquidation, overstock, customer returns,
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
                <li><Link to="/marketplaces">Browse Marketplaces</Link></li>
                <li><Link to="/products">Shop All Auctions</Link></li>
                <li><Link to="/signup">Create a Buyer Account</Link></li>
                <li><Link to="/my-account">My Account</Link></li>
              </ul>
            </div>

            <div className="landing-footer__col">
              <h4>Buying Guide</h4>
              <ul>
                <li><a href="#marketplaces">Marketplaces</a></li>
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
