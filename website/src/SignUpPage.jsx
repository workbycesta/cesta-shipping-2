import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SiteHeader, { SiteFooter } from './SiteChrome'
import './theme.css'
import './Auth.css'

const initialForm = {
  name: '',
  email: '',
  mobile: '',
  password: '',
  organisationName: '',
  termsAccepted: false
}

export default function SignUpPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [done, setDone] = useState(false)

  const update = (field) => (e) => {
    const value = field === 'termsAccepted' ? e.target.checked : e.target.value
    if (field === 'mobile') {
      const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
      setForm((f) => ({ ...f, mobile: digits }))
      return
    }
    setForm((f) => ({ ...f, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return setError('Name is required')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError('Please enter a valid email')
    if (!/^\d{10}$/.test(form.mobile)) return setError('Please enter a valid 10 digit mobile number')
    if (form.password.length < 8) return setError('Password must be minimum 8 characters')
    if (!form.termsAccepted) return setError('Please accept the Terms and Conditions')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          mobile: form.mobile,
          password: form.password,
          organisationName: form.organisationName.trim(),
          termsAccepted: form.termsAccepted
        })
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Registration failed')
      }
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="wl-page">
      <SiteHeader />
      <div className="wl-auth-wrap">
        <div className="wl-auth-card wide">
          {done ? (
            <div className="auth-result">
              <div className="auth-result__icon">✓</div>
              <span className="wl-badge wl-badge-warning">Awaiting admin approval</span>
              <h1>Thanks {form.name.split(' ')[0] || 'there'} — you are on the list!</h1>
              <p className="auth-result__lead">
                Your buyer account has been created successfully and sent to our
                team for verification.
              </p>
              <div className="auth-result__timeline">
                <div className="auth-result__step done">
                  <span className="auth-result__dot">✓</span>
                  <div>
                    <strong>Registration submitted</strong>
                    <span>We have received your details</span>
                  </div>
                </div>
                <div className="auth-result__step active">
                  <span className="auth-result__dot">2</span>
                  <div>
                    <strong>Team verification in progress</strong>
                    <span>Our team is reviewing your business details</span>
                  </div>
                </div>
                <div className="auth-result__step">
                  <span className="auth-result__dot">3</span>
                  <div>
                    <strong>Approval &amp; sign in</strong>
                    <span>Bid on live lots once approved</span>
                  </div>
                </div>
              </div>
              <p className="auth-result__note">
                Your account is typically approved within <strong>10–15 business days</strong> after
                our team verifies your details. We will notify you on your registered email
                once it is ready — you can then sign in and start bidding.
              </p>
              <div className="auth-result__actions">
                <button type="button" className="wl-btn wl-btn-primary" onClick={() => navigate('/')}>
                  Back to Home
                </button>
                <button type="button" className="wl-btn wl-btn-secondary" onClick={() => navigate('/products')}>
                  Browse Auctions
                </button>
              </div>
              <p className="auth-result__help">
                Need help? Write to us at <strong>support@lotmart.com</strong>
              </p>
            </div>
          ) : (
            <>
              <h1>Create a buyer account</h1>
              <p className="wl-auth-sub">
                Register your business to bid on live liquidation lots.
              </p>

              {error && <div className="wl-notice wl-notice-error">{error}</div>}

              <form className="wl-form" onSubmit={handleSubmit}>
                <div className="wl-form-2col">
                  <div className="wl-field">
                    <label htmlFor="su-name">Full name *</label>
                    <input
                      id="su-name"
                      className="wl-input"
                      type="text"
                      placeholder="Your name"
                      value={form.name}
                      onChange={update('name')}
                      required
                    />
                  </div>
                  <div className="wl-field">
                    <label htmlFor="su-email">Email *</label>
                    <input
                      id="su-email"
                      className="wl-input"
                      type="email"
                      placeholder="you@company.com"
                      value={form.email}
                      onChange={update('email')}
                      required
                    />
                  </div>
                </div>

                <div className="wl-form-2col">
                  <div className="wl-field">
                    <label htmlFor="su-mobile">Mobile number *</label>
                    <input
                      id="su-mobile"
                      className="wl-input"
                      type="text"
                      inputMode="numeric"
                      placeholder="10 digit mobile number"
                      value={form.mobile}
                      onChange={update('mobile')}
                      required
                    />
                  </div>

                  <div className="wl-field">
                    <label htmlFor="su-password">Password *</label>
                    <input
                      id="su-password"
                      className="wl-input"
                      type="password"
                      placeholder="Minimum 8 characters"
                      value={form.password}
                      onChange={update('password')}
                      minLength={8}
                      required
                    />
                  </div>
                </div>

                <div className="wl-field">
                  <label htmlFor="su-org">Organisation name</label>
                  <input
                    id="su-org"
                    className="wl-input"
                    type="text"
                    placeholder="Your company name"
                    value={form.organisationName}
                    onChange={update('organisationName')}
                  />
                </div>

                <label className="auth-terms">
                  <input
                    type="checkbox"
                    checked={form.termsAccepted}
                    onChange={update('termsAccepted')}
                    required
                  />
                  <span>I accept the Terms and Conditions</span>
                </label>

                <button
                  type="submit"
                  className="wl-btn wl-btn-primary wl-btn-block"
                  disabled={loading}
                >
                  {loading ? 'Creating account…' : 'Create Account'}
                </button>
              </form>

              <p className="auth-switch">
                Already registered? Use <strong>Sign In</strong> from the header to log in.
              </p>
            </>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
