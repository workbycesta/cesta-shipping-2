import { useEffect, useState } from 'react'
import api from '../lib/api'
import { PageHeader, Card } from '../components/ui'

export default function Pricing() {
  const [hike, setHike] = useState(0)
  const [ranges, setRanges] = useState([])
  const [early, setEarly] = useState(1)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [rMin, setRMin] = useState('')
  const [rMax, setRMax] = useState('')
  const [rPct, setRPct] = useState('')

  const load = async () => {
    try {
      const res = await api.get('/price-config')
      setHike(res.data.priceHike ?? 0)
      setRanges(res.data.rangeHikes || [])
      setEarly(res.data.timerEarlyHours ?? 1)
    } catch { setMsg('Could not load pricing config') }
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    setBusy(true); setMsg('')
    try {
      await api.post('/admin/price-config', { priceHike: Number(hike) || 0, rangeHikes: ranges, timerEarlyHours: Number(early) || 0 })
      setMsg('Pricing saved — live on the website now')
    } catch (e) { setMsg(e?.response?.data?.message || 'Save failed') }
    finally { setBusy(false) }
  }

  const addRange = () => {
    const min = Number(rMin), max = Number(rMax), pct = Number(rPct)
    if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) { setMsg('Invalid range'); return }
    setRanges([...ranges, { min, max, percent: pct || 0 }])
    setRMin(''); setRMax(''); setRPct('')
  }

  return (
    <div>
      <PageHeader title="Pricing engine" sub="Global markup, per-range markups and timer earliness. Saved live to the server."
        actions={<button className="btn" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save all'}</button>} />
      {msg && <div className="alert ok">{msg}</div>}
      <div className="grid2">
        <Card title="Global markup" sub="Applies to prices outside all custom ranges. Rounded up to next ₹1000.">
          <label className="lbl">Default hike %</label>
          <input className="input" type="number" min="0" max="100" value={hike} onChange={(e) => setHike(e.target.value)} />
        </Card>
        <Card title="Timer earliness" sub="Website countdown shows (source time − this).">
          <label className="lbl">Hours early</label>
          <input className="input" type="number" min="0" step="0.5" value={early} onChange={(e) => setEarly(e.target.value)} />
        </Card>
      </div>
      <Card title="Custom ranges" sub="A matching range always wins, even at 0%."
        actions={<button className="btn" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save all'}</button>}>
        <div className="form-grid">
          <div><label className="lbl">Min ₹</label><input className="input" type="number" value={rMin} onChange={(e) => setRMin(e.target.value)} /></div>
          <div><label className="lbl">Max ₹</label><input className="input" type="number" value={rMax} onChange={(e) => setRMax(e.target.value)} /></div>
          <div><label className="lbl">Hike %</label><input className="input" type="number" value={rPct} onChange={(e) => setRPct(e.target.value)} /></div>
        </div>
        <button className="btn ghost sm" style={{ marginTop: 10 }} onClick={addRange}>+ Add range</button>
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table className="tbl">
            <thead><tr><th>Min</th><th>Max</th><th>Hike</th><th></th></tr></thead>
            <tbody>{ranges.map((r, i) => (
              <tr key={i}>
                <td>₹{Number(r.min).toLocaleString('en-IN')}</td>
                <td>₹{Number(r.max).toLocaleString('en-IN')}</td>
                <td>{r.percent}%</td>
                <td><button className="btn danger sm" onClick={() => setRanges(ranges.filter((_, j) => j !== i))}>Remove</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
