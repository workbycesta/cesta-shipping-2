import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpMessage, setOtpMessage] = useState('')
  const [otpError, setOtpError] = useState('')
  const [resendTimer, setResendTimer] = useState(0)

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

  const startResendTimer = () => {
    setResendTimer(30)
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) clearInterval(interval)
        return t - 1
      })
    }, 1000)
  }

  const validateBeforeOtp = () => {
    if (!form.name.trim()) return 'Name is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Please enter a valid email'
    if (!/^\d{10}$/.test(form.mobile)) return 'Please enter a valid 10 digit mobile number'
    if (form.password.length < 8) return 'Password must be minimum 8 characters'
    if (!form.termsAccepted) return 'Please accept the Terms and Conditions'
    return ''
  }

  const handleSendOtp = async (isResend = false) => {
    setError('')
    setOtpError('')
    if (!isResend) {
      const validationError = validateBeforeOtp()
      if (validationError) {
        setError(validationError)
        return
      }
    }
    setOtpLoading(true)
    try {
      const res = await fetch('/api/auth/' + (isResend ? 'resend-otp' : 'register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isResend
            ? { email: form.email.trim() }
            : {
                name: form.name.trim(),
                email: form.email.trim(),
                mobile: form.mobile,
                password: form.password,
                organisationName: form.organisationName.trim(),
                termsAccepted: form.termsAccepted
              }
        )
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to send OTP')
      }
      setOtpSent(true)
      setOtpMessage(`OTP sent to ${data.mobile || form.mobile}.`)
      startResendTimer()
    } catch (err) {
      if (isResend) setOtpError(err.message)
      else setError(err.message)
    } finally {
      setOtpLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setOtpError('')
    if (!otp.trim()) {
      setOtpError('Please enter the OTP')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), otp: otp.trim() })
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'OTP verification failed')
      }
      setDone(true)
    } catch (err) {
      setOtpError(err.message)
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
            <div className="auth-success">
              <div className="auth-success__icon">✓</div>
              <h1>Registration complete</h1>
              <p>
                Thank you, <strong>{form.name}</strong>. Your buyer account has been
                created and is now <strong>awaiting admin approval</strong>.
              </p>
              <p className="auth-success__note">
                You will be able to sign in once the admin approves your account.
              </p>
              <button type="button" className="wl-btn wl-btn-primary" onClick={() => navigate('/')}>
                Back to Home
              </button>
            </div>
          ) : (
            <>
              <div className="auth-steps" aria-label="Registration progress">
                <span className={`auth-step ${!otpSent ? 'active' : 'done'}`}>1 · Details</span>
                <span className="auth-step__line" />
                <span className={`auth-step ${otpSent ? 'active' : ''}`}>2 · Verify OTP</span>
              </div>

              <h1>Create a buyer account</h1>
              <p className="wl-auth-sub">
                Register your business to bid on live liquidation lots.
              </p>

              {error && <div className="wl-notice wl-notice-error">{error}</div>}

              <form className="wl-form" onSubmit={handleVerifyOtp}>
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
                      disabled={otpSent}
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
                      disabled={otpSent}
                      required
                    />
                  </div>
                </div>

                <div className="wl-form-2col">
                  <div className="wl-field">
                    <label htmlFor="su-mobile">Mobile number *</label>
                    <div className="auth-mobile-row">
                      <input
                        id="su-mobile"
                        className="wl-input"
                        type="text"
                        inputMode="numeric"
                        placeholder="10 digit mobile number"
                        value={form.mobile}
                        onChange={update('mobile')}
                        disabled={otpSent}
                        required
                      />
                      {!otpSent && (
                        <button
                          type="button"
                          className="wl-btn wl-btn-secondary wl-btn-sm"
                          onClick={() => handleSendOtp(false)}
                          disabled={otpLoading}
                        >
                          {otpLoading ? 'Sending…' : 'Send OTP'}
                        </button>
                      )}
                    </div>
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
                      disabled={otpSent}
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
                    disabled={otpSent}
                  />
                </div>

                {otpSent && (
                  <div className="auth-otp-box">
                    <p className="auth-otp-msg">{otpMessage}</p>
                    <div className="auth-otp-row">
                      <input
                        className="wl-input auth-otp-input"
                        type="text"
                        inputMode="numeric"
                        placeholder="6 digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        required
                      />
                      <button
                        type="button"
                        className="wl-btn wl-btn-secondary wl-btn-sm"
                        onClick={() => handleSendOtp(true)}
                        disabled={otpLoading || resendTimer > 0}
                      >
                        {resendTimer > 0 ? `Resend (${resendTimer}s)` : 'Resend OTP'}
                      </button>
                    </div>
                    {otpError && <div className="wl-notice wl-notice-error" style={{ marginBottom: 0 }}>{otpError}</div>}
                    <button type="submit" className="wl-btn wl-btn-primary wl-btn-block" disabled={loading}>
                      {loading ? 'Verifying…' : 'Verify OTP & Complete Registration'}
                    </button>
                  </div>
                )}

                <label className="auth-terms">
                  <input
                    type="checkbox"
                    checked={form.termsAccepted}
                    onChange={update('termsAccepted')}
                    disabled={otpSent}
                    required
                  />
                  <span>I accept the Terms and Conditions</span>
                </label>

                {!otpSent && (
                  <button
                    type="button"
                    className="wl-btn wl-btn-primary wl-btn-block"
                    onClick={() => handleSendOtp(false)}
                    disabled={otpLoading}
                  >
                    {otpLoading ? 'Sending OTP…' : 'Continue →'}
                  </button>
                )}
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
