import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { inr, fmtDateTime } from '../lib/format'
import { PageHeader, Stat, Card, Empty } from '../components/ui'

export default function Dashboard() {
  const [orders, setOrders] = useState({ totalLots: 0, totalBids: 0, orders: [] })
  const [traders, setTraders] = useState(null)
  const [lots, setLots] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [o, t, l, a] = await Promise.all([
          api.get('/admin/orders').then((r) => r.data).catch(() => null),
          api.get('/admin/traders').then((r) => r.data).catch(() => null),
          api.get('/admin/custom-lots').then((r) => r.data).catch(() => null),
          api.get('/admin/activity', { params: { limit: 8 } }).then((r) => r.data).catch(() => null),
        ])
        if (o) setOrders(o)
        if (t) setTraders(t)
        if (l) setLots(l.lots || [])
        if (a) setActivity(a.activity || [])
      } catch (e) {
        setError(e?.response?.data?.message || 'Could not load dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const topOrders = [...(orders.orders || [])].sort((a, b) => (b.currentTopBid || 0) - (a.currentTopBid || 0)).slice(0, 5)
  const gmv = (orders.orders || []).reduce((s, o) => s + (Number(o.currentTopBid) || 0), 0)

  return (
    <div>
      <PageHeader
        title="Good day 👋 — here's the marketplace pulse"
        sub="Track bidding demand, live lots, buyer approvals and revenue at a glance."
        actions={<Link className="btn" to="/orders">Open Orders</Link>}
      />
      {error && <div className="alert error">{error}</div>}
      <div className="stats">
        <Stat label="Bidded lots" value={loading ? '…' : orders.totalLots} hint={`${orders.totalBids || 0} total bids`} />
        <Stat label="Bid GMV (top bids)" value={loading ? '…' : inr(gmv)} hint="Sum of current top bid per lot" />
        <Stat label="Pending buyers" value={loading ? '…' : traders?.counts?.pending ?? '—'} hint={`${traders?.counts?.total ?? 0} total buyers`} />
        <Stat label="Direct lots live" value={loading ? '…' : lots.filter((l) => l.status === 'active').length} hint={`${lots.length} total direct lots`} />
      </div>
      <div className="grid2">
        <Card
          title="Hottest lots right now"
          sub="Top 5 lots by current highest bid"
          actions={<Link className="btn ghost sm" to="/orders">View all</Link>}
        >
          {topOrders.length === 0 ? <Empty title="No bids yet" sub="Bids will show up here as buyers bid." /> : (
            <div className="table-wrap">
              <table className="tbl">
                <thead><tr><th>Lot</th><th>Bids</th><th>Top bid</th><th>Winner</th></tr></thead>
                <tbody>
                  {topOrders.map((o) => (
                    <tr key={o.lotId}>
                      <td><strong>{o.lotName}</strong><div className="muted sm">{o.lotId}</div></td>
                      <td>{o.totalBidsCount}</td>
                      <td><strong>{inr(o.currentTopBid)}</strong></td>
                      <td>{o.winningUserEmail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <Card
          title="Latest admin activity"
          sub="Who changed what, and when"
          actions={<Link className="btn ghost sm" to="/activity">View log</Link>}
        >
          {activity.length === 0 ? <Empty title="No activity yet" /> : activity.map((a) => (
            <div key={a.id} className="list-item" style={{ cursor: 'default' }}>
              <strong>{a.username}</strong> <span className="pill gray">{a.action}</span>
              <div className="muted sm">{a.detail || a.section || ''}</div>
              <div className="muted sm">{fmtDateTime(a.createdAt)}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
