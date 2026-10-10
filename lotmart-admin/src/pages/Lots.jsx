import { useEffect, useState } from 'react'
import api from '../lib/api'
import { inr } from '../lib/format'
import { PageHeader, Stat, Card, Empty } from '../components/ui'

export default function Lots() {
  const [lots, setLots] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [f, setF] = useState({ lotName: '', lotNumber: '', description: '', floorPrice: '', mrp: '', quantity: '', gradeName: 'Used', categoryName: '', brandName: '', cityName: '', organisationImageUrl: '', imageUrls: '', startDate: '', endDate: '', status: 'active' })
  const [items, setItems] = useState([{ description: '', quantity: '', mrp: '' }])
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/custom-lots')
      setLots(res.data.lots || [])
    } catch { setMsg('Failed to load lots') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const reset = () => {
    setF({ lotName: '', lotNumber: '', description: '', floorPrice: '', mrp: '', quantity: '', gradeName: 'Used', categoryName: '', brandName: '', cityName: '', organisationImageUrl: '', imageUrls: '', startDate: '', endDate: '', status: 'active' })
    setItems([{ description: '', quantity: '', mrp: '' }]); setEditId(null)
  }
  const startEdit = (l) => {
    setF({
      lotName: l.lotName || '', lotNumber: l.lotNumber || '', description: l.description || '',
      floorPrice: l.floorPrice ?? '', mrp: l.mrp ?? '', quantity: l.quantity ?? '',
      gradeName: l.gradeName || 'Used', categoryName: l.categoryName || '', brandName: l.brandName || '',
      cityName: l.cityName || '', organisationImageUrl: l.organisationImageUrl || '',
      imageUrls: (l.imageUrls || []).join('\n'),
      startDate: l.startDate ? String(l.startDate).slice(0, 16) : '',
      endDate: l.endDate ? String(l.endDate).slice(0, 16) : '',
      status: l.status || 'active',
    })
    setItems((l.manifestItems?.length ? l.manifestItems : [{ description: '', quantity: '', mrp: '' }])
      .map((it) => ({ description: it.description || '', quantity: it.quantity ?? '', mrp: it.mrp ?? '' })))
    setEditId(l.lotId)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const save = async (e) => {
    e.preventDefault()
    if (!f.lotName.trim()) { setMsg('Lot name required'); return }
    setSaving(true); setMsg('')
    const payload = {
      lotName: f.lotName.trim(), lotNumber: f.lotNumber.trim(), description: f.description,
      floorPrice: Number(f.floorPrice) || 0, mrp: Number(f.mrp) || 0, quantity: Number(f.quantity) || 0,
      gradeName: f.gradeName || 'Used', categoryName: f.categoryName, brandName: f.brandName,
      cityName: f.cityName, organisationImageUrl: f.organisationImageUrl,
      imageUrls: String(f.imageUrls || '').split('\n').map((s) => s.trim()).filter(Boolean),
      manifestItems: items.filter((it) => String(it.description || '').trim()).map((it) => ({
        description: String(it.description).trim(), quantity: Number(it.quantity) || 0, mrp: Number(it.mrp) || 0,
      })),
      startDate: f.startDate ? new Date(f.startDate).toISOString() : null,
      endDate: f.endDate ? new Date(f.endDate).toISOString() : null,
      status: f.status,
    }
    try {
      if (editId) await api.put('/admin/custom-lots/' + editId, payload)
      else await api.post('/admin/custom-lots', payload)
      setMsg(editId ? 'Updated' : 'Created')
      reset(); load()
    } catch (er) { setMsg(er?.response?.data?.message || 'Save failed') }
    finally { setSaving(false) }
  }

  const remove = async (id) => {
    if (!confirm('Delete this lot?')) return
    try { await api.delete('/admin/custom-lots/' + id); load() }
    catch { setMsg('Delete failed') }
  }

  return (
    <div>
      <PageHeader title="Lotmart Direct lots" sub="Own inventory shown on /products when active."
        actions={<button className="btn ghost" onClick={load}>Refresh</button>} />
      {msg && <div className="alert ok">{msg}</div>}
      <div className="stats">
        <Stat label="Total" value={lots.length} />
        <Stat label="Active" value={lots.filter((l) => l.status === 'active').length} />
        <Stat label="Hidden" value={lots.filter((l) => l.status !== 'active').length} />
      </div>
      <Card title={editId ? 'Edit lot' : 'Add lot'} actions={editId && <button className="btn ghost sm" onClick={reset}>Cancel</button>}>
        <form onSubmit={save}>
          <div className="form-grid">
            <div><label className="lbl">Name *</label><input className="input" value={f.lotName} onChange={(e) => set('lotName', e.target.value)} /></div>
            <div><label className="lbl">Number</label><input className="input" value={f.lotNumber} onChange={(e) => set('lotNumber', e.target.value)} /></div>
            <div><label className="lbl">Floor</label><input className="input" type="number" value={f.floorPrice} onChange={(e) => set('floorPrice', e.target.value)} /></div>
            <div><label className="lbl">MRP</label><input className="input" type="number" value={f.mrp} onChange={(e) => set('mrp', e.target.value)} /></div>
            <div><label className="lbl">Qty</label><input className="input" type="number" value={f.quantity} onChange={(e) => set('quantity', e.target.value)} /></div>
            <div><label className="lbl">City</label><input className="input" value={f.cityName} onChange={(e) => set('cityName', e.target.value)} /></div>
            <div><label className="lbl">Grade</label><input className="input" value={f.gradeName} onChange={(e) => set('gradeName', e.target.value)} /></div>
            <div><label className="lbl">Category</label><input className="input" value={f.categoryName} onChange={(e) => set('categoryName', e.target.value)} /></div>
            <div><label className="lbl">Brand</label><input className="input" value={f.brandName} onChange={(e) => set('brandName', e.target.value)} /></div>
            <div><label className="lbl">Status</label><select className="input" value={f.status} onChange={(e) => set('status', e.target.value)}><option value="active">Active</option><option value="inactive">Hidden</option></select></div>
            <div><label className="lbl">Start</label><input className="input" type="datetime-local" value={f.startDate} onChange={(e) => set('startDate', e.target.value)} /></div>
            <div><label className="lbl">End</label><input className="input" type="datetime-local" value={f.endDate} onChange={(e) => set('endDate', e.target.value)} /></div>
          </div>
          <div style={{ marginTop: 10 }}><label className="lbl">Description</label><textarea className="input" rows={2} value={f.description} onChange={(e) => set('description', e.target.value)} /></div>
          <div className="grid2" style={{ marginTop: 10 }}>
            <div><label className="lbl">Image URLs (one per line)</label><textarea className="input" rows={3} value={f.imageUrls} onChange={(e) => set('imageUrls', e.target.value)} /></div>
            <div><label className="lbl">Org logo URL</label><input className="input" value={f.organisationImageUrl} onChange={(e) => set('organisationImageUrl', e.target.value)} /></div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label className="lbl">Manifest items</label>
            {items.map((it, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input className="input" placeholder="Product" value={it.description} onChange={(e) => setItems((p) => p.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} />
                <input className="input" style={{ maxWidth: 90 }} type="number" placeholder="Qty" value={it.quantity} onChange={(e) => setItems((p) => p.map((x, j) => j === i ? { ...x, quantity: e.target.value } : x))} />
                <input className="input" style={{ maxWidth: 130 }} type="number" placeholder="MRP" value={it.mrp} onChange={(e) => setItems((p) => p.map((x, j) => j === i ? { ...x, mrp: e.target.value } : x))} />
                <button type="button" className="btn ghost sm" onClick={() => setItems((p) => p.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
            <button type="button" className="btn ghost sm" onClick={() => setItems((p) => [...p, { description: '', quantity: '', mrp: '' }])}>+ Add item</button>
          </div>
          <button className="btn" style={{ marginTop: 12 }} disabled={saving}>{saving ? 'Saving…' : editId ? 'Update' : 'Add lot'}</button>
        </form>
      </Card>
      <Card title={'All lots (' + lots.length + ')'}>
        {loading ? <Empty title="Loading…" /> : lots.length === 0 ? <Empty title="No lots yet" /> : (
          <div className="table-wrap"><table className="tbl">
            <thead><tr><th>Lot</th><th>Pricing</th><th>Status</th><th></th></tr></thead>
            <tbody>{lots.map((l) => (
              <tr key={l.lotId}>
                <td><strong>{l.lotName}</strong><div className="muted sm">{l.lotNumber}</div></td>
                <td>{inr(l.floorPrice)}<div className="muted sm">{inr(l.mrp)} · qty {l.quantity}</div></td>
                <td>{l.status === 'active' ? <span className="pill green">Active</span> : <span className="pill gray">Hidden</span>}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn ghost sm" onClick={() => startEdit(l)}>Edit</button>{' '}
                  <button className="btn danger sm" onClick={() => remove(l.lotId)}>Delete</button>
                </td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </Card>
    </div>
  )
}
