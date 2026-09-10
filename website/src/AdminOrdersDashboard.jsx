import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAdmin } from './AdminContext'
import { usePrice } from './usePrice'
import './AdminOrdersDashboard.css'

export default function AdminOrdersDashboard() {
  const { isAuthenticated, logout } = useAdmin()
  const { formatMoney, formatRawMoney } = usePrice()
  const navigate = useNavigate()

  const [ordersData, setOrdersData] = useState({ totalLots: 0, totalBids: 0, orders: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedLotId, setSelectedLotId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchOrders = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/orders')
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

  useEffect(() => {
    fetchOrders()
  }, [])

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
            <strong className="kpi-value">{formatMoney(totalVolume)}</strong>
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
          <button className="btn-admin-refresh" onClick={fetchOrders}>
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
                      <h4 className="summary-title">{order.lotName}</h4>
                      <div className="summary-price-row">
                        <span>Top Bid: <strong>{formatRawMoney(order.currentTopBid)}</strong></span>
                      </div>
                      <div className="summary-winner">
                        🏆 Leader: <span>{order.winningUserEmail}</span>
                      </div>
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
                      <h2>{selectedOrder.lotName}</h2>
                      <p className="detail-lot-id">Lot ID: {selectedOrder.lotId}</p>
                      <div className="detail-specs-row">
                        <span>Floor Price: <strong>{formatMoney(selectedOrder.floorPrice)}</strong></span>
                        <span>MRP: <strong>{formatRawMoney(selectedOrder.mrp)}</strong></span>
                      </div>
                    </div>
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
                            return (
                              <tr key={bidder.id || idx} className={isWinning ? 'row-winning' : ''}>
                                <td className="rank-cell">#{idx + 1}</td>
                                <td>
                                  <strong>{bidder.userEmail}</strong>
                                  {bidder.userName && <span className="bidder-name-sub"> ({bidder.userName})</span>}
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
