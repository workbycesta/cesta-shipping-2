import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from './UserContext'
import { usePrice } from './usePrice'
import SiteHeader, { SiteFooter } from './SiteChrome'
import './theme.css'
import './Account.css'

function LotTimer({ endDate }) {
  const [timeLeft, setTimeLeft] = useState('')
  const [isExpired, setIsExpired] = useState(false)
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
        setTimeLeft('Ended')
        setIsExpired(true)
        setWithinLastHour(true)
        return
      }

      setIsExpired(false)
      setWithinLastHour(diff <= 3600)
      const h = Math.floor(diff / 3600)
      const m = Math.floor((diff % 3600) / 60)
      const s = Math.floor(diff % 60)
      setTimeLeft(`${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`)
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [endDate])

  if (!withinLastHour) return null

  return (
    <div className={`acct-timer ${isExpired ? 'expired' : ''}`}>
      {isExpired ? 'Auction ended' : `Ends in ${timeLeft}`}
    </div>
  )
}

const TABS = [
  { id: 'all', label: 'All Bids' },
  { id: 'winning', label: 'Winning' },
  { id: 'outbid', label: 'Outbid' },
  { id: 'allotted', label: 'Allotted' }
]

export default function MyAccountPage() {
  const { user, openSignInModal } = useUser()
  const { formatRawMoney } = usePrice()

  const [bids, setBids] = useState([])
  const [allotments, setAllotments] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('all')

  const fetchAllotments = async (email) => {
    if (!email) return
    try {
      const res = await fetch(`/api/users/allotments?email=${encodeURIComponent(email)}`)
      if (!res.ok) return
      const data = await res.json()
      const map = {}
      for (const a of data.allotments || []) map[a.lotId] = a
      setAllotments(map)
    } catch (err) {
      console.error('Error fetching allotment status:', err)
    }
  }

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
    fetchAllotments(user.email)

    const interval = setInterval(() => {
      fetchMyBids(false)
      fetchAllotments(user.email)
    }, 10000)

    return () => clearInterval(interval)
  }, [user])

  const enriched = useMemo(() => bids.map((bid) => {
    const info = allotments[bid.lotId]
    const allotted = !!info?.allotment
    const allottedToMe = !!info?.allottedToMe
    const isWinning = bid.status === 'Winning'
    return { bid, info, allotted, allottedToMe, isWinning }
  }), [bids, allotments])

  const counts = useMemo(() => ({
    all: enriched.length,
    winning: enriched.filter((e) => e.isWinning && !e.allotted).length,
    outbid: enriched.filter((e) => !e.isWinning && !e.allotted).length,
    allotted: enriched.filter((e) => e.allottedToMe).length
  }), [enriched])

  const visible = useMemo(() => {
    if (tab === 'winning') return enriched.filter((e) => e.isWinning && !e.allotted)
    if (tab === 'outbid') return enriched.filter((e) => !e.isWinning && !e.allotted)
    if (tab === 'allotted') return enriched.filter((e) => e.allottedToMe)
    return enriched
  }, [enriched, tab])

  if (!user) {
    return (
      <div className="wl-page">
        <SiteHeader />
        <main className="wl-main">
          <div className="wl-empty" style={{ marginTop: 40 }}>
            <h3>Sign in to view your account</h3>
            <p>Your submitted bids, winning lots, and allotments live here.</p>
            <div className="wl-empty-actions">
              <button type="button" className="wl-btn wl-btn-primary" onClick={openSignInModal}>
                Sign In
              </button>
              <Link to="/signup" className="wl-btn wl-btn-secondary">
                Create an Account
              </Link>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="wl-page">
      <SiteHeader />

      <main className="wl-main">
        <nav className="wl-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="wl-crumb-sep">/</span>
          <span className="wl-crumb-current">My Account</span>
        </nav>

        <div className="acct-head">
          <div>
            <h1>My Account</h1>
            <p className="wl-sub">Signed in as <strong>{user.email}</strong></p>
          </div>
          <button type="button" className="wl-btn wl-btn-secondary wl-btn-sm" onClick={() => fetchMyBids(true)}>
            Refresh
          </button>
        </div>

        <div className="acct-stats">
          <div className="acct-stat">
            <strong>{bids.length}</strong>
            <span>Total bids</span>
          </div>
          <div className="acct-stat acct-stat--good">
            <strong>{counts.winning}</strong>
            <span>Winning</span>
          </div>
          <div className="acct-stat acct-stat--bad">
            <strong>{counts.outbid}</strong>
            <span>Outbid</span>
          </div>
          <div className="acct-stat acct-stat--info">
            <strong>{counts.allotted}</strong>
            <span>Allotted to you</span>
          </div>
        </div>

        {error && <div className="wl-notice wl-notice-error">{error}</div>}

        {loading ? (
          <div className="wl-loading-block">
            <div className="wl-spinner" />
            Loading your bids…
          </div>
        ) : bids.length === 0 && !error ? (
          <div className="wl-empty">
            <h3>No bids yet</h3>
            <p>You have not placed any bids. Browse the live auctions and place your first bid.</p>
            <div className="wl-empty-actions">
              <Link to="/products" className="wl-btn wl-btn-primary">
                Browse Live Auctions
              </Link>
              <Link to="/marketplaces" className="wl-btn wl-btn-secondary">
                Browse Marketplaces
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="acct-tabs" role="tablist" aria-label="Filter bids by status">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  className={`acct-tab ${tab === t.id ? 'active' : ''}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                  <span className="acct-tab__count">{counts[t.id]}</span>
                </button>
              ))}
            </div>

            {visible.length === 0 ? (
              <div className="wl-empty">
                <h3>Nothing here</h3>
                <p>No bids in this status yet.</p>
              </div>
            ) : (
              <div className="acct-grid">
                {visible.map(({ bid, info, allotted, allottedToMe, isWinning }) => {
                  const timerDone = !!info?.ourTimerEnded || !!info?.manuallyEnded
                  return (
                    <div key={bid.lotId} className="acct-card">
                      <div className="acct-card__top">
                        {allotted ? (
                          allottedToMe
                            ? <span className="wl-badge wl-badge-success">Allotted to you</span>
                            : <span className="wl-badge">Allotted to another bidder</span>
                        ) : (
                          isWinning
                            ? <span className="wl-badge wl-badge-success">Winning</span>
                            : <span className="wl-badge wl-badge-danger">Outbid</span>
                        )}
                        <span className="acct-card__time">
                          Last bid {new Date(bid.lastBidTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="acct-card__body">
                        {bid.lotImageUrl && (
                          <img src={bid.lotImageUrl} alt="" className="acct-card__thumb" loading="lazy" />
                        )}
                        <div>
                          <h3>{bid.lotName}</h3>
                          <p className="acct-card__lotid">Lot ID: {bid.lotId}</p>
                        </div>
                      </div>

                      <LotTimer endDate={bid.endDate} />

                      {!allotted && timerDone && (
                        <p className="acct-card__note">Bidding ended — allotment pending, check back soon.</p>
                      )}

                      <div className="acct-card__amounts">
                        <div>
                          <span>Your highest bid</span>
                          <strong>{formatRawMoney(bid.userHighestBid)}</strong>
                        </div>
                        <div>
                          <span>Current top bid</span>
                          <strong>{formatRawMoney(bid.topBidAmount)}</strong>
                        </div>
                      </div>

                      <Link to={`/product_detail/${bid.lotId}`} className="wl-btn wl-btn-secondary wl-btn-block wl-btn-sm">
                        {allottedToMe ? 'View Allotted Lot →' : isWinning ? 'View Lot →' : 'Increase Bid →'}
                      </Link>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
