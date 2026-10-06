import { useEffect, useState } from 'react'
import { useAdmin } from './AdminContext'

const EMPTY_FORM = {
  lotName: '', lotNumber: '', description: '', floorPrice: '', mrp: '',
  quantity: '', gradeName: 'Used', categoryName: '', brandName: '',
  cityName: '', marketplaceName: 'Lotmart Direct', imageUrlsText: '',
  manifestText: '', startDate: '', endDate: '', status: 'active'
}

function toForm(lot) {
  if (!lot) return { ...EMPTY_FORM }
  const fmtDate = (v) => {
    if (!v) return ''
    const d = new Date(v)
    if (isNaN(d.getTime())) return ''
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  return {
    lotName: lot.lotName || '',
    lotNumber: lot.lotNumber || '',
    description: lot.description || '',
    floorPrice: lot.floorPrice ?? '',
    mrp: lot.mrp ?? '',
    quantity: lot.quantity ?? '',
    gradeName: lot.gradeName || 'Used',
    categoryName: lot.categoryName || '',
    brandName: lot.brandName || '',
    cityName: lot.cityName || '',
    marketplaceName: lot.marketplaceName || 'Lotmart Direct',
    imageUrlsText: (lot.imageUrls || []).join('\n'),
    manifestText: (lot.manifestItems || []).map((it) => `${it.description} | ${it.quantity ?? ''} | ${it.mrp ?? ''}`).join('\n'),
    startDate: fmtDate(lot.startDate),
    endDate: fmtDate(lot.endDate),
    status: lot.status || 'active'
  }
}

function parseManifest(text) {
  return String(text || '').split('\n').map((l) => l.trim()).filter(Boolean).map((line) => {
    const p = line.split('|').map((x) => x.trim())
    return { description: p[0] || '', quantity: Number(p[1]) || 0, mrp: Number(p[2]) || 0 }
  }).filter((it) => it.description)
}

export default function AdminLotsManager() {
  const { adminHeaders, handleUnauthorized } = useAdmin()
  const [lots, setLots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/custom-lots', { headers: adminHeaders() })
      handleUnauthorized(res)
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load lots')
      setLots(data.lots || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
    setSaveMsg('')
  }

  const resetForm = () => {
    setForm({ ...EMPTY_FORM })
    setEditingId(null)
    setSaveMsg('')
  }

  const startEdit = (lot) => {
    setForm(toForm(lot))
    setEditingId(lot.lotId)
    setSaveMsg('')
  }

  const save = async (e) => {
    e.preventDefault()
    setSaveMsg('')
    if (!form.lotName.trim()) {
      setSaveMsg('Lot name is required.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        lotName: form.lotName.trim(),
        lotNumber: form.lotNumber.trim(),
        description: form.description.trim(),
        floorPrice: Number(form.floorPrice) || 0,
        mrp: Number(form.mrp) || 0,
        quantity: Number(form.quantity) || 0,
        gradeName: form.gradeName.trim() || 'Used',
        categoryName: form.categoryName.trim(),
        brandName: form.brandName.trim(),
        cityName: form.cityName.trim(),
        marketplaceName: form.marketplaceName.trim() || 'Lotmart Direct',
        imageUrls: String(form.imageUrlsText || '').split('\n').map((u) => u.trim()).filter(Boolean),
        manifestItems: parseManifest(form.manifestText),
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
        status: form.status === 'inactive' ? 'inactive' : 'active'
      }
      const url = editingId ? `/api/admin/custom-lots/${editingId}` : '/api/admin/custom-lots'
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: adminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload)
      })
      handleUnauthorized(res)
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to save lot')
      setSaveMsg(editingId ? 'Lot updated.' : 'Lot added — it now shows first on /products.')
      resetForm()
      load()
    } catch (err) {
      setSaveMsg(err.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (lotId) => {
    if (!window.confirm('Delete this lot permanently?')) return
    setBusyId(lotId)
    try {
      const res = await fetch(`/api/admin/custom-lots/${lotId}`, {
        method: 'DELETE',
        headers: adminHeaders()
      })
      handleUnauthorized(res)
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to delete lot')
      setLots((prev) => prev.filter((l) => l.lotId !== lotId))
      if (editingId === lotId) resetForm()
    } catch (err) {
      alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const toggleStatus = async (lot) => {
    setBusyId(lot.lotId)
    try {
      const res = await fetch(`/api/admin/custom-lots/${lot.lotId}`, {
        method: 'PUT',
        headers: adminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ status: lot.status === 'active' ? 'inactive' : 'active' })
      })
      handleUnauthorized(res)
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update status')
      setLots((prev) => prev.map((l) => (l.lotId === lot.lotId ? data.lot : l)))
    } catch (err) {
      alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const fld = { width: '100%', boxSizing: 'border-box' }

  return (
    <div className="admin-section" style={{ marginBottom: '32px' }}>
      <h2>Our Own Lots</h2>
      <p className="admin-desc">
        Add your own products here — same fields as the /products cards. Active lots pin
        FIRST on /products (page 1, unfiltered), then B4Trader lots continue.
      </p>
      <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="admin-field" style={{ margin: 0 }}>
            <label>Lot name *</label>
            <input value={form.lotName} onChange={(e) => set('lotName', e.target.value)} style={fld} />
          </div>
          <div className="admin-field" style={{ margin: 0 }}>
            <label>Lot number</label>
            <input value={form.lotNumber} onChange={(e) => set('lotNumber', e.target.value)} style={fld} />
          </div>
        </div>
        <div className="admin-field" style={{ margin: 0 }}>
          <label>Description</label>
          <input value={form.description} onChange={(e) => set('description', e.target.value)} style={fld} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div className="admin-field" style={{ margin: 0 }}>
            <label>Floor price (Rs)</label>
            <input type="number" min="0" value={form.floorPrice} onChange={(e) => set('floorPrice', e.target.value)} style={fld} />
          </div>
          <div className="admin-field" style={{ margin: 0 }}>
            <label>MRP (Rs)</label>
            <input type="number" min="0" value={form.mrp} onChange={(e) => set('mrp', e.target.value)} style={fld} />
          </div>
          <div className="admin-field" style={{ margin: 0 }}>
            <label>Quantity</label>
            <input type="number" min="0" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} style={fld} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div className="admin-field" style={{ margin: 0 }}>
            <label>Condition / Grade</label>
            <input value={form.gradeName} onChange={(e) => set('gradeName', e.target.value)} style={fld} />
          </div>
          <div className="admin-field" style={{ margin: 0 }}>
            <label>Category</label>
            <input value={form.categoryName} onChange={(e) => set('categoryName', e.target.value)} style={fld} />
          </div>
          <div className="admin-field" style={{ margin: 0 }}>
            <label>Brand</label>
            <input value={form.brandName} onChange={(e) => set('brandName', e.target.value)} style={fld} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="admin-field" style={{ margin: 0 }}>
            <label>City</label>
            <input value={form.cityName} onChange={(e) => set('cityName', e.target.value)} style={fld} />
          </div>
          <div className="admin-field" style={{ margin: 0 }}>
            <label>Marketplace label</label>
            <input value={form.marketplaceName} onChange={(e) => set('marketplaceName', e.target.value)} style={fld} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="admin-field" style={{ margin: 0 }}>
            <label>Auction starts</label>
            <input type="datetime-local" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} style={fld} />
          </div>
          <div className="admin-field" style={{ margin: 0 }}>
            <label>Auction ends</label>
            <input type="datetime-local" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} style={fld} />
          </div>
        </div>
        <div className="admin-field" style={{ margin: 0 }}>
          <label>Image URLs (one per line)</label>
          <textarea value={form.imageUrlsText} onChange={(e) => set('imageUrlsText', e.target.value)} rows={3} style={{ ...fld, padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }} />
        </div>
        <div className="admin-field" style={{ margin: 0 }}>
          <label>Manifest items (one per line: name | qty | mrp)</label>
          <textarea value={form.manifestText} onChange={(e) => set('manifestText', e.target.value)} rows={4} style={{ ...fld, padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }} />
        </div>
        <div className="admin-field" style={{ margin: 0 }}>
          <label>Status</label>
          <select value={form.status} onChange={(e) => set('status', e.target.value)} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
            <option value="active">Active (visible on /products)</option>
            <option value="inactive">Inactive (hidden)</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="submit" className="admin-login-btn" style={{ width: 'auto', padding: '10px 22px', marginTop: 0 }} disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update Lot' : 'Add Lot'}
          </button>
          {editingId && (
            <button type="button" className="admin-logout-btn" onClick={resetForm}>Cancel edit</button>
          )}
          {saveMsg && <span className="range-status">{saveMsg}</span>}
        </div>
      </form>
      <div className="trader-tabs">
        <button type="button" className="trader-tab refresh" onClick={load}>Refresh</button>
      </div>
      {error && <div className="admin-error">{error}</div>}
      {loading ? (
        <div className="admin-desc">Loading lots...</div>
      ) : lots.length === 0 ? (
        <div className="admin-desc">No own lots yet — add your first lot above.</div>
      ) : (
        <div className="trader-list">
          {lots.map((lot) => (
            <div key={lot.lotId} className="trader-card">
              <div className="trader-info">
                <div className="trader-name">{lot.lotName}</div>
                <div className="trader-meta">
                  {lot.lotNumber} | Rs {Number(lot.floorPrice || 0).toLocaleString('en-IN')} floor | Rs {Number(lot.mrp || 0).toLocaleString('en-IN')} MRP | qty {lot.quantity}
                </div>
                <div className="trader-meta">
                  {[lot.cityName, lot.categoryName, lot.brandName].filter(Boolean).join(' | ') || '-'}
                  {' | '}{lot.status === 'active' ? 'active' : 'inactive'}
                  {lot.endDate ? ` | ends ${new Date(lot.endDate).toLocaleString()}` : ''}
                </div>
              </div>
              <div className="trader-actions">
                <a href={`/product_detail/${lot.lotId}`} target="_blank" rel="noreferrer" className="admin-approve-btn" style={{ textDecoration: 'none', textAlign: 'center' }}>View</a>
                <button type="button" className="admin-approve-btn" disabled={busyId === lot.lotId} onClick={() => startEdit(lot)}>Edit</button>
                <button type="button" className="admin-approve-btn" disabled={busyId === lot.lotId} onClick={() => toggleStatus(lot)}>{lot.status === 'active' ? 'Hide' : 'Show'}</button>
                <button type="button" className="admin-approve-btn admin-reject-btn" disabled={busyId === lot.lotId} onClick={() => remove(lot.lotId)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


