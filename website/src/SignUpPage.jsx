import { useState } from 'react'
import { Link } from 'react-router-dom'
import './SignUpPage.css'

const initialForm = {
  name: '',
  email: '',
  mobile: '',
  password: '',
  organisationName: '',
  termsAccepted: false
}

export default function SignUpPage() {
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // OTP flow state (mirrors b4traders: SEND OTP -> enter OTP -> submit)
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
      // enforce 10 digit numeric mobile like b4traders
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
      setOtpMessage(`OTP sent to ${data.mobile || form.mobile}. ${data.devOtp ? `(Dev OTP: ${data.devOtp})` : ''}`)
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

  if (done) {
    return (
      <div className="signup-page">
        <div className="signup-card signup-success">
          <div className="success-icon">✓</div>
          <h1>Registration Complete!</h1>
          <p>
            Thank you, <strong>{form.name}</strong>. Your buyer account has been created and is
            now <strong>awaiting admin approval</strong>.
          </p>
          <p className="success-note">
            You will be able to sign in once the admin approves your account.
          </p>
          <Link to="/" className="signup-back-link">← Back to Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="signup-page">
      <div className="signup-card">
        <h1 className="signup-title">Buyer Registration Form</h1>
        {error && <div className="signup-error">{error}</div>}

        <form className="signup-form" onSubmit={handleVerifyOtp}>
          <div className="signup-row">
            <div className="signup-field">
              <label htmlFor="su-name">Name<span className="req">*</span></label>
              <input
                id="su-name"
                type="text"
                placeholder="Name"
                value={form.name}
                onChange={update('name')}
                disabled={otpSent}
                required
              />
            </div>
            <div className="signup-field">
              <label htmlFor="su-email">Email ID</label>
              <input
                id="su-email"
                type="email"
                placeholder="Ex: xyz123@gmail.com"
                value={form.email}
                onChange={update('email')}
                disabled={otpSent}
              />
            </div>
          </div>

          <div className="signup-row">
            <div className="signup-field">
              <label htmlFor="su-mobile">Mobile Number<span className="req">*</span></label>
              <div className="mobile-row">
                <input
                  id="su-mobile"
                  type="text"
                  inputMode="numeric"
                  placeholder="10 digit mobile number"
                  value={form.mobile}
                  onChange={update('mobile')}
                  disabled={otpSent}
                  required
                />
                <button
                  type="button"
                  className="btn-send-otp"
                  onClick={() => handleSendOtp(false)}
                  disabled={otpLoading || otpSent || form.mobile.length !== 10}
                >
                  {otpLoading ? 'SENDING…' : 'SEND OTP'}
                </button>
              </div>
            </div>

            <div className="signup-field">
              <label htmlFor="su-password">Password<span className="req">*</span></label>
              <input
                id="su-password"
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

          <div className="signup-row">
            <div className="signup-field">
              <label htmlFor="su-org">Organisation Name</label>
              <input
                id="su-org"
                type="text"
                placeholder="Enter your company name here"
                value={form.organisationName}
                onChange={update('organisationName')}
                disabled={otpSent}
              />
            </div>
          </div>

          {otpSent && (
            <div className="otp-section">
              <div className="otp-message">{otpMessage}</div>
              <div className="otp-row">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter 6 digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                />
                <button
                  type="button"
                  className="btn-resend-otp"
                  onClick={() => handleSendOtp(true)}
                  disabled={otpLoading || resendTimer > 0}
                >
                  {resendTimer > 0 ? `RESEND (${resendTimer}s)` : 'RESEND OTP'}
                </button>
              </div>
              {otpError && <div className="signup-error">{otpError}</div>}
              <button type="submit" className="btn-submit-form" disabled={loading}>
                {loading ? 'VERIFYING…' : 'VERIFY OTP & COMPLETE REGISTRATION'}
              </button>
            </div>
          )}

          <div className="terms-row">
            <label className="terms-label">
              <input
                type="checkbox"
                checked={form.termsAccepted}
                onChange={update('termsAccepted')}
                disabled={otpSent}
                required
              />
              <span>
                Accept Terms and Condition <a href="#" onClick={(e) => e.preventDefault()}>click here to view</a>
              </span>
            </label>
          </div>

          {!otpSent && (
            <button
              type="button"
              className="btn-submit-form"
              onClick={() => handleSendOtp(false)}
              disabled={otpLoading}
            >
              {otpLoading ? 'SENDING OTP…' : 'SUBMIT FORM'}
            </button>
          )}
        </form>

        <p className="signup-signin-hint">
          Already registered?{' '}
          <Link to="/" className="signup-signin-link">Sign In here</Link>
        </p>
      </div>
    </div>
  )
}