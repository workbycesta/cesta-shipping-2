import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUser } from '../../UserContext'
import { IconBox, IconClose } from './LandingIcons'

export default function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const { user, openSignInModal, logout } = useUser()
  const navigate = useNavigate()

  const scrollToSection = (e, id) => {
    e.preventDefault()
    setMobileMenuOpen(false)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const anchorLinks = [
    { label: 'How It Works', id: 'how-it-works' },
    { label: 'Condition Standards', id: 'conditions' },
    { label: 'About', id: 'about' }
  ]

  return (
    <>
      <header className="landing-header">
        <div className="landing-header__inner">
          <Link to="/" className="landing-logo" aria-label="Lotmart Home">
            <span className="landing-logo__emblem">
              <IconBox size={18} />
            </span>
            <span>LOT<span className="landing-logo__accent">MART</span></span>
            <span className="landing-logo__badge">B2B</span>
          </Link>

          <nav className="landing-nav" aria-label="Main Navigation">
            <Link to="/marketplaces" className="landing-nav__link">
              Browse Marketplaces
            </Link>
            <Link to="/products" className="landing-nav__link">
              Shop All Auctions
            </Link>
            {anchorLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => scrollToSection(e, link.id)}
                className="landing-nav__link"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="landing-header__actions">
            {user ? (
              <div className="landing-user-profile">
                <button
                  type="button"
                  className="landing-user-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-expanded={userDropdownOpen}
                >
                  <span className="landing-user-avatar">
                    {(user.name || user.email || 'U')[0].toUpperCase()}
                  </span>
                  <span>{user.name || user.email.split('@')[0]}</span>
                </button>

                {userDropdownOpen && (
                  <div className="landing-user-dropdown" onClick={() => setUserDropdownOpen(false)}>
                    <div className="landing-user-dropdown__header">
                      <strong>{user.name || 'Lotmart Account'}</strong>
                      <span>{user.email}</span>
                    </div>
                    <div className="landing-user-dropdown__divider" />
                    <Link to="/my-account" className="landing-user-dropdown__item">
                      Submitted Bids &amp; Lots
                    </Link>
                    <Link to="/marketplaces" className="landing-user-dropdown__item">
                      Member Marketplaces
                    </Link>
                    <div className="landing-user-dropdown__divider" />
                    <button
                      type="button"
                      className="landing-user-dropdown__item"
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
                  className="landing-signin-link"
                  onClick={openSignInModal}
                >
                  Sign In
                </button>
                <Link to="/signup" className="landing-btn landing-btn--secondary landing-btn--sm">
                  Register
                </Link>
              </>
            )}

            <button
              type="button"
              className="landing-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            >
              {mobileMenuOpen ? <IconClose size={20} /> : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className={`landing-mobile-drawer ${mobileMenuOpen ? 'landing-mobile-drawer--open' : ''}`}>
        <div className="landing-mobile-drawer__overlay" onClick={() => setMobileMenuOpen(false)} />
        <div className="landing-mobile-drawer__panel">
          <div className="landing-mobile-drawer__header">
            <span className="landing-logo">
              LOT<span className="landing-logo__accent">MART</span>
            </span>
            <button
              type="button"
              className="landing-mobile-drawer__close"
              onClick={() => setMobileMenuOpen(false)}
            >
              <IconClose size={20} />
            </button>
          </div>

          <nav className="landing-mobile-nav">
            <Link to="/marketplaces" className="landing-mobile-nav__link" onClick={() => setMobileMenuOpen(false)}>
              Browse Marketplaces
            </Link>
            <Link to="/products" className="landing-mobile-nav__link" onClick={() => setMobileMenuOpen(false)}>
              Shop All Auctions
            </Link>
            {anchorLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => scrollToSection(e, link.id)}
                className="landing-mobile-nav__link"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="landing-mobile-drawer__actions">
            {!user && (
              <>
                <button
                  type="button"
                  className="landing-btn landing-btn--secondary landing-btn--block"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    openSignInModal()
                  }}
                >
                  Sign In
                </button>
                <Link
                  to="/signup"
                  className="landing-btn landing-btn--primary landing-btn--block"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Create Buyer Account
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
