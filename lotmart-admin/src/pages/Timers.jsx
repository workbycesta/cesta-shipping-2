import { useEffect, useState } from 'react'
import api from '../lib/api'
import { formatCountdown } from '../lib/format'
import { PageHeader, Card, Empty } from '../components/ui'

export default function Timers() {
  const [ids, setIds] = useState('')
  const [timers, setTimers] = useState({})
  const [early, setEarly] = useState(1)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const load = async () => {
    const list = ids.split(',').map((s) => s.trim()).filter(Boolean)
    if (!list.length) { setMsg('Enter at least one lot id'); return }
    setLoading(true); setMsg('')
    try {
      const res = await api.get('/admin/lot-timers', { params: { lotIds: list.join(',') } })
      setTimers(res.data.timers || {})
      setEarly(res.data.timerEarlyHours ?? 1)
    } catch { setMsg('Failed to load timers') }
    finally { setLoading(false) }
  }
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

  const rows = Object.values(timers)

  return (
    <div>
      <PageHeader title="Live timers" sub={'Source countdown vs ours (−' + early + 'h). Ticks live every second.'}
        actions={<button className="btn" onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Check timers'}</button>} />
      {msg && <div className="alert ok">{msg}</div>}
      <Card title="Lot ids" sub="Comma separated, up to 200 at once">
        <input className="input" placeholder="e.g. 12345, 67890, custom-abc" value={ids} onChange={(e) => setIds(e.target.value)} />
      </Card>
      <Card title={'Results (' + rows.length + ')'}>
        {rows.length === 0 ? <Empty title="No timers yet" sub="Enter lot ids above and hit Check timers." /> : (
          <div className="table-wrap"><table className="tbl">
            <thead><tr><th>Lot</th><th>Source</th><th>Ours</th><th>State</th></tr></thead>
            <tbody>{rows.map((t) => (
              <tr key={t.lotId}>
                <td><strong>{t.lotId}</strong></td>
                <td>{formatCountdown(t.originalRemainingSec)}</td>
                <td><strong>{formatCountdown(t.ourRemainingSec)}</strong></td>
                <td>
                  {t.ended ? <span className="pill red">Ended</span>
                    : t.reachable === false ? <span className="pill gray">Unreachable</span>
                    : <span className="pill green">Live</span>}
                  {t.manuallyEnded && <span className="pill amber"> Manual</span>}
                </td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </Card>
    </div>
  )
}
