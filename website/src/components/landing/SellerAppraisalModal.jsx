import { useState } from 'react'
import { IconClose } from './LandingIcons'

const EMPTY_FORM = {
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  inventoryType: 'overstock',
  retailMSRP: '',
  lotVolume: '',
  location: '',
  notes: ''
}

export default function SellerAppraisalModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 800)
  }

  const handleReset = () => {
    setSubmitted(false)
    setFormData(EMPTY_FORM)
    onClose()
  }

  const set = (field) => (e) => setFormData({ ...formData, [field]: e.target.value })

  return (
    <div className="landing-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="landing-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="landing-modal__close" onClick={onClose} aria-label="Close">
          <IconClose size={18} />
        </button>

        {submitted ? (
          <div className="appraisal-success">
            <h3>Request received.</h3>
            <p>
              Thanks{formData.contactName ? `, ${formData.contactName}` : ''} — your details
              have been noted{formData.companyName ? ` for ${formData.companyName}` : ''}.
              We will get back to you{formData.email ? ` at ${formData.email}` : ''} about listing your lot.
            </p>
            <button type="button" className="landing-btn landing-btn--primary" onClick={handleReset}>
              Close
            </button>
          </div>
        ) : (
          <>
            <h3>Request a lot appraisal</h3>
            <p className="landing-modal__sub">
              Tell us what stock you are holding and where it is. We will review it
              and get back to you about listing it on the marketplace.
            </p>
            <form onSubmit={handleSubmit} className="appraisal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Company name *</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={set('companyName')}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Contact name *</label>
                  <input
                    type="text"
                    required
                    value={formData.contactName}
                    onChange={set('contactName')}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Business email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={set('email')}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={set('phone')}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Inventory type *</label>
                  <select
                    value={formData.inventoryType}
                    onChange={set('inventoryType')}
                    className="form-input"
                  >
                    <option value="overstock">Overstock</option>
                    <option value="returns">Customer returns</option>
                    <option value="liquidation">Liquidation / store closeout</option>
                    <option value="surplus">Surplus goods</option>
                    <option value="clearance">Shelf pulls / clearance</option>
                    <option value="bulk">Mixed bulk</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Approx. retail value *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rs. 4,50,000"
                    value={formData.retailMSRP}
                    onChange={set('retailMSRP')}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Quantity / lot size *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 4 pallets or 1 truckload"
                    value={formData.lotVolume}
                    onChange={set('lotVolume')}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Warehouse location *</label>
                  <input
                    type="text"
                    required
                    placeholder="City"
                    value={formData.location}
                    onChange={set('location')}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Anything else (optional)</label>
                <textarea
                  rows="3"
                  placeholder="Manifest availability, restrictions, timeline..."
                  value={formData.notes}
                  onChange={set('notes')}
                  className="form-input"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="landing-btn landing-btn--primary landing-btn--block"
              >
                {loading ? 'Submitting...' : 'Submit Appraisal Request'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
