import { useEffect, useState } from 'react'
import api from '../lib/api'
import { fmtDateTime } from '../lib/format'
import { PageHeader, Stat, Card, Empty } from '../components/ui'

export default function Traders() {
  const [traders, setTraders] = useState([])
  const [counts, setCounts] = useState(null)
  const [tab, setTab] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(null)

  const load = async () => {
    setLoading(true); setMsg('')
    try {
      const res = await api.get('/admin/traders')
      setTraders(res.data.traders || [])
      setCounts(res.data.counts || null)
    } catch { setMsg('Failed to load buyers') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const setStatus = async (id, status) => {
    setBusy(id); setMsg('')
    try {
      await api.post('/admin/traders/' + id + '/status', { status })
      setMsg('Buyer ' + status)
      load()
    } catch { setMsg('Update failed') }
    finally { setBusy(null) }
  }

  const list = traders.filter((t) => (t.status || 'pending') === tab)

  return (
    <div>
      <PageHeader title="Buyer approvals" sub="Approve or reject buyer accounts before they can sign in."
        actions={<button className="btn ghost" onClick={load}>Refresh</button>} />
      {msg && <div className="alert ok">{msg}</div>}
      <div className="stats">
        <Stat label="Pending" value={counts?.pending ?? '—'} />
        <Stat label="Approved" value={counts?.approved ?? '—'} />
        <Stat label="Rejected" value={counts?.rejected ?? '—'} />
        <Stat label="Total" value={counts?.total ?? '—'} />
      </div>
      <Card>
        <div className="tabs">
          {['pending', 'approved', 'rejected'].map((t) => (
            <button key={t} className={'tab' + (tab === t ? ' active' : '')} onClick={() => setTab(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        {loading ? <Empty title="Loading…" /> : list.length === 0 ? <Empty title={'No ' + tab + ' buyers'} /> : (
          <div className="table-wrap"><table className="tbl">
            <thead><tr><th>Buyer</th><th>Contact</th><th>Org</th><th>Joined</th><th></th></tr></thead>
            <tbody>{list.map((t) => (
              <tr key={t.id}>
                <td><strong>{t.name}</strong><div className="muted sm">{t.email}</div></td>
                <td>{t.mobile || '—'}</td>
                <td>{t.organisationName || '—'}</td>
                <td>{fmtDateTime(t.createdAt)}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn ok sm" disabled={busy === t.id} onClick={() => setStatus(t.id, 'approved')}>Approve</button>{' '}
                  <button className="btn danger sm" disabled={busy === t.id} onClick={() => setStatus(t.id, 'rejected')}>Reject</button>
                </td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </Card>
    </div>
  )
}
