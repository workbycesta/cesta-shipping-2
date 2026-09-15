import { Link } from 'react-router-dom'
import { CONTACT, SOCIALS } from './lotz/lotzData'

export default function LandingFooter() {
  return (
    <>
      <footer className="lotz-footer">
        <div className="lotz-container">
          <div className="lotz-footer__top">
            <div>
              <span className="landing-logo landing-logo--img">
                <img src="/header-logo.png" alt="Lotmart" className="landing-logo__img landing-logo__img--footer" />
              </span>
              <p className="lotz-footer__tagline">
                Lotmart — a B2B auction marketplace for liquidation, overstock, customer returns,
                and surplus inventory, traded by the pallet and truckload.
              </p>
              <div className="lotz-footer__contact">
                <p><strong>Address:</strong> {CONTACT.address}</p>
                <p><strong>Phone:</strong> <a href={CONTACT.phoneHref}>{CONTACT.phoneDisplay}</a></p>
                <p><strong>Email:</strong> <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></p>
              </div>
            </div>

            <nav className="lotz-footer__col" aria-label="Policies">
              <h4>Policies</h4>
              <ul>
                <li><Link to="#">Privacy Policy</Link></li>
                <li><Link to="#">Shipping Policy</Link></li>
                <li><Link to="#">Terms and Condition</Link></li>
                <li><Link to="#">Refund and Cancelation Policy</Link></li>
              </ul>
            </nav>

            <nav className="lotz-footer__col" aria-label="Marketplace">
              <h4>Marketplace</h4>
              <ul>
                <li><Link to="/marketplaces">Browse Marketplaces</Link></li>
                <li><Link to="/products">Shop All Auctions</Link></li>
                <li><Link to="/signup">Create a Buyer Account</Link></li>
                <li><Link to="/my-account">My Account</Link></li>
              </ul>
            </nav>
          </div>

          <div className="lotz-footer__social">
            {SOCIALS.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label}>
                {s.label}
              </a>
            ))}
          </div>

          <div className="lotz-footer__bottom">
            <span>Copyright © 2023 Lotmart, All rights reserved. Powered by DAMN GROW.</span>
          </div>
        </div>
      </footer>
    </>
  )
}
