import { useEffect, useState } from 'react'
import api from '../lib/api'
import { fmtDateTime } from '../lib/format'
import { PageHeader, Card, Empty } from '../components/ui'

const SECTIONS = ['', 'price', 'timer', 'traders', 'admins', 'auth', 'orders']

export default function Activity() {
  const [items, setItems] = useState([])
  const [section, setSection] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/activity', { params: { limit: 100, section: section || undefined } })
      setItems(res.data.activity || [])
    } catch { setItems([]) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [section])

  return (
    <div>
      <PageHeader title="Activity log" sub="Every admin action, who did it and when."
        actions={<button className="btn ghost" onClick={load}>Refresh</button>} />
      <Card>
        <div className="tabs">
          {SECTIONS.map((s) => (
            <button key={s || 'all'} className={'tab' + (section === s ? ' active' : '')} onClick={() => setSection(s)}>
              {s || 'All'}
            </button>
          ))}
        </div>
        {loading ? <Empty title="Loading…" /> : items.length === 0 ? <Empty title="No activity" /> : (
          <div className="table-wrap"><table className="tbl">
            <thead><tr><th>Admin</th><th>Action</th><th>Detail</th><th>When</th></tr></thead>
            <tbody>{items.map((a) => (
              <tr key={a.id}>
                <td><strong>{a.username}</strong></td>
                <td><span className="pill gray">{a.action}</span></td>
                <td>{a.detail || '—'}</td>
                <td>{fmtDateTime(a.createdAt)}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </Card>
    </div>
  )
}
