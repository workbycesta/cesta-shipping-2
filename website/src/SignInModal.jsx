import { useState } from 'react'
import { useUser } from './UserContext'
import './SignInModal.css'

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
    <div className="modal-overlay" onClick={closeSignInModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" type="button" onClick={closeSignInModal}>×</button>

        <h2>Sign In to WholeLot Traders</h2>
        <p className="modal-subtitle">Participate in live auction bidding across all marketplaces</p>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="sign-in-form">
          <div className="form-group">
            <label htmlFor="modal-email">Email Address</label>
            <input
              id="modal-email"
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="modal-password">Password</label>
            <input
              id="modal-password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-modal-submit" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="modal-signup-hint">
          New to WholeLot Traders? <a href="/signup">Create a buyer account</a>
        </p>
      </div>
    </div>
  )
}
