import { useEffect, useMemo, useState } from 'react'
import api from '../lib/api'
import { inr, fmtDateTime, formatCountdown } from '../lib/format'
import { PageHeader, Stat, Card, Empty } from '../components/ui'

export default function Orders() {
  const [data, setData] = useState({ totalLots: 0, totalBids: 0, orders: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sel, setSel] = useState(null)
  const [timers, setTimers] = useState({})
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [src, setSrc] = useState(null)
  const [srcLoading, setSrcLoading] = useState(false)
  const [mail, setMail] = useState('')
  const [customBidder, setCustomBidder] = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true); setError('')
    try {
      const res = await api.get('/admin/orders')
      setData(res.data)
      if (!sel && res.data.orders?.length) setSel(res.data.orders[0].lotId)
    } catch (e) { setError('Failed to load orders') }
    finally { setLoading(false) }
  }
  const list = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return data.orders || []
    return (data.orders || []).filter((o) =>
      [o.lotName, o.lotId, o.winningUserEmail].join(' ').toLowerCase().includes(q))
  }, [data, search])

  const cur = (data.orders || []).find((o) => String(o.lotId) === String(sel))
  const timer = sel ? timers[sel] : null

  useEffect(() => {
    if (!data.orders?.length) return
    const ids = data.orders.slice(0, 60).map((o) => o.lotId).join(',')
    api.get('/admin/lot-timers', { params: { lotIds: ids } })
      .then((r) => setTimers(r.data.timers || {})).catch(() => {})
  }, [data])

  useEffect(() => {
    const t = setInterval(() => {
      setTimers((prev) => {
        const n = { ...prev }
        for (const k of Object.keys(n)) {
          const v = n[k]
          if (v && !v.ended) {
            n[k] = { ...v,
              originalRemainingSec: v.originalRemainingSec != null ? Math.max(0, v.originalRemainingSec - 1) : null,
              ourRemainingSec: v.ourRemainingSec != null ? Math.max(0, v.ourRemainingSec - 1) : null }
          }
        }
        return n
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!sel) { setSrc(null); return }
    setCustomBidder(''); setMail('')
    let off = false
    const run = async () => {
      setSrcLoading(true)
      try {
        const r = await api.get('/admin/sourcing/' + sel)
        if (!off) setSrc(r.data)
      } catch { if (!off) setSrc(null) }
      finally { if (!off) setSrcLoading(false) }
    }
    run()
    return () => { off = true }
  }, [sel])

  const act = async (path, body) => {
    setBusy(true); setMsg('')
    try { await api.post(path, body || {}); setMsg('Done'); await load() }
    catch (e) { setMsg(e?.response?.data?.message || 'Failed') }
    finally { setBusy(false) }
  }

  const ourDone = timer
    ? (timer.ended || (timer.ourRemainingSec ?? 1) <= 0)
    : !!cur?.manuallyEnded

  const assign = (mode, email) => {
    if (mode === 'custom' && !email) { setMsg('Pick a bidder first'); return }
    act(`/admin/orders/${sel}/assign`, mode === 'custom' ? { mode, bidderEmail: email } : { mode: 'highest' })
  }

  const dlManifest = async () => {
    setBusy(true); setMsg('')
    try {
      const r = await api.get('/manifest/' + sel, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([r.data]))
      const a = document.createElement('a')
      a.href = url; a.download = 'manifest-' + sel + '.xlsx'; a.click()
      URL.revokeObjectURL(url); setMsg('Manifest downloaded')
    } catch { setMsg('Manifest download failed') }
    finally { setBusy(false) }
  }

  const mailManifest = async () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) { setMsg('Enter a valid email'); return }
    setBusy(true); setMsg('')
    try {
      const r = await api.post('/manifest/' + sel + '/email', { email: mail })
      setMsg(r.data?.message || 'Manifest emailed')
    } catch (e) { setMsg(e?.response?.data?.message || 'Email failed') }
    finally { setBusy(false) }
  }

  return (
    <div>
      <PageHeader title="Orders & live bidding" sub="Bidded lots, timers, bidders and winner assignment."
        actions={<button className="btn ghost" onClick={load}>Refresh</button>} />
      {error && <div className="alert error">{error}</div>}
      {msg && <div className="alert ok">{msg}</div>}
      <div className="stats">
        <Stat label="Bidded lots" value={data.totalLots} />
        <Stat label="Total bids" value={data.totalBids} />
        <Stat label="Allotted" value={(data.orders || []).filter((o) => o.allotment).length} />
        <Stat label="Open" value={(data.orders || []).filter((o) => !o.allotment).length} />
      </div>
      <Card title="Search">
        <input className="input" placeholder="Lot name, id or bidder…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </Card>

      {loading ? <Card><Empty title="Loading orders…" /></Card> : (
        <div className="split">
          <Card title={'Lots (' + list.length + ')'}>
            {list.length === 0 ? <Empty title="No bids yet" /> : list.map((o) => (
              <div key={o.lotId} className={'list-item' + (String(sel) === String(o.lotId) ? ' active' : '')} onClick={() => setSel(o.lotId)}>
                <strong>{o.lotName}</strong>
                <div className="muted sm">{o.totalBidsCount} bids · top {inr(o.currentTopBid)}</div>
                <div className="muted sm">{o.winningUserEmail}</div>
                <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                  {o.allotment ? <span className="pill green">Allotted</span> : <span className="pill amber">Open</span>}
                  {o.manuallyEnded && <span className="pill red">Ended</span>}
                </div>
              </div>
            ))}
          </Card>



          <div>
            {!cur ? <Card><Empty title="Select a lot" /></Card> : (
              <>
                <Card title={cur.lotName} sub={cur.lotId + ' · floor ' + inr(cur.floorPrice) + ' · MRP ' + inr(cur.mrp)}>
                  <div className="grid2">
                    <div>
                      <label className="lbl">Our timer</label>
                      <div style={{ fontSize: 26, fontWeight: 800 }}>{timer ? formatCountdown(timer.ourRemainingSec) : '…'}</div>
                      <div className="muted sm">Source: {timer ? formatCountdown(timer.originalRemainingSec) : '…'}</div>
                      <div className="muted sm" style={{ marginTop: 6 }}>
                        <a href={src?.sourceUrl || ('https://www.b4traders.com/product_detail/lot/' + cur.lotId)} target="_blank" rel="noreferrer">View original ↗</a>
                      </div>
                    </div>
                    <div>
                      <label className="lbl">Top bidder</label>
                      <div><strong>{cur.winningUserEmail}</strong></div>
                      <div className="muted sm">{inr(cur.currentTopBid)} · {cur.totalBidsCount} bids</div>
                      {cur.allotment && <div style={{ marginTop: 6 }}><span className="pill green">→ {cur.allotment.allottedToEmail} @ {inr(cur.allotment.allottedAmount)}</span></div>}
                    </div>
                  </div>
                  {srcLoading ? <div className="muted sm" style={{ marginTop: 10 }}>Fetching live source price…</div>
                    : src?.success ? (
                      <div className="stats" style={{ marginTop: 12 }}>
                        <Stat label="Collect from winner" value={inr(src.ourTopBid)} />
                        <Stat label="B4 live bid" value={src.sourceLiveBid != null ? inr(src.sourceLiveBid) : '—'} />
                        <Stat label="Suggested source bid" value={inr(src.suggestedSourceBid)} />
                        <Stat label="Expected profit" value={inr(src.expectedProfit)} />
                      </div>
                    ) : <div className="muted sm" style={{ marginTop: 10 }}>Live source unavailable — open original link.</div>}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                    {!cur.manuallyEnded
                      ? <button className="btn danger sm" disabled={busy} onClick={() => { if (confirm('End bidding now?')) act('/admin/orders/' + cur.lotId + '/end-bidding') }}>End bidding</button>
                      : <button className="btn ghost sm" disabled={busy} onClick={() => { if (confirm('Reopen bidding?')) act('/admin/orders/' + cur.lotId + '/reopen-bidding') }}>Reopen</button>}
                    <button className="btn ok sm" disabled={busy || !ourDone} title={ourDone ? 'Assign highest' : 'Unlocks at 00:00:00'} onClick={() => assign('highest')}>Assign highest</button>
                  </div>
                  {!ourDone && <div className="muted sm" style={{ marginTop: 8 }}>🔒 Assignment unlocks when our timer hits 00:00:00.</div>}
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    <select className="input" style={{ maxWidth: 260 }} value={customBidder} onChange={(e) => setCustomBidder(e.target.value)} disabled={busy || !ourDone}>
                      <option value="">— Custom bidder —</option>
                      {[...new Set((cur.bidders || []).map((b) => b.userEmail))].map((em) => <option key={em} value={em}>{em}</option>)}
                    </select>
                    <button className="btn ghost sm" disabled={busy || !ourDone || !customBidder} onClick={() => assign('custom', customBidder)}>Assign custom</button>
                  </div>
                </Card>
                <Card title="Manifest (with markup)" sub="Download or email the Excel">
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn sm" disabled={busy} onClick={dlManifest}>Download manifest</button>
                    <input className="input" style={{ maxWidth: 240 }} placeholder="email@buyer.com" value={mail} onChange={(e) => setMail(e.target.value)} />
                    <button className="btn ghost sm" disabled={busy} onClick={mailManifest}>Email manifest</button>
                  </div>
                </Card>
                <Card title={'Bidders (' + (cur.bidders?.length || 0) + ')'}>
                  <div className="table-wrap"><table className="tbl">
                    <thead><tr><th>#</th><th>Bidder</th><th>Amount</th><th>Time</th><th>Status</th></tr></thead>
                    <tbody>{(cur.bidders || []).map((b, i) => (
                      <tr key={b.id || i}>
                        <td>#{i + 1}</td>
                        <td><strong>{b.userEmail}</strong><div className="muted sm">{b.userName}</div></td>
                        <td><strong>{inr(b.bidAmount)}</strong></td>
                        <td>{fmtDateTime(b.timestamp)}</td>
                        <td>{b.status === 'Winning' ? <span className="pill green">Winning</span> : <span className="pill gray">Losing</span>}</td>
                      </tr>
                    ))}</tbody>
                  </table></div>
                </Card>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
