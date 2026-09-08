import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUser } from './UserContext'
import { usePrice } from './usePrice'
import Header from './Header'
import './MyAccountPage.css'

function LotTimer({ endDate }) {
  const [timeLeft, setTimeLeft] = useState('')
  const [isExpired, setIsExpired] = useState(false)
  // Countdown only displayed when the lot is 1 hour or less from ending
  const [withinLastHour, setWithinLastHour] = useState(false)

  useEffect(() => {
    if (!endDate) {
      setTimeLeft('Time N/A')
      return
    }

    const targetTime = new Date(endDate).getTime()

    const updateTimer = () => {
      const now = Date.now()
      const diff = Math.floor((targetTime - now) / 1000)

      if (isNaN(targetTime) || diff <= 0) {
        setTimeLeft('0 Hr 00 Min 00 Sec')
        setIsExpired(true)
        setWithinLastHour(true)
        return
      }

      setIsExpired(false)
      setWithinLastHour(diff <= 3600)
      const h = Math.floor(diff / 3600)
      const m = Math.floor((diff % 3600) / 60)
      const s = Math.floor(diff % 60)
      const mStr = String(m).padStart(2, '0')
      const sStr = String(s).padStart(2, '0')
      setTimeLeft(`${h} Hr ${mStr} Min ${sStr} Sec`)
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [endDate])

  // More than 1 hour left: no countdown shown
  if (!withinLastHour) return null

  return (
    <div className={`lot-timer-badge ${isExpired ? 'expired' : 'active'}`}>
      <span className="timer-icon">⏳</span>
      <span className="timer-label">{isExpired ? 'Auction Ended' : 'Time Left:'}</span>
      <strong className="timer-value">{timeLeft}</strong>
    </div>
  )
}

export default function MyAccountPage() {
  const { user, openSignInModal } = useUser()
  const { formatMoney, formatRawMoney } = usePrice()
  const navigate = useNavigate()

  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchMyBids = async (showLoading = true) => {
    if (!user) return
    if (showLoading) setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/bids/my-bids?email=${encodeURIComponent(user.email)}`)
      if (!res.ok) throw new Error('Failed to fetch submitted bids')
      const data = await res.json()
      setBids(data.bids || [])
    } catch (err) {
      setError(err.message)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    fetchMyBids(true)

    // Auto refresh bids every 10 seconds to update top bids in real time
    const interval = setInterval(() => {
      fetchMyBids(false)
    }, 10000)

    return () => clearInterval(interval)
  }, [user])

  if (!user) {
    return (
      <div className="account-page">
        <Header />
        <div className="account-unauth-container">
          <h2>Sign In Required</h2>
          <p>Please sign in to view your submitted bids and account dashboard.</p>
          <button className="btn-account-signin" onClick={openSignInModal}>
            Sign In Now
          </button>
        </div>
      </div>
    )
  }

  const winningCount = bids.filter((b) => b.status === 'Winning').length
  const losingCount = bids.filter((b) => b.status === 'Losing').length

  return (
    <div className="account-page">
      <Header />

      <main className="account-main">
        <div className="account-header-card">
          <div className="user-welcome">
            <h1>My Account</h1>
            <p className="user-email-badge">Logged in as: <strong>{user.email}</strong></p>
          </div>

          <div className="account-stats-grid">
            <div className="stat-card">
              <span className="stat-num">{bids.length}</span>
              <span className="stat-label">Total Lots Bidded</span>
            </div>
            <div className="stat-card winning-stat">
              <span className="stat-num">{winningCount}</span>
              <span className="stat-label">Winning</span>
            </div>
            <div className="stat-card losing-stat">
              <span className="stat-num">{losingCount}</span>
              <span className="stat-label">Outbid / Losing</span>
            </div>
          </div>
        </div>

        <div className="account-section">
          <div className="section-title-row">
            <h2>Submitted Bids</h2>
            <button className="btn-refresh" onClick={() => fetchMyBids(true)}>
              🔄 Refresh Bids
            </button>
          </div>

          {loading && <div className="account-loading">Loading your submitted bids...</div>}
          {error && <div className="account-error">{error}</div>}

          {!loading && !error && bids.length === 0 && (
            <div className="no-bids-card">
              <h3>No Submitted Bids Yet</h3>
              <p>You haven't placed any bids on active liquidation lots yet.</p>
              <Link to="/products" className="btn-browse-lots">
                Browse Live Auctions & Bid Now
              </Link>
            </div>
          )}

          {!loading && !error && bids.length > 0 && (
            <div className="bids-grid">
              {bids.map((bid) => {
                const isWinning = bid.status === 'Winning'
                return (
                  <div key={bid.lotId} className={`bid-card ${isWinning ? 'card-winning' : 'card-losing'}`}>
                    <div className="bid-card-header">
                      <span className={`status-badge ${isWinning ? 'badge-winning' : 'badge-losing'}`}>
                        {isWinning ? '🟢 WINNING' : '🔴 OUTBID / LOSING'}
                      </span>
                      <span className="bid-time-ago">
                        Last Bid: {new Date(bid.lastBidTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="bid-card-body">
                      {bid.lotImageUrl && (
                        <img src={bid.lotImageUrl} alt={bid.lotName} className="bid-lot-thumb" />
                      )}
                      <div className="bid-lot-info">
                        <h3>{bid.lotName}</h3>
                        <p className="lot-id-sub">Lot ID: {bid.lotId}</p>
                      </div>
                    </div>

                    <div className="bid-timer-container">
                      <LotTimer endDate={bid.endDate} />
                    </div>

                    <div className="bid-amounts-row">
                      <div className="amount-block">
                        <span className="amount-label">Your Highest Bid</span>
                        <strong className="amount-val user-val">{formatMoney(bid.userHighestBid)}</strong>
                      </div>
                      <div className="amount-block">
                        <span className="amount-label">Current Top Bid</span>
                        <strong className="amount-val top-val">{formatMoney(bid.topBidAmount)}</strong>
                      </div>
                    </div>

                    <div className="bid-card-footer">
                      <Link to={`/product_detail/${bid.lotId}`} className="btn-view-product">
                        {isWinning ? 'View Lot Details →' : '⚡ Increase Bid Now →'}
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
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
        <div className="footer-contact">
          <p>📞 1800-419-0431</p>
          <p>✉ support@wholelottraders.com</p>
        </div>
      </footer>
    </div>
  )
}
