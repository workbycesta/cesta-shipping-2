import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUser } from '../../UserContext'
import { CONTACT } from './lotz/lotzData'
import LotzTopBar from './lotz/LotzTopBar'
import { IconClose } from './LandingIcons'

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

  const navLinks = [
    { label: 'Home', id: 'top' },
    { label: 'Categories', id: 'categories' },
    { label: 'Contact Us', id: 'contact' },
    { label: 'About Us', id: 'about' }
  ]

  return (
    <>
      <LotzTopBar />
      <header className="landing-header">
        <div className="landing-header__inner">
          <Link to="/" className="landing-logo landing-logo--img" aria-label="Lotmart Home">
            <img src="/header-logo.png" alt="Lotmart" className="landing-logo__img" />
          </Link>

          <nav className="landing-nav" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => scrollToSection(e, link.id)}
                className="landing-nav__link"
              >
                {link.label}
              </a>
            ))}
            <Link to="/marketplaces" className="landing-nav__link">
              Auctions
            </Link>
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
            <a href={CONTACT.phoneHref} className="lotz-btn lotz-btn--sm landing-header__call">
              Call Now
            </a>

            <button
              type="button"
              className="landing-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
              aria-expanded={mobileMenuOpen}
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
            <span className="landing-logo landing-logo--img">
              <img src="/header-logo.png" alt="Lotmart" className="landing-logo__img" />
            </span>
            <button
              type="button"
              className="landing-mobile-drawer__close"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close Menu"
            >
              <IconClose size={20} />
            </button>
          </div>

          <nav className="landing-mobile-nav">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => scrollToSection(e, link.id)}
                className="landing-mobile-nav__link"
              >
                {link.label}
              </a>
            ))}
            <Link to="/marketplaces" className="landing-mobile-nav__link" onClick={() => setMobileMenuOpen(false)}>
              Auctions
            </Link>
          </nav>

          <div className="landing-mobile-drawer__actions">
            <a
              href={CONTACT.phoneHref}
              className="landing-btn landing-btn--primary landing-btn--block"
              onClick={() => setMobileMenuOpen(false)}
            >
              Call Now
            </a>
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
