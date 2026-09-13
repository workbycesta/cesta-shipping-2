import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAdmin } from './AdminContext'
import { usePrice } from './usePrice'
import './AdminOrdersDashboard.css'

function formatCountdown(totalSeconds) {
  if (totalSeconds === null || totalSeconds === undefined) return '—'
  if (totalSeconds <= 0) return '00:00:00'
  const s = Math.floor(totalSeconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function DualTimer({ timer, earlyHours }) {
  if (!timer) return <span className="timer-line timer-unknown">Timer: loading…</span>
  if (timer.reachable === false) {
    return <span className="timer-line timer-unknown">Timer: source unreachable</span>
  }
  if (timer.ended) {
    return (
      <span className="timer-line timer-ended">
        <span className="timer-ended-badge">BIDDING TIME DONE</span>
        <span className="timer-val">00:00:00</span>
      </span>
    )
  }
  return (
    <span className="timer-lines">
      <span className="timer-line timer-original" title="Exact countdown on b4traders.com">
        <span className="timer-k">Original:</span>
        <strong className="timer-val">{formatCountdown(timer.originalRemainingSec)}</strong>
      </span>
      <span className="timer-line timer-ours" title={`Our website timer, ${earlyHours}h early`}>
        <span className="timer-k">Ours (−{earlyHours}h):</span>
        <strong className="timer-val">{formatCountdown(timer.ourRemainingSec)}</strong>
      </span>
    </span>
  )
}

export default function AdminOrdersDashboard() {
  const { isAuthenticated, logout, adminHeaders, handleUnauthorized } = useAdmin()
  const { formatRawMoney, timerOffsetSeconds } = usePrice()
  const earlyHours = Number.isFinite(timerOffsetSeconds) ? timerOffsetSeconds / 3600 : 1
  const navigate = useNavigate()

  const [ordersData, setOrdersData] = useState({ totalLots: 0, totalBids: 0, orders: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedLotId, setSelectedLotId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [sourcing, setSourcing] = useState(null)
  const [sourcingLoading, setSourcingLoading] = useState(false)
  const [sourcingError, setSourcingError] = useState('')

  // Live b4 timers for every bidded lot: lotId -> { ended, originalRemainingSec, ourRemainingSec, ... }
  // Ticked down locally every second so the countdowns feel live between refreshes.
  const [timers, setTimers] = useState({})

  const [customBidder, setCustomBidder] = useState('')
  const [assignBusy, setAssignBusy] = useState(false)
  const [assignMsg, setAssignMsg] = useState('')
  const [endBusy, setEndBusy] = useState(false)

  const fetchOrders = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/orders', { headers: adminHeaders() })
      handleUnauthorized(res)
      if (!res.ok) throw new Error('Failed to fetch orders data')
      const data = await res.json()
      setOrdersData(data)
      if (data.orders && data.orders.length > 0 && !selectedLotId) {
        setSelectedLotId(data.orders[0].lotId)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchTimers = async (lotIds) => {
    if (!lotIds || lotIds.length === 0) return
    try {
      const res = await fetch(`/api/admin/lot-timers?lotIds=${encodeURIComponent(lotIds.join(','))}`, { headers: adminHeaders() })
      handleUnauthorized(res)
      if (!res.ok) return
      const data = await res.json()
      if (data && data.timers) setTimers(data.timers)
    } catch {
      // Timers are informational — never break the dashboard over them.
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  // Load timers once the order list is known, then re-poll every 60s.
  useEffect(() => {
    const ids = (ordersData.orders || []).map((o) => o.lotId)
    if (ids.length === 0) return
    fetchTimers(ids)
    const poll = setInterval(() => fetchTimers(ids), 60000)
    return () => clearInterval(poll)
  }, [(ordersData.orders || []).map((o) => o.lotId).join(',')])

  // Tick every timer down locally each second.
  useEffect(() => {
    const tick = setInterval(() => {
      setTimers((prev) => {
        const ids = Object.keys(prev)
        if (ids.length === 0) return prev
        const next = { ...prev }
        let changed = false
        for (const id of ids) {
          const t = next[id]
          if (!t || t.ended || t.manuallyEnded) continue
          const dec = (v) => (typeof v === 'number' && v > 0 ? v - 1 : v)
          const orig = dec(t.originalRemainingSec)
          const ours = dec(t.ourRemainingSec)
          if (orig !== t.originalRemainingSec || ours !== t.ourRemainingSec) {
            changed = true
            const ended = (orig !== null && orig <= 0) || (ours !== null && ours <= 0 && orig <= 0)
            next[id] = { ...t, originalRemainingSec: orig, ourRemainingSec: ours, ended: ended || t.ended }
          }
        }
        return changed ? next : prev
      })
    }, 1000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    const lotId = selectedLotId
    if (!lotId) {
      setSourcing(null)
      return
    }
    setCustomBidder('')
    setAssignMsg('')
    let cancelled = false
    const fetchSourcing = async () => {
      setSourcingLoading(true)
      setSourcingError('')
      try {
        const res = await fetch(`/api/admin/sourcing/${lotId}`, { headers: adminHeaders() })
        handleUnauthorized(res)
        if (!res.ok) throw new Error('Failed to fetch sourcing info')
        const data = await res.json()
        if (!cancelled) setSourcing(data)
      } catch (err) {
        if (!cancelled) {
          setSourcing(null)
          setSourcingError(err.message)
        }
      } finally {
        if (!cancelled) setSourcingLoading(false)
      }
    }
    fetchSourcing()
    return () => { cancelled = true }
  }, [selectedLotId])

  const assignBid = async (mode) => {
    if (!selectedOrder || assignBusy) return
    if (mode === 'custom' && !customBidder) {
      setAssignMsg('❌ Pick a bidder from the list first.')
      return
    }
    setAssignBusy(true)
    setAssignMsg('')
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.lotId}/assign`, {
        method: 'POST',
        headers: adminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(mode === 'custom' ? { mode, bidderEmail: customBidder } : { mode: 'highest' })
      })
      handleUnauthorized(res)
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to assign bid')
      setOrdersData((prev) => ({
        ...prev,
        orders: (prev.orders || []).map((o) =>
          o.lotId === selectedOrder.lotId ? { ...o, allotment: data.allotment } : o
        )
      }))
      setAssignMsg(`✅ Allotted to ${data.allotment.allottedToEmail} at ${formatRawMoney(data.allotment.allottedAmount)} (${data.allotment.mode}).`)
    } catch (err) {
      setAssignMsg(`❌ ${err.message}`)
    } finally {
      setAssignBusy(false)
    }
  }

  const endBiddingNow = async () => {
    if (!selectedOrder || endBusy) return
    if (!window.confirm(`End bidding for "${selectedOrder.lotName}" right now? The timer will go to 00:00:00 and you can assign a winner immediately.`)) return
    setEndBusy(true)
    setAssignMsg('')
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.lotId}/end-bidding`, {
        method: 'POST',
        headers: adminHeaders()
      })
      handleUnauthorized(res)
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to end bidding')
      setOrdersData((prev) => ({
        ...prev,
        orders: (prev.orders || []).map((o) =>
          o.lotId === selectedOrder.lotId ? { ...o, manuallyEnded: true, manualEnd: data.manualEnd || o.manualEnd } : o
        )
      }))
      setTimers((prev) => ({
        ...prev,
        [selectedOrder.lotId]: {
          ...(prev[selectedOrder.lotId] || {}),
          lotId: selectedOrder.lotId,
          reachable: true,
          ended: true,
          originalRemainingSec: 0,
          ourRemainingSec: 0,
          manuallyEnded: true,
          manualEnd: data.manualEnd || null
        }
      }))
      setAssignMsg('✅ Bidding ended — timer is 00:00:00, you can assign a winner now.')
    } catch (err) {
      setAssignMsg(`❌ ${err.message}`)
    } finally {
      setEndBusy(false)
    }
  }

  const reopenBidding = async () => {
    if (!selectedOrder || endBusy) return
    if (!window.confirm(`Reopen bidding for "${selectedOrder.lotName}"? The live timer will resume.`)) return
    setEndBusy(true)
    setAssignMsg('')
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.lotId}/reopen-bidding`, {
        method: 'POST',
        headers: adminHeaders()
      })
      handleUnauthorized(res)
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to reopen bidding')
      setOrdersData((prev) => ({
        ...prev,
        orders: (prev.orders || []).map((o) =>
          o.lotId === selectedOrder.lotId ? { ...o, manuallyEnded: false, manualEnd: null } : o
        )
      }))
      await fetchTimers([selectedOrder.lotId])
      setAssignMsg('↩️ Bidding reopened — live timer resumed.')
    } catch (err) {
      setAssignMsg(`❌ ${err.message}`)
    } finally {
      setEndBusy(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-orders-page">
        <div className="admin-unauth">
          <h2>Admin Login Required</h2>
          <p>Please log in to access the Orders Dashboard.</p>
          <button onClick={() => navigate('/admin/login')} className="btn-admin-login">
            Go to Admin Login
          </button>
        </div>
      </div>
    )
  }

  const filteredOrders = (ordersData.orders || []).filter((order) => {
    const term = searchTerm.toLowerCase()
    return (
      order.lotName.toLowerCase().includes(term) ||
      order.lotId.includes(term) ||
      order.winningUserEmail.toLowerCase().includes(term)
    )
  })

  const selectedOrder = (ordersData.orders || []).find((o) => o.lotId === selectedLotId) || filteredOrders[0]
  const selectedTimer = selectedOrder ? timers[selectedOrder.lotId] : null
  const manuallyEnded = !!(selectedOrder?.manuallyEnded || selectedTimer?.manuallyEnded)
  const ourTimerDone = manuallyEnded || (selectedTimer ? selectedTimer.ended || (selectedTimer.ourRemainingSec !== null && selectedTimer.ourRemainingSec <= 0) : false)

  const totalVolume = (ordersData.orders || []).reduce((acc, o) => acc + (o.currentTopBid || 0), 0)

  return (
    <div className="admin-orders-page">
      <header className="admin-nav-bar">
        <div className="admin-nav-brand">
          <h1>Admin Panel</h1>
          <span className="nav-badge">Orders Dashboard</span>
        </div>
        <div className="admin-nav-links">
          <Link to="/admin" className="admin-nav-item">⚙ Price Config</Link>
          <Link to="/admin/orders" className="admin-nav-item active">📊 Orders Dashboard</Link>
          <button
            className="admin-logout-btn"
            onClick={() => {
              logout()
              navigate('/')
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="admin-orders-main">
        {/* KPI Cards */}
        <div className="admin-kpi-grid">
          <div className="kpi-card">
            <span className="kpi-title">Bidded Lots</span>
            <strong className="kpi-value">{ordersData.totalLots || 0}</strong>
          </div>
          <div className="kpi-card">
            <span className="kpi-title">Total Bids Placed</span>
            <strong className="kpi-value">{ordersData.totalBids || 0}</strong>
          </div>
          <div className="kpi-card highlight-kpi">
            <span className="kpi-title">Total Top Bid Volume</span>
            <strong className="kpi-value">{formatRawMoney(totalVolume)}</strong>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="admin-toolbar-row">
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by lot name, ID, or bidder email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn-admin-refresh" onClick={() => { fetchOrders(); fetchTimers((ordersData.orders || []).map((o) => o.lotId)) }}>
            🔄 Refresh Live Bids
          </button>
        </div>

        {loading && <div className="admin-loading">Loading live orders and bid history...</div>}
        {error && <div className="admin-error">{error}</div>}

        {!loading && !error && (ordersData.orders || []).length === 0 && (
          <div className="admin-empty-card">
            <h3>No Bids Received Yet</h3>
            <p>Once users start placing bids on live auction products, they will appear here in real time.</p>
          </div>
        )}

        {!loading && !error && (ordersData.orders || []).length > 0 && (
          <div className="admin-orders-layout">
            {/* Left Column: List of Bidded Products */}
            <div className="orders-list-panel">
              <h3>Bidded Products ({filteredOrders.length})</h3>
              <div className="orders-scroll-list">
                {filteredOrders.map((order) => {
                  const isSelected = order.lotId === selectedLotId
                  const t = timers[order.lotId]
                  return (
                    <div
                      key={order.lotId}
                      className={`order-summary-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedLotId(order.lotId)}
                    >
                      <div className="summary-header">
                        <span className="summary-lot-id">Lot #{order.lotId}</span>
                        <span className="bids-count-pill">{order.totalBidsCount} Bids</span>
                      </div>
                      {(order.manuallyEnded || timers[order.lotId]?.manuallyEnded) && (
                        <div className="summary-ended-early">⏹ Ended early by admin</div>
                      )}
                      <h4 className="summary-title">
                        <Link
                          to={`/product_detail/${order.lotId}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {order.lotName}
                        </Link>
                      </h4>
                      <div className="summary-timer-row">
                        <DualTimer timer={t} earlyHours={earlyHours} />
                      </div>
                      <div className="summary-price-row">
                        <span>Top Bid: <strong>{formatRawMoney(order.currentTopBid)}</strong></span>
                      </div>
                      <div className="summary-winner">
                        🏆 Leader: <span>{order.winningUserEmail}</span>
                      </div>
                      {order.allotment && (
                        <div className="summary-allotted">
                          ✅ Allotted to <span>{order.allotment.allottedToEmail}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right Column: Detailed Bidders View for Selected Product */}
            <div className="order-detail-panel">
              {selectedOrder ? (
                <div className="detail-card">
                  <div className="detail-header">
                    {selectedOrder.lotImageUrl && (
                      <img src={selectedOrder.lotImageUrl} alt="lot" className="detail-lot-img" />
                    )}
                    <div className="detail-header-info">
                      <h2>
                        <Link to={`/product_detail/${selectedOrder.lotId}`} target="_blank" rel="noreferrer">
                          {selectedOrder.lotName}
                        </Link>
                      </h2>
                      <p className="detail-lot-id">Lot ID: {selectedOrder.lotId}</p>
                      <div className="detail-timers-box">
                        <DualTimer timer={selectedTimer} earlyHours={earlyHours} />
                        {manuallyEnded ? (
                          <span className="detail-timer-note">
                            Bidding ended early by admin — timer is 00:00:00, you can assign now.
                          </span>
                        ) : selectedTimer && !selectedTimer.ended && selectedTimer.ourRemainingSec !== null ? (
                          <span className="detail-timer-note">
                            {selectedTimer.ourRemainingSec > 0
                              ? 'Assign unlocks after our timer hits 00:00:00 — or end bidding now.'
                              : 'Our timer is done — you can assign now.'}
                          </span>
                        ) : null}
                        <div className="end-bidding-row">
                          {!manuallyEnded ? (
                            <button
                              type="button"
                              className="btn-end-bidding"
                              disabled={endBusy || ourTimerDone}
                              onClick={endBiddingNow}
                              title="Stop this bidding right now; the timer goes to 00:00:00 and you can assign a winner"
                            >
                              {endBusy ? 'Ending…' : '⏹ End Bidding Now'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn-reopen-bidding"
                              disabled={endBusy}
                              onClick={reopenBidding}
                              title="Resume the live timer and reopen bidding"
                            >
                              {endBusy ? 'Working…' : '↩️ Reopen Bidding'}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="detail-specs-row">
                        <span>Floor Price: <strong>{formatRawMoney(Math.ceil(Number(selectedOrder.floorPrice) / 1000 - 1e-9) * 1000)}</strong></span>
                        <span>MRP: <strong>{formatRawMoney(selectedOrder.mrp)}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="sourcing-box">
                    <div className="sourcing-link-row">
                      {sourcing?.sourceUrl || selectedOrder.lotId ? (
                        <a
                          href={sourcing?.sourceUrl || `https://www.b4traders.com/product_detail/lot/${selectedOrder.lotId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-view-original"
                        >
                          🔗 View Original on b4traders.com
                        </a>
                      ) : null}
                      <span className="sourcing-lot-caption">Lot #{selectedOrder.lotId}</span>
                    </div>

                    {sourcingLoading && <div className="sourcing-loading">Fetching live source price…</div>}

                    {!sourcingLoading && (sourcingError || (sourcing && !sourcing.success)) && (
                      <div className="sourcing-note">
                        {sourcing?.reason === 'SOURCE_ENDED'
                          ? 'Original listing ended or was removed on b4traders.'
                          : 'Live source price unavailable. Open the original link to check manually.'}
                      </div>
                    )}

                    {!sourcingLoading && sourcing?.success && (
                      <div className="sourcing-grid">
                        <div className="sourcing-tile">
                          <span className="sourcing-label">Collect from winner</span>
                          <strong>{formatRawMoney(sourcing.ourTopBid)}</strong>
                          <span className="sourcing-sub">{selectedOrder.winningUserEmail}</span>
                        </div>
                        <div className="sourcing-tile">
                          <span className="sourcing-label">Raw b4 floor (live)</span>
                          <strong>{formatRawMoney(sourcing.rawFloorPrice)}</strong>
                          <span className="sourcing-sub">Hike applied: {sourcing.appliedHikePercent}%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bid allotment: enabled only after our website timer runs out */}
                  <div className="assign-box">
                    <h3>Bid Allotment</h3>
                    {selectedOrder.allotment ? (
                      <div className="assign-done">
                        ✅ Allotted to <strong>{selectedOrder.allotment.allottedToEmail}</strong>
                        {' '}at <strong>{formatRawMoney(selectedOrder.allotment.allottedAmount)}</strong>
                        {' '}({selectedOrder.allotment.mode === 'custom' ? 'custom pick' : 'highest bidder'}
                        {selectedOrder.allotment.allottedBy ? ` · by ${selectedOrder.allotment.allottedBy}` : ''}).
                        <span className="assign-sub">Re-assigning below overwrites this.</span>
                      </div>
                    ) : (
                      <p className="assign-sub">No allotment yet. The bidder sees the result in My Account once you assign.</p>
                    )}
                    {!ourTimerDone && (
                      <p className="assign-locked">🔒 Our website timer is still running — assignment unlocks at 00:00:00.</p>
                    )}
                    <div className="assign-actions">
                      <button
                        type="button"
                        className="btn-assign-highest"
                        disabled={assignBusy || !ourTimerDone}
                        onClick={() => assignBid('highest')}
                        title={ourTimerDone ? 'Assign to the current highest bidder' : 'Available after our timer runs out'}
                      >
                        {assignBusy ? 'Assigning…' : `🏆 Assign to Highest Bidder (${selectedOrder.winningUserEmail})`}
                      </button>
                      <div className="assign-custom-row">
                        <select
                          className="assign-custom-select"
                          value={customBidder}
                          onChange={(e) => setCustomBidder(e.target.value)}
                          disabled={assignBusy || !ourTimerDone}
                          aria-label="Pick a bidder for custom assignment"
                        >
                          <option value="">— Pick a custom bidder —</option>
                          {[...new Set((selectedOrder.bidders || []).map((b) => b.userEmail))].map((email) => (
                            <option key={email} value={email}>{email}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn-assign-custom"
                          disabled={assignBusy || !ourTimerDone || !customBidder}
                          onClick={() => assignBid('custom')}
                          title={ourTimerDone ? 'Assign to the selected bidder' : 'Available after our timer runs out'}
                        >
                          {assignBusy ? 'Assigning…' : 'Assign to Custom Bidder'}
                        </button>
                      </div>
                    </div>
                    {assignMsg && <div className="assign-msg">{assignMsg}</div>}
                  </div>

                  <div className="winning-banner">
                    <div className="winning-trophy">🏆</div>
                    <div className="winning-info">
                      <span className="winning-label">Current Winning Bidder</span>
                      <strong className="winning-email">{selectedOrder.winningUserEmail}</strong>
                      <span className="winning-amount">High Bid: {formatRawMoney(selectedOrder.currentTopBid)}</span>
                    </div>
                  </div>

                  <div className="bidders-table-section">
                    <h3>All Bidders for this Product ({selectedOrder.bidders?.length || 0})</h3>
                    <div className="table-responsive">
                      <table className="bidders-table">
                        <thead>
                          <tr>
                            <th>Rank</th>
                            <th>Bidder Email</th>
                            <th>Bid Amount</th>
                            <th>Time Placed</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.bidders?.map((bidder, idx) => {
                            const isWinning = bidder.status === 'Winning'
                            const isAllotted = selectedOrder.allotment?.allottedToEmail === bidder.userEmail
                            return (
                              <tr key={bidder.id || idx} className={isWinning ? 'row-winning' : ''}>
                                <td className="rank-cell">#{idx + 1}</td>
                                <td>
                                  <strong>{bidder.userEmail}</strong>
                                  {bidder.userName && <span className="bidder-name-sub"> ({bidder.userName})</span>}
                                  {isAllotted && <span className="allotted-pill"> ✅ Allotted</span>}
                                </td>
                                <td>
                                  <strong className={isWinning ? 'win-amount' : ''}>
                                    {formatRawMoney(bidder.bidAmount)}
                                  </strong>
                                </td>
                                <td>{new Date(bidder.timestamp).toLocaleString()}</td>
                                <td>
                                  <span className={`admin-status-pill ${isWinning ? 'pill-win' : 'pill-lose'}`}>
                                    {isWinning ? '🟢 Winning' : '🔴 Losing'}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-selection-placeholder">
                  Select a product from the list to view bidder details.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
