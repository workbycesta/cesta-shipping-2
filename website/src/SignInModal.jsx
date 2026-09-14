import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from './UserContext'
import './theme.css'
import './Auth.css'

export default function SignInModal() {
  const { isSignInModalOpen, closeSignInModal, login } = useUser()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isSignInModalOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await login(email, password)
    setLoading(false)
    if (!res.success) {
      setError(res.error)
    }
  }

  return (
    <div className="signin-overlay" onClick={closeSignInModal}>
      <div className="signin-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Sign in">
        <button className="signin-modal__close" type="button" onClick={closeSignInModal} aria-label="Close">×</button>

        <h2>Sign in to bid</h2>
        <p className="signin-modal__sub">Access live auctions across all marketplaces.</p>

        {error && <div className="wl-notice wl-notice-error">{error}</div>}

        <form onSubmit={handleSubmit} className="signin-form">
          <div className="wl-field">
            <label htmlFor="modal-email">Email address</label>
            <input
              id="modal-email"
              className="wl-input"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="wl-field">
            <label htmlFor="modal-password">Password</label>
            <input
              id="modal-password"
              className="wl-input"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="wl-btn wl-btn-primary wl-btn-block" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="signin-switch">
          New here? <Link to="/signup" onClick={closeSignInModal}>Create a buyer account</Link>
        </p>
      </div>
    </div>
  )
}
