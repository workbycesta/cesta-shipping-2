import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUser } from './UserContext'
import './SiteChrome.css'

export default function SiteHeader() {
  const { user, openSignInModal, logout } = useUser()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="site-logo site-logo--img" aria-label="Lotmart Home">
          <img src="/header-logo.png" alt="Lotmart" className="site-logo__img" />
          <span className="site-logo__badge">B2B</span>
        </Link>

        <nav className="site-nav" aria-label="Main Navigation">
          <Link to="/marketplaces" className="site-nav__link">
            Browse Marketplaces
          </Link>
          <Link to="/products" className="site-nav__link">
            Shop All Auctions
          </Link>
        </nav>

        <div className="site-header__actions">
          {user ? (
            <div className="site-user">
              <button
                type="button"
                className="site-user__btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
              >
                <span className="site-user__avatar">
                  {(user.name || user.email || 'U')[0].toUpperCase()}
                </span>
                <span className="site-user__name">
                  {user.name || user.email.split('@')[0]}
                </span>
              </button>

              {dropdownOpen && (
                <div className="site-user__dropdown" onClick={() => setDropdownOpen(false)}>
                  <div className="site-user__dropdown-head">
                    <strong>{user.name || 'Lotmart Account'}</strong>
                    <span>{user.email}</span>
                  </div>
                  <div className="site-user__divider" />
                  <Link to="/my-account" className="site-user__item">
                    Submitted Bids
                  </Link>
                  <Link to="/marketplaces" className="site-user__item">
                    Member Marketplaces
                  </Link>
                  <div className="site-user__divider" />
                  <button
                    type="button"
                    className="site-user__item site-user__item--danger"
                    onClick={() => {
                      logout()
                      navigate('/')
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                type="button"
                className="site-signin"
                onClick={openSignInModal}
              >
                Sign In
              </button>
              <Link to="/signup" className="wl-btn wl-btn-secondary wl-btn-sm">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wl-container site-footer__top">
        <div>
          <span className="site-logo site-logo--img">
            <img src="/header-logo.png" alt="Lotmart" className="site-logo__img site-logo__img--footer" />
          </span>
          <p className="site-footer__tagline">
            A B2B auction marketplace for liquidation, overstock, customer returns,
            and surplus inventory — traded by the pallet and truckload.
          </p>
          <div className="site-footer__contact">
            <p><strong>Phone:</strong> 1800-419-0431</p>
            <p><strong>Email:</strong> support@lotmart.com</p>
          </div>
        </div>

        <div className="site-footer__col">
          <h4>Marketplace</h4>
          <ul>
            <li><Link to="/marketplaces">Browse Marketplaces</Link></li>
            <li><Link to="/products">Shop All Auctions</Link></li>
            <li><Link to="/signup">Create a Buyer Account</Link></li>
            <li><Link to="/my-account">My Account</Link></li>
          </ul>
        </div>

        <div className="site-footer__col">
          <h4>Support</h4>
          <ul>
            <li><Link to="/">About</Link></li>
            <li><Link to="/products">How Bidding Works</Link></li>
            <li><Link to="/my-account">Track Your Bids</Link></li>
          </ul>
        </div>
      </div>

      <div className="wl-container site-footer__bottom">
        <span>© {new Date().getFullYear()} Lotmart. All rights reserved.</span>
      </div>
    </footer>
  )
}
