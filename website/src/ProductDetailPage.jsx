import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { usePrice } from './usePrice'
import { useUser } from './UserContext'
import { displayCity } from './displayCity'
import SiteHeader, { SiteFooter } from './SiteChrome'
import './theme.css'
import './ProductDetail.css'

const TIMER_OFFSET_SECONDS_FALLBACK = 60 * 60

function formatTime(seconds) {
  if (!seconds || seconds <= 0) return 'Ended'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h >= 48) {
    const d = Math.floor(h / 24)
    return `${d}d ${h % 24}h ${String(m).padStart(2, '0')}m`
  }
  return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
}

export default function ProductDetailPage() {
  const { id: paramId, orgName } = useParams()
  const navigate = useNavigate()
  const { formatMoney, formatRawMoney, applyPriceHike, timerOffsetSeconds } = usePrice()
  const timerOffset = Number.isFinite(timerOffsetSeconds) ? timerOffsetSeconds : TIMER_OFFSET_SECONDS_FALLBACK
  const { user, openSignInModal } = useUser()

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

  const [allotInfo, setAllotInfo] = useState(null)
  const [biddingClosedEarly, setBiddingClosedEarly] = useState(false)

  useEffect(() => {
    if (!lotId) return
    let cancelled = false
    const fetchAllotment = async () => {
      try {
        const res = await fetch(`/api/allotments/${lotId}`)
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        setAllotInfo(data.allotment || null)
        if (data.manuallyEnded) {
          setBiddingClosedEarly(true)
          setRemainingTime(0)
        }
      } catch {
        // Allotment is informational — never break the page over it.
      }
    }
    fetchAllotment()
    return () => { cancelled = true }
  }, [lotId])

  const [selectedReason, setSelectedReason] = useState('')
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  const [copied, setCopied] = useState(false)
  const [downloadingManifest, setDownloadingManifest] = useState(false)

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
          setRemainingTime(Math.max(0, Math.floor(summary.bid_remaining_time - timerOffset)))
        }
      } catch (err) {
        console.error('Error fetching lot details:', err)
        setError(err.message || 'Product not found')
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [lotId, timerOffset])

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

    if (biddingClosedEarly) {
      setBiddingError('Bidding for this lot has ended.')
      return
    }

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

    if (numBid % 1000 !== 0) {
      setBiddingError('Bid amount must be in multiples of ₹1,000 (e.g. 1000, 2000, 3000)')
      return
    }

    const minRequired = lotSummary?.floor_price
      ? Math.ceil(applyPriceHike(Number(lotSummary.floor_price)) / 1000) * 1000 + 1000
      : 0
    if (minRequired > 0 && numBid < minRequired) {
      setBiddingError(`Minimum bid is ${formatRawMoney(minRequired)} (floor price + ₹1,000)`)
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
      <div className="wl-page">
        <SiteHeader />
        <main className="wl-main">
          <div className="pdp-layout">
            <div>
              <div className="wl-skeleton" style={{ height: 420, borderRadius: 12 }} />
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="wl-skeleton" style={{ width: 72, height: 72, borderRadius: 8 }} />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="wl-skeleton" style={{ height: 28, width: '85%' }} />
              <div className="wl-skeleton" style={{ height: 18, width: '50%' }} />
              <div className="wl-skeleton" style={{ height: 120 }} />
              <div className="wl-skeleton" style={{ height: 180 }} />
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  if (error || !lotSummary) {
    return (
      <div className="wl-page">
        <SiteHeader />
        <main className="wl-main">
          <div className="wl-empty">
            <h3>Lot not found</h3>
            <p>{error || 'This lot may have been removed or the link is incorrect.'}</p>
            <div className="wl-empty-actions">
              <button type="button" className="wl-btn wl-btn-secondary" onClick={() => navigate(-1)}>
                ← Go back
              </button>
              <Link to="/products" className="wl-btn wl-btn-primary">
                Browse all auctions
              </Link>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  const images = lotSummary.lot_image_urls && lotSummary.lot_image_urls.length > 0
    ? lotSummary.lot_image_urls
    : []
  const currentImage = images[selectedImgIndex] || images[0]
  const backPath = orgName ? `/${orgName}/products` : '/products'
  const minBid = Math.max(
    lotSummary.floor_price ? Math.ceil(applyPriceHike(Number(lotSummary.floor_price)) / 1000) * 1000 + 1000 : 0,
    bidStatusInfo.topBidAmount || 0
  )

  return (
    <div className="wl-page">
      <SiteHeader />

      <main className="wl-main">
        <nav className="wl-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="wl-crumb-sep">/</span>
          {orgName ? (
            <>
              <Link to="/marketplaces">Marketplaces</Link>
              <span className="wl-crumb-sep">/</span>
              <Link to={backPath}>{orgName}</Link>
              <span className="wl-crumb-sep">/</span>
            </>
          ) : (
            <>
              <Link to="/products">All Auctions</Link>
              <span className="wl-crumb-sep">/</span>
            </>
          )}
          <span className="wl-crumb-current">{lotSummary.lot_name}</span>
        </nav>

        <div className="pdp-layout">
          <div className="pdp-gallery">
            <div className="pdp-gallery__main">
              {currentImage ? (
                <img src={currentImage} alt={lotSummary.lot_name} className="pdp-gallery__main-img" />
              ) : (
                <div className="pdp-gallery__placeholder">No image available</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="pdp-gallery__thumbs">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`pdp-thumb ${idx === selectedImgIndex ? 'active' : ''}`}
                    onClick={() => setSelectedImgIndex(idx)}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <img src={img} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}

            <div className="pdp-facts">
              <div className="pdp-fact">
                <span>Quantity</span>
                <strong>{lotSummary.items_count} items</strong>
              </div>
              <div className="pdp-fact">
                <span>MRP</span>
                <strong>{formatRawMoney(lotSummary.mrp)}</strong>
              </div>
              <div className="pdp-fact">
                <span>Location</span>
                <strong>{displayCity(lotSummary.storage_location)}</strong>
              </div>
              <div className="pdp-fact">
                <span>Condition</span>
                <strong>{lotSummary.grade_name}</strong>
              </div>
            </div>
          </div>

          <div className="pdp-buybox">
            <div className="pdp-buybox__main">
              {biddingClosedEarly ? (
                <span className="wl-timer-badge ended">Bidding ended</span>
              ) : remainingTime > 0 ? (
                <span className="wl-timer-badge">Ends in {formatTime(remainingTime)}</span>
              ) : (
                <span className="wl-timer-badge ended">Bidding ended</span>
              )}

              <h1 className="pdp-title">{lotSummary.lot_name}</h1>

              {lotSummary.org_image_url && (
                <div className="pdp-source">
                  <span className="pdp-source__label">Sourced from</span>
                  <img src={lotSummary.org_image_url} alt="Source marketplace" className="pdp-source__logo" loading="lazy" />
                </div>
              )}

              <div className="pdp-price-block">
                <div className="pdp-price-row">
                  <span className="pdp-price-label">Floor Price</span>
                  <strong className="pdp-price-floor">{formatMoney(lotSummary.floor_price)}</strong>
                </div>
                {bidStatusInfo.topBidAmount > 0 && (
                  <div className="pdp-price-row">
                    <span className="pdp-price-label">Current Highest Bid</span>
                    <strong className="pdp-price-top">{formatRawMoney(bidStatusInfo.topBidAmount)}</strong>
                  </div>
                )}
                {bidStatusInfo.totalBidsCount > 0 && (
                  <span className="pdp-bid-count">
                    {bidStatusInfo.totalBidsCount} bid{bidStatusInfo.totalBidsCount === 1 ? '' : 's'} placed
                  </span>
                )}
              </div>

              {user && bidStatusInfo.userStatus !== 'None' && (
                <div className={`pdp-status ${bidStatusInfo.userStatus === 'Winning' ? 'pdp-status--winning' : 'pdp-status--losing'}`}>
                  {bidStatusInfo.userStatus === 'Winning' ? (
                    <>You are winning with {formatRawMoney(bidStatusInfo.userHighestBid)}</>
                  ) : (
                    <>You are outbid. Your bid: {formatRawMoney(bidStatusInfo.userHighestBid)} · Top: {formatRawMoney(bidStatusInfo.topBidAmount)}</>
                  )}
                </div>
              )}

              {allotInfo && user && (
                <div className={`pdp-status ${allotInfo.allottedToEmail === user.email?.toLowerCase() ? 'pdp-status--winning' : 'pdp-status--losing'}`}>
                  {allotInfo.allottedToEmail === user.email?.toLowerCase() ? (
                    <>Allotted to you at {formatRawMoney(allotInfo.allottedAmount)}</>
                  ) : (
                    <>This lot was allotted to another bidder.</>
                  )}
                </div>
              )}
              {allotInfo && !user && (
                <div className="pdp-status pdp-status--losing">
                  Bidding is closed for this lot — it has been allotted.
                </div>
              )}

              <form className="pdp-bid-form" onSubmit={handleBidSubmit}>
                <label htmlFor="bid-input">
                  Your bid {user ? <span className="pdp-bid-as">as {user.email}</span> : null}
                </label>
                <div className="pdp-bid-row">
                  <span className="pdp-bid-prefix">₹</span>
                  <input
                    id="bid-input"
                    type="number"
                    step="1000"
                    min="0"
                    placeholder={`Min. ${formatRawMoney(minBid)}`}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    disabled={biddingClosedEarly}
                  />
                </div>
                <button type="submit" className="wl-btn wl-btn-primary wl-btn-block" disabled={submittingBid || biddingClosedEarly}>
                  {biddingClosedEarly ? 'Bidding Ended' : submittingBid ? 'Placing Bid…' : 'Place Bid'}
                </button>
                <p className="pdp-bid-hint">Bids must be in multiples of ₹1,000 · Minimum {formatRawMoney(minBid)}</p>

                {biddingError && <div className="wl-notice wl-notice-error" style={{ marginBottom: 0 }}>{biddingError}</div>}
                {bidSubmitted && <div className="wl-notice wl-notice-success" style={{ marginBottom: 0 }}>Your bid was placed successfully.</div>}
              </form>

              <div className="pdp-secondary-actions">
                <button type="button" className="wl-btn wl-btn-secondary wl-btn-sm" onClick={handleShare}>
                  {copied ? 'Link Copied' : 'Share Lot'}
                </button>
                <button
                  type="button"
                  className="wl-btn wl-btn-secondary wl-btn-sm"
                  onClick={handleDownloadManifest}
                  disabled={downloadingManifest}
                >
                  {downloadingManifest ? 'Downloading…' : 'Download Manifest'}
                </button>
              </div>

              {!user && (
                <div className="pdp-signin-nudge">
                  <button type="button" className="wl-chip-clear" onClick={openSignInModal}>
                    Sign in to bid on this lot →
                  </button>
                </div>
              )}
            </div>

            <div className="pdp-trust">
              <div className="pdp-trust__item">
                <strong>Itemized manifest</strong>
                <span>Every SKU listed before you bid</span>
              </div>
              <div className="pdp-trust__item">
                <strong>Stated condition</strong>
                <span>{lotSummary.grade_name} grade on this lot</span>
              </div>
              <div className="pdp-trust__item">
                <strong>Open bidding</strong>
                <span>Visible bid history, highest wins</span>
              </div>
            </div>
          </div>
        </div>

        <section className="pdp-section">
          <h2>Lot details</h2>
          <div className="pdp-breakdown">
            <div className="pdp-table-card">
              <h3>Top brands</h3>
              {topBrand && topBrand.length > 0 ? (
                <table className="pdp-table">
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
                        <td className="pdp-table__brand">{item.brand_name?.toUpperCase() || 'UNKNOWN'}</td>
                        <td>{item.item_count} ({item.item_percentage}%)</td>
                        <td>{formatRawMoney(item.sum)} ({item.percentage}%)</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="pdp-muted">No brand breakdown available.</p>
              )}
            </div>

            <div className="pdp-table-card">
              <h3>Top categories</h3>
              {topCategory && topCategory.length > 0 ? (
                <table className="pdp-table">
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
                <p className="pdp-muted">No category breakdown available.</p>
              )}
            </div>
          </div>
        </section>

        <section className="pdp-section">
          <div className="pdp-manifest-head">
            <div>
              <h2>All products in this lot</h2>
              <p className="pdp-muted">
                {inventoryMeta.total_count > 0
                  ? `${inventoryMeta.total_count} items listed`
                  : 'Itemized list for this lot'}
              </p>
            </div>
            <div className="pdp-manifest-actions">
              <button
                type="button"
                className="wl-btn wl-btn-secondary wl-btn-sm"
                onClick={handleEmailManifest}
                disabled={emailingManifest}
              >
                {emailingManifest ? 'Sending…' : 'Email Manifest'}
              </button>
              <button
                type="button"
                className="wl-btn wl-btn-primary wl-btn-sm"
                onClick={handleDownloadManifest}
                disabled={downloadingManifest}
              >
                {downloadingManifest ? 'Downloading…' : 'Download'}
              </button>
              <a
                className="wl-btn wl-btn-secondary wl-btn-sm"
                href={`https://api.whatsapp.com/send?phone=+919481359961&text=Hello%21%20Interested%20in%20lot%20${lotSummary.id}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
            </div>
          </div>

          {inventoryLoading ? (
            <div className="wl-loading-block">
              <div className="wl-spinner" />
              Loading items…
            </div>
          ) : (
            <>
              <div className="pdp-table-wrap">
                <table className="pdp-table pdp-manifest-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Description</th>
                      <th>Brand</th>
                      <th>Category</th>
                      <th>Qty</th>
                      <th>MRP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventories && inventories.length > 0 ? (
                      inventories.map((prod) => (
                        <tr key={prod.id}>
                          <td>
                            {prod.image_urls && prod.image_urls.length > 0 ? (
                              <img src={prod.image_urls[0]} alt="" className="pdp-item-thumb" loading="lazy" />
                            ) : (
                              <span className="pdp-item-thumb pdp-item-thumb--empty">—</span>
                            )}
                          </td>
                          <td className="pdp-item-desc">{prod.description}</td>
                          <td>{prod.brand}</td>
                          <td>{prod.category}</td>
                          <td>{prod.quantity}</td>
                          <td className="pdp-item-mrp">{formatRawMoney(prod.mrp)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="pdp-muted" style={{ textAlign: 'center', padding: 24 }}>
                          No product items found for this lot.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {inventoryMeta.total_pages > 1 && (
                <div className="wl-pagination">
                  <button
                    type="button"
                    disabled={inventoryPage <= 1}
                    onClick={() => setInventoryPage((p) => Math.max(1, p - 1))}
                    aria-label="Previous page"
                  >
                    ‹
                  </button>
                  <span className="wl-page-label">
                    Page {inventoryPage} of {inventoryMeta.total_pages}
                  </span>
                  <button
                    type="button"
                    disabled={inventoryPage >= inventoryMeta.total_pages}
                    onClick={() => setInventoryPage((p) => Math.min(inventoryMeta.total_pages, p + 1))}
                    aria-label="Next page"
                  >
                    ›
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <section className="pdp-section">
          <h2>Good to know</h2>
          <div className="pdp-info-grid">
            <div className="pdp-info-card">
              <h3>Condition</h3>
              <p><strong>{lotSummary.grade_name}</strong> — the stated grade applies to this lot as a whole. Individual items are listed in the manifest above.</p>
            </div>
            <div className="pdp-info-card">
              <h3>Terms of purchase</h3>
              <p>All sales are through open auction. The highest qualifying bid wins, and payment is confirmed before dispatch is arranged.</p>
            </div>
            <div className="pdp-info-card">
              <h3>Delivery</h3>
              <p>{lotSummary.lot_description || 'Delivery between 2 to 3 working days after full payment.'}</p>
            </div>
            <div className="pdp-info-card">
              <h3>Not bidding? Tell us why</h3>
              {feedbackSubmitted ? (
                <p className="pdp-feedback-thanks">Thank you for your feedback.</p>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="pdp-feedback-form">
                  <div className="pdp-feedback-options">
                    {[
                      'Lot too small',
                      'Lot too large',
                      'Logistics cost is too high',
                      'Lot mix not good',
                      'Manifest not clear',
                      'No grading details',
                      'Pricing not attractive'
                    ].map((reason) => (
                      <label key={reason} className="pdp-feedback-option">
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
                  <button type="submit" className="wl-btn wl-btn-secondary wl-btn-sm" disabled={!selectedReason}>
                    Submit Feedback
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      <a
        className="whatsapp-fab"
        href="https://api.whatsapp.com/send?phone=+919481359961&text=Hello%21%20."
        target="_blank"
        rel="noreferrer"
        aria-label="Open WhatsApp"
      >
        ☎
      </a>
    </div>
  )
}
