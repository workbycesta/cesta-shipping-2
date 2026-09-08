import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { usePrice } from './usePrice'
import { useUser } from './UserContext'
import Header from './Header'
import './ProductDetailPage.css'

function formatTime(seconds) {
  if (!seconds || seconds <= 0) return '0 Hr 00 Min 00 Sec'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const mStr = String(m).padStart(2, '0')
  const sStr = String(s).padStart(2, '0')
  return `${h} Hr ${mStr} Min ${sStr} Sec`
}

export default function ProductDetailPage() {
  const { id: paramId, orgName } = useParams()
  const navigate = useNavigate()
  const { formatMoney, formatRawMoney } = usePrice()
  const { user, openSignInModal } = useUser()

  // Extract pure ID if slug is included in path
  const lotId = paramId || ''

  const [lotSummary, setLotSummary] = useState(null)
  const [topCategory, setTopCategory] = useState([])
  const [topBrand, setTopBrand] = useState([])
  const [inventories, setInventories] = useState([])
  const [inventoryMeta, setInventoriesMeta] = useState({ current_page: 1, total_pages: 1, total_count: 0 })

  const [loading, setLoading] = useState(true)
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [error, setError] = useState('')

  const [selectedImgIndex, setSelectedImgIndex] = useState(0)
  const [remainingTime, setRemainingTime] = useState(0)

  const [inventoryPage, setInventoryPage] = useState(1)

  const [bidAmount, setBidAmount] = useState('')
  const [bidSubmitted, setBidSubmitted] = useState(false)
  const [biddingError, setBiddingError] = useState('')
  const [submittingBid, setSubmittingBid] = useState(false)

  const [bidStatusInfo, setBidStatusInfo] = useState({
    topBidAmount: 0,
    totalBidsCount: 0,
    userHighestBid: 0,
    userStatus: 'None'
  })

  const [selectedReason, setSelectedReason] = useState('')
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  const [copied, setCopied] = useState(false)
  const [downloadingManifest, setDownloadingManifest] = useState(false)

  // Fetch Live Bid status for this lot
  const fetchLotBids = async () => {
    if (!lotId) return
    try {
      const emailQuery = user?.email ? `?email=${encodeURIComponent(user.email)}` : ''
      const res = await fetch(`/api/bids/lot/${lotId}${emailQuery}`)
      if (res.ok) {
        const data = await res.json()
        setBidStatusInfo(data)
      }
    } catch (e) {
      console.error('Error fetching lot bid status:', e)
    }
  }

  useEffect(() => {
    fetchLotBids()
  }, [lotId, user])

  // Fetch Lot Details
  useEffect(() => {
    if (!lotId) return

    const fetchDetails = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/lot_publishes/${lotId}/lot_details`)
        if (!res.ok) {
          throw new Error(`Failed to load product details (${res.status})`)
        }
        const data = await res.json()
        const summary = data?.lot_summary || null
        setLotSummary(summary)
        setTopCategory(data?.top_Category || [])
        setTopBrand(data?.top_Brand || [])

        if (summary && typeof summary.bid_remaining_time === 'number') {
          setRemainingTime(Math.floor(summary.bid_remaining_time))
        }
      } catch (err) {
        console.error('Error fetching lot details:', err)
        setError(err.message || 'Product not found')
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [lotId])

  // Fetch Inventories (Manifest items)
  useEffect(() => {
    if (!lotId) return

    const fetchInventories = async () => {
      setInventoryLoading(true)
      try {
        const res = await fetch(`/api/lot_publishes/${lotId}/fetch_lot_inventories?per_page=24&page=${inventoryPage}`)
        if (res.ok) {
          const data = await res.json()
          setInventories(data?.all_products || [])
          if (data?.meta) {
            setInventoriesMeta(data.meta)
          }
        }
      } catch (err) {
        console.error('Error fetching lot inventories:', err)
      } finally {
        setInventoryLoading(false)
      }
    }

    fetchInventories()
  }, [lotId, inventoryPage])

  // Countdown timer
  useEffect(() => {
    if (remainingTime <= 0) return
    const timer = setInterval(() => {
      setRemainingTime((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [remainingTime])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleDownloadManifest = async () => {
    if (downloadingManifest || !lotId) return
    setDownloadingManifest(true)
    try {
      const res = await fetch(`/api/manifest/${lotId}`)
      if (!res.ok) {
        throw new Error(`Failed to download manifest (${res.status})`)
      }
      const blob = await res.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `manifest_${lotSummary?.lot_number || lotId}.xlsx`
      document.body.appendChild(link)
      link.click()
      window.URL.revokeObjectURL(blobUrl)
      document.body.removeChild(link)
    } catch (err) {
      console.error('Error downloading manifest:', err)
      alert('Failed to download manifest. Please try again.')
    } finally {
      setDownloadingManifest(false)
    }
  }

  const [emailingManifest, setEmailingManifest] = useState(false)

  const handleEmailManifest = async () => {
    if (emailingManifest || !lotId) return
    const defaultEmail = user?.email || ''
    const inputEmail = window.prompt('Manifest will be sent to your email address : ', defaultEmail)
    if (inputEmail === null || inputEmail === '') return
    const clean = inputEmail.trim().toLowerCase()
    if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      alert('Please enter a valid email address.')
      return
    }
    setEmailingManifest(true)
    try {
      const res = await fetch(`/api/manifest/${lotId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clean })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.message || `Failed to email manifest (${res.status})`)
      }
      alert(data.message || `Manifest has been sent to ${clean}!`)
    } catch (err) {
      console.error('Error emailing manifest:', err)
      alert(err.message || 'Failed to email manifest. Please try again.')
    } finally {
      setEmailingManifest(false)
    }
  }

  const handleBidSubmit = async (e) => {
    e.preventDefault()
    setBiddingError('')

    if (!user) {
      openSignInModal()
      return
    }

    if (!bidAmount) {
      setBiddingError('Please enter a valid bid amount')
      return
    }

    const numBid = Number(bidAmount)
    if (isNaN(numBid) || numBid <= 0) {
      setBiddingError('Bid amount must be a positive number')
      return
    }

    // Bids must be in multiples of 1000 (1000, 2000, 3000, ...)
    if (numBid % 1000 !== 0) {
      setBiddingError('Bid amount must be in multiples of ₹1,000 (e.g. 1000, 2000, 3000)')
      return
    }

    // Floor price check
    const minRequired = lotSummary?.floor_price ? Number(lotSummary.floor_price) : 0
    if (numBid < minRequired) {
      setBiddingError(`Bid amount must be at least the floor price (${formatMoney(minRequired)})`)
      return
    }

    setSubmittingBid(true)
    try {
      const res = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lotId,
          lotName: lotSummary.lot_name,
          lotImageUrl: lotSummary.lot_image_urls?.[0] || '',
          bidAmount: numBid,
          floorPrice: lotSummary.floor_price || 0,
          mrp: lotSummary.mrp || 0,
          userEmail: user.email,
          userName: user.name,
          endDate: lotSummary.end_date || ''
        })
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit bid')
      }

      setBidSubmitted(true)
      setBidAmount('')
      setTimeout(() => setBidSubmitted(false), 5000)
      fetchLotBids()
    } catch (err) {
      setBiddingError(err.message)
    } finally {
      setSubmittingBid(false)
    }
  }

  const handleFeedbackSubmit = (e) => {
    e.preventDefault()
    if (!selectedReason) return
    setFeedbackSubmitted(true)
  }

  if (loading) {
    return (
      <div className="pdp-page">
        <Header />
        <div className="pdp-loading">
          <div className="spinner"></div>
          <p>Loading product details...</p>
        </div>
      </div>
    )
  }

  if (error || !lotSummary) {
    return (
      <div className="pdp-page">
        <Header />
        <div className="pdp-error-container">
          <h2>Product Not Found</h2>
          <p>{error || 'The requested product could not be loaded.'}</p>
          <button className="btn-back" onClick={() => navigate(-1)}>← Back to Products</button>
        </div>
      </div>
    )
  }

  const images = lotSummary.lot_image_urls && lotSummary.lot_image_urls.length > 0
    ? lotSummary.lot_image_urls
    : ['https://via.placeholder.com/400x300?text=No+Image']

  const currentImage = images[selectedImgIndex] || images[0]

  return (
    <div className="pdp-page">
      <Header />

      <div className="pdp-breadcrumb">
        <button type="button" className="breadcrumb-back-btn" onClick={() => navigate(-1)}>
          ← Back to Products
        </button>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{lotSummary.lot_name}</span>
      </div>

      <main className="pdp-main">
        {/* TOP HERO SECTION: GALLERY + PRODUCT SPECS & BIDDING */}
        <div className="pdp-hero-grid">
          {/* LEFT: Image Gallery */}
          <div className="pdp-gallery">
            <div className="main-image-wrapper">
              <img src={currentImage} alt={lotSummary.lot_name} className="main-image" />
              {lotSummary.org_image_url && (
                <img src={lotSummary.org_image_url} alt="org_logo" className="pdp-org-badge" />
              )}
            </div>
            {images.length > 1 && (
              <div className="thumbnails-row">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`thumb-btn ${idx === selectedImgIndex ? 'active' : ''}`}
                    onClick={() => setSelectedImgIndex(idx)}
                  >
                    <img src={img} alt={`thumb-${idx}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Product Details & Action Box */}
          <div className="pdp-info">
            {/* Countdown only shown/running when 1 hour or less remains (per Bulk4Traders API) */}
            {remainingTime > 0 && remainingTime <= 3600 && (
              <div className="pdp-timer-badge">
                ⏱ {formatTime(remainingTime)}
              </div>
            )}

            <h1 className="pdp-title">{lotSummary.lot_name}</h1>

            <div className="pdp-meta-tags">
              <span className="tag-location">📍 {lotSummary.storage_location}</span>
              <span className="tag-grade">{lotSummary.grade_name}</span>
            </div>

            <div className="pdp-specs-box">
              <div className="pdp-spec-item">
                <span className="spec-label">Quantity</span>
                <strong className="spec-val">{lotSummary.items_count} items</strong>
              </div>
              <div className="pdp-spec-item">
                <span className="spec-label">MRP</span>
                <strong className="spec-val">{formatRawMoney(lotSummary.mrp)}</strong>
              </div>
              <div className="pdp-spec-item">
                <span className="spec-label">Floor Price</span>
                <strong className="spec-val highlight-price">{formatMoney(lotSummary.floor_price)}</strong>
              </div>
            </div>

            {/* Bidding & Live Status Card */}
            <div className="pdp-actions-card">
              {bidStatusInfo.topBidAmount > 0 && (
                <div className="pdp-topbid-banner">
                  <span>Current Highest Bid:</span>
                  <strong>{formatMoney(bidStatusInfo.topBidAmount)}</strong>
                </div>
              )}

              {user && bidStatusInfo.userStatus !== 'None' && (
                <div className={`pdp-user-status-banner ${bidStatusInfo.userStatus === 'Winning' ? 'banner-winning' : 'banner-losing'}`}>
                  {bidStatusInfo.userStatus === 'Winning' ? (
                    <>🟢 <strong>YOU ARE WINNING!</strong> Your highest bid: {formatMoney(bidStatusInfo.userHighestBid)}</>
                  ) : (
                    <>🔴 <strong>YOU ARE OUTBID / LOSING!</strong> Your bid: {formatMoney(bidStatusInfo.userHighestBid)} (Top bid: {formatMoney(bidStatusInfo.topBidAmount)})</>
                  )}
                </div>
              )}

              <form className="pdp-bid-form" onSubmit={handleBidSubmit}>
                <label htmlFor="bid-input" className="bid-label">
                  Enter Your Bid Amount {user ? `(as ${user.email})` : ''}
                </label>
                <div className="bid-input-group">
                  <span className="currency-prefix">₹</span>
                  <input
                    id="bid-input"
                    type="number"
                    step="1000"
                    min="0"
                    placeholder={`Min. ${formatMoney(Math.max(lotSummary.floor_price || 0, bidStatusInfo.topBidAmount || 0))}`}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                  />
                  <button type="submit" className="btn-submit-bid" disabled={submittingBid}>
                    {submittingBid ? 'SUBMITTING...' : 'SUBMIT BID'}
                  </button>
                </div>
                <p className="bid-hint">Bids must be in multiples of ₹1,000</p>

                {biddingError && (
                  <div className="pdp-bid-error">{biddingError}</div>
                )}

                {bidSubmitted && (
                  <div className="pdp-bid-alert">✅ Your bid has been successfully placed in real-time!</div>
                )}
              </form>

              {lotSummary.buy_now_price && (
                <div className="pdp-buynow-row">
                  <button type="button" className="btn-buy-now">
                    Buy @ {formatMoney(lotSummary.buy_now_price)}
                  </button>
                </div>
              )}

              <div className="pdp-share-row">
                <button type="button" className="btn-share" onClick={handleShare}>
                  🔗 {copied ? 'LINK COPIED!' : 'SHARE'}
                </button>
              </div>
            </div>

            {/* Feedback section */}
            <div className="pdp-feedback-box">
              <h3>INTERESTED IN THE LOT BUT NOT BIDDING?</h3>
              <p className="feedback-subtitle">PLEASE LET US KNOW WHY...</p>

              {feedbackSubmitted ? (
                <div className="feedback-thanks">Thank you for your feedback!</div>
              ) : (
                <form onSubmit={handleFeedbackSubmit}>
                  <div className="feedback-options-grid">
                    {[
                      'Lot too small',
                      'Lot too large',
                      'Logistics cost is too high',
                      'Lot mix not good',
                      'Manifest not clear',
                      'No grading details',
                      'Pricing not attractive'
                    ].map((reason) => (
                      <label key={reason} className="feedback-option">
                        <input
                          type="radio"
                          name="feedback-reason"
                          value={reason}
                          checked={selectedReason === reason}
                          onChange={(e) => setSelectedReason(e.target.value)}
                        />
                        <span>{reason}</span>
                      </label>
                    ))}
                  </div>
                  <button type="submit" className="btn-submit-feedback" disabled={!selectedReason}>
                    Submit Feedback
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* INFORMATIONAL CARDS SECTION */}
        <div className="pdp-info-cards">
          <section className="pdp-card">
            <h2>CONDITION TYPE</h2>
            <p>
              <strong>{lotSummary.grade_name}</strong> - The item shows normal marks from consistent use,
              but it remains in good condition and works fully. It may show other signs of previous ownership.
            </p>
          </section>

          <section className="pdp-card">
            <h2>TERMS OF PURCHASE</h2>
            <p>
              WholeLot Traders is an intermediary that provides a platform through which Buyers may purchase
              Inventory from Sellers. All sales are subject to standard auction terms and conditions.
            </p>
          </section>

          <section className="pdp-card">
            <h2>FAQ's</h2>
            <p>
              <strong>Applying and Logging In:</strong> How do I register as a buyer? Registration is free and
              allows you to participate in all live auctions across marketplaces.
            </p>
          </section>

          <section className="pdp-card">
            <h2>ADDITIONAL INFO</h2>
            <p>
              <strong>Lot Description:</strong> {lotSummary.lot_description || 'Delivery between 2 to 3 working days after full payment.'}
            </p>
          </section>
        </div>

        {/* LOT DETAILS: TOP BRAND & TOP CATEGORY */}
        <div className="pdp-tables-section">
          <h2>LOT DETAILS</h2>
          <div className="pdp-breakdown-grid">
            {/* TOP BRAND TABLE */}
            <div className="breakdown-card">
              <h3>TOP BRAND</h3>
              {topBrand && topBrand.length > 0 ? (
                <table className="breakdown-table">
                  <thead>
                    <tr>
                      <th>Brand</th>
                      <th>Quantity</th>
                      <th>Lot MRP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topBrand.map((item, idx) => (
                      <tr key={idx}>
                        <td className="brand-name-cell">{item.brand_name?.toUpperCase() || 'UNKNOWN'}</td>
                        <td>{item.item_count} ({item.item_percentage}%)</td>
                        <td>{formatRawMoney(item.sum)} ({item.percentage}%)</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-data">No brand breakdown available.</p>
              )}
            </div>

            {/* TOP CATEGORY TABLE */}
            <div className="breakdown-card">
              <h3>TOP CATEGORY</h3>
              {topCategory && topCategory.length > 0 ? (
                <table className="breakdown-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Quantity</th>
                      <th>Lot MRP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCategory.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.category_name}</td>
                        <td>{item.item_count} ({item.item_percentage}%)</td>
                        <td>{formatRawMoney(item.sum)} ({item.percentage}%)</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-data">No category breakdown available.</p>
              )}
            </div>
          </div>
        </div>

        {/* ALL PRODUCTS (MANIFEST / INVENTORIES TABLE) */}
        <div className="pdp-manifest-section">
          <div className="manifest-header-row">
            <h2>ALL PRODUCTS</h2>
            <div className="manifest-actions">
              <button
                type="button"
                className="btn-manifest-action"
                onClick={handleEmailManifest}
                disabled={emailingManifest}
              >
                {emailingManifest ? 'Sending…' : 'Email Manifest'}
              </button>

              <button
                type="button"
                className={`btn-manifest-download ${downloadingManifest ? 'loading' : ''}`}
                onClick={handleDownloadManifest}
                disabled={downloadingManifest}
              >
                {downloadingManifest ? (
                  <>
                    <span className="spinner-sm"></span> Downloading...
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download Manifest
                  </>
                )}
              </button>

              <a
                className="btn-whatsapp-action"
                href={`https://api.whatsapp.com/send?phone=+919481359961&text=Hello%21%20Interested%20in%20lot%20${lotSummary.id}`}
                target="_blank"
                rel="noreferrer"
              >
                Whatsapp
              </a>
            </div>
          </div>

          {inventoryLoading ? (
            <div className="inventory-loading">Loading items...</div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="manifest-table">
                  <thead>
                    <tr>
                      <th>STOCK IMAGE</th>
                      <th>DESCRIPTION</th>
                      <th>BRAND</th>
                      <th>CATEGORY</th>
                      <th>QUANTITY</th>
                      <th>MRP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventories && inventories.length > 0 ? (
                      inventories.map((prod) => (
                        <tr key={prod.id}>
                          <td className="col-image">
                            {prod.image_urls && prod.image_urls.length > 0 ? (
                              <img src={prod.image_urls[0]} alt="product" className="stock-thumb" />
                            ) : (
                              <div className="no-stock-thumb">📦</div>
                            )}
                          </td>
                          <td className="col-desc">{prod.description}</td>
                          <td className="col-brand">{prod.brand}</td>
                          <td className="col-cat">{prod.category}</td>
                          <td className="col-qty">{prod.quantity}</td>
                          <td className="col-mrp">{formatRawMoney(prod.mrp)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="no-data">No product items found for this lot.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {inventoryMeta.total_pages > 1 && (
                <div className="inventory-pagination">
                  <button
                    type="button"
                    disabled={inventoryPage <= 1}
                    onClick={() => setInventoryPage((p) => Math.max(1, p - 1))}
                  >
                    ‹
                  </button>
                  <span className="page-info">
                    Page {inventoryPage} of {inventoryMeta.total_pages}
                  </span>
                  <button
                    type="button"
                    disabled={inventoryPage >= inventoryMeta.total_pages}
                    onClick={() => setInventoryPage((p) => Math.min(inventoryMeta.total_pages, p + 1))}
                  >
                    ›
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="footer-brand">
          <div className="brand-logo footer-logo" role="img" aria-label="wholelot traders">
            <span className="brand-text">wholelot</span>
            <span className="brand-text-second">traders</span>
          </div>
        </div>
        <div className="footer-links">
          <a href="#">About Us</a>
          <a href="#">Contact Us</a>
          <a href="#">FAQ</a>
        </div>
        <div className="footer-links">
          <a href="#">Terms of Purchase</a>
          <a href="#">Items Condition</a>
          <a href="#">Privacy Policy</a>
        </div>
        <div className="footer-contact">
          <p>📞 1800-419-0431</p>
          <p>✉ support@wholelottraders.com</p>
        </div>
      </footer>

      <a
        className="whatsapp-fab"
        href={`https://api.whatsapp.com/send?phone=+919481359961&text=Hello%21%20.`}
        target="_blank"
        rel="noreferrer"
        aria-label="Open WhatsApp"
      >
        ☎
      </a>
    </div>
  )
}
