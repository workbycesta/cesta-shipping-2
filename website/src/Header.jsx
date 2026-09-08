import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUser } from './UserContext'
import './Header.css'

export default function Header() {
  const { user, openSignInModal, logout } = useUser()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <header className="topbar">
      <button className="icon-menu" type="button" aria-label="Open menu">
        ☰
      </button>

      <Link to="/" className="brand-logo" role="img" aria-label="wholelot traders" style={{ textDecoration: 'none' }}>
        <span className="brand-text">wholelot</span>
        <span className="brand-text-second">traders</span>
      </Link>

      <div className="topbar-actions">
        {user ? (
          <div className="user-profile-menu">
            <button
              type="button"
              className="action-btn user-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              👤 {user.name || user.email.split('@')[0]} ▼
            </button>

            {dropdownOpen && (
              <div className="user-dropdown-menu" onClick={() => setDropdownOpen(false)}>
                <div className="dropdown-user-info">
                  <strong>{user.name}</strong>
                  <span className="dropdown-email">{user.email}</span>
                </div>
                <div className="dropdown-divider"></div>
                <Link to="/my-account" className="dropdown-item">
                  📋 Submitted Bids
                </Link>
                <div className="dropdown-divider"></div>
                <button
                  type="button"
                  className="dropdown-item logout-item"
                  onClick={() => {
                    logout()
                    navigate('/')
                  }}
                >
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link to="/signup" className="action-btn sign-in">SIGN UP</Link>
            <button type="button" className="action-btn sign-in" onClick={openSignInModal}>
              SIGN IN
            </button>
          </>
        )}

        <button type="button" className="action-btn language-btn">SELECT LANGUAGE ▼</button>
      </div>
    </header>
  )
}
