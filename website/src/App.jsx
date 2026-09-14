import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { AdminProvider, useAdmin } from './AdminContext'
import LandingPage from './LandingPage'
import MarketplacesPage from './MarketplacesPage'
import ProductDetailPage from './ProductDetailPage'
import MyAccountPage from './MyAccountPage'
import AdminOrdersDashboard from './AdminOrdersDashboard'
import SignUpPage from './SignUpPage'
import ShopPage from './ShopPage'
import { UserProvider } from './UserContext'
import SignInModal from './SignInModal'
import './theme.css'
import './Admin.css'

function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAdmin()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const success = await login(username, password)
    if (success) {
      navigate('/admin')
    } else {
      setError('Invalid username or password')
    }
  }

  return (
    <div className="admin-login-page">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <h1>Admin Login</h1>
        {error && <div className="admin-error">{error}</div>}
        <div className="admin-field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="admin-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="admin-login-btn">Login</button>
      </form>
    </div>
  )
}

function AdminTradersSection() {
  const { adminHeaders, handleUnauthorized } = useAdmin()
  const [traders, setTraders] = useState([])
  const [counts, setCounts] = useState(null)
  const [tab, setTab] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [activityKey, setActivityKey] = useState(0)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/traders', { headers: adminHeaders() })
      handleUnauthorized(res)
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load accounts')
      setTraders(data.traders)
      setCounts(data.counts)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const setStatus = async (id, status) => {
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/traders/${id}/status`, {
        method: 'POST',
        headers: adminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ status })
      })
      handleUnauthorized(res)
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update')
      await load()
      setActivityKey((k) => k + 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const filtered = traders.filter((t) => t.status === tab)

  return (
    <div className="admin-section">
      <h2>Trader Accounts</h2>
      <p className="admin-desc">
        Buyer registrations from the website. Approve or reject each account — only approved
        traders can sign in and bid.
      </p>

      <div className="trader-tabs">
        {['pending', 'approved', 'rejected'].map((t) => (
          <button
            key={t}
            type="button"
            className={`trader-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {counts ? ` (${counts[t]})` : ''}
          </button>
        ))}
        <button type="button" className="trader-tab refresh" onClick={load}>⟳ Refresh</button>
      </div>

      {error && <div className="admin-error">{error}</div>}
      {loading ? (
        <div className="admin-desc">Loading accounts…</div>
      ) : filtered.length === 0 ? (
        <div className="admin-desc">No {tab} accounts.</div>
      ) : (
        <div className="trader-list">
          {filtered.map((t) => (
            <div key={t.id} className="trader-card">
              <div className="trader-info">
                <div className="trader-name">
                  {t.name}
                  {t.organisationName ? <span className="trader-org"> — {t.organisationName}</span> : null}
                </div>
                <div className="trader-meta">✉ {t.email}</div>
                <div className="trader-meta">📞 {t.mobile} {t.mobileVerified ? '✅ verified' : '⏳ unverified'}</div>
                <div className="trader-meta">🗓 Registered: {new Date(t.createdAt).toLocaleString()}</div>
              </div>
              <div className="trader-actions">
                {t.status !== 'approved' && (
                  <button
                    type="button"
                    className="admin-approve-btn"
                    disabled={busyId === t.id}
                    onClick={() => setStatus(t.id, 'approved')}
                  >
                    ✓ Approve
                  </button>
                )}
                {t.status !== 'rejected' && (
                  <button
                    type="button"
                    className="admin-reject-btn"
                    disabled={busyId === t.id}
                    onClick={() => setStatus(t.id, 'rejected')}
                  >
                    ✕ Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <SectionActivity section="traders" refreshKey={activityKey} />
    </div>
  )
}

function RangePriceSection() {
  const { priceHike, updatePriceHike, savePriceConfig, rangeHikes } = useAdmin()
  const [draftHike, setDraftHike] = useState('0')
  const [draft, setDraft] = useState([])
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [activityKey, setActivityKey] = useState(0)

  // Sync the local editor whenever the server config loads/changes
  useEffect(() => {
    setDraftHike(String(priceHike ?? 0))
    setDraft((rangeHikes || []).map((r, i) => ({
      key: i,
      min: String(r.min ?? ''),
      max: String(r.max ?? ''),
      percent: String(r.percent ?? 0)
    })))
  }, [priceHike, rangeHikes])

  const nextKey = () => Date.now() + Math.random()

  const setRow = (key, field, value) => {
    setDraft((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)))
  }

  const addRow = () => {
    setDraft((prev) => [...prev, { key: nextKey(), min: '', max: '', percent: '0' }])
  }

  const removeRow = (key) => {
    setDraft((prev) => prev.filter((r) => r.key !== key))
  }

  // Validate custom ranges locally before saving: numeric, sane bounds,
  // and strictly non-overlapping with no shared boundary value.
  const validateRanges = (rows) => {
    const cleaned = []
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const min = Number(row.min)
      const max = Number(row.max)
      const percent = Number(row.percent)
      const label = `Row ${i + 1}`
      if (row.min === '' || row.max === '' || row.percent === '' || isNaN(min) || isNaN(max) || isNaN(percent)) {
        return { ok: false, message: `${label}: fill From, To and Hike % with numbers.` }
      }
      if (!Number.isInteger(min) || !Number.isInteger(max)) {
        return { ok: false, message: `${label}: From/To must be whole rupees.` }
      }
      if (min < 0 || max <= min) {
        return { ok: false, message: `${label}: needs 0 ≤ From < To.` }
      }
      if (percent < 0 || percent > 100) {
        return { ok: false, message: `${label}: Hike % must be between 0 and 100.` }
      }
      cleaned.push({ min, max, percent })
    }
    cleaned.sort((a, b) => a.min - b.min || a.max - b.max)
    for (let i = 1; i < cleaned.length; i++) {
      if (cleaned[i].min <= cleaned[i - 1].max) {
        return {
          ok: false,
          message: `Rows overlap: ₹${cleaned[i - 1].min.toLocaleString('en-IN')}–₹${cleaned[i - 1].max.toLocaleString('en-IN')} and ₹${cleaned[i].min.toLocaleString('en-IN')}–₹${cleaned[i].max.toLocaleString('en-IN')} share ₹${cleaned[i].min.toLocaleString('en-IN')}. Start the next range at ₹${(cleaned[i - 1].max + 1).toLocaleString('en-IN')} or later.`
        }
      }
    }
    return { ok: true, ranges: cleaned }
  }

  // Nothing is applied to the live website until this is pressed.
  const save = async () => {
    setSaving(true)
    setStatus('')
    const checked = validateRanges(draft)
    if (!checked.ok) {
      setSaving(false)
      setStatus(`❌ ${checked.message}`)
      return
    }
    const result = await savePriceConfig({ priceHike: draftHike, rangeHikes: checked.ranges })
    setSaving(false)
    setStatus(result.ok ? '✅ Saved — live on the website for all devices.' : `❌ ${result.message}`)
    if (result.ok) setActivityKey((k) => k + 1)
  }

  return (
    <div className="admin-section">
      <h2>Price Hikes</h2>
      <p className="admin-desc">
        The Default Hike below applies to every price OUTSIDE your custom ranges.
        Add your own From → To ranges below — each range overrides the default with its
        own hike % (even 0%). Ranges are inclusive on both ends and must not overlap
        or share a number: if one range ends at ₹15,000, the next must start at
        ₹15,001 or later. Nothing changes on the website until you press Save.
      </p>

      <div className="admin-field">
        <label htmlFor="price-hike">Default Hike (applies outside custom ranges)</label>
        <input
          id="price-hike"
          type="number"
          min="0"
          max="100"
          value={draftHike}
          onChange={(e) => setDraftHike(e.target.value)}
        />
        <span className="admin-unit">%</span>
      </div>

      <div className="hike-rows">
        <div className="hike-row hike-row-head">
          <span>From Amount (₹)</span>
          <span>To Amount (₹)</span>
          <span>Hike %</span>
          <span />
        </div>
        {draft.map((r, idx) => (
          <div key={r.key} className="hike-row">
            <input
              type="number"
              min="0"
              step="1"
              placeholder="e.g. 10000"
              aria-label={`Row ${idx + 1} from amount`}
              value={r.min}
              onChange={(e) => setRow(r.key, 'min', e.target.value)}
            />
            <input
              type="number"
              min="0"
              step="1"
              placeholder="e.g. 14000"
              aria-label={`Row ${idx + 1} to amount`}
              value={r.max}
              onChange={(e) => setRow(r.key, 'max', e.target.value)}
            />
            <input
              type="number"
              min="0"
              max="100"
              placeholder="e.g. 5"
              aria-label={`Row ${idx + 1} hike percent`}
              value={r.percent}
              onChange={(e) => setRow(r.key, 'percent', e.target.value)}
            />
            <button
              type="button"
              className="hike-remove-btn"
              aria-label={`Remove row ${idx + 1}`}
              onClick={() => removeRow(r.key)}
            >
              ✕
            </button>
          </div>
        ))}
        {draft.length === 0 && (
          <p className="admin-desc" style={{ margin: '8px 0 0' }}>
            No custom ranges — every price uses the Default Hike above.
          </p>
        )}
      </div>

      <div className="hike-add-row">
        <button type="button" className="hike-add-btn" onClick={addRow}>
          + Add Range
        </button>
      </div>

      <div className="range-actions">
        <button
          type="button"
          className="admin-login-btn"
          style={{ marginTop: 0 }}
          disabled={saving}
          onClick={save}
        >
          {saving ? 'Saving…' : 'Save Price Config'}
        </button>
        {status && <span className="range-status">{status}</span>}
      </div>
      <SectionActivity section="price" refreshKey={activityKey} />
    </div>
  )
}

function TimerConfigSection() {
  const { timerEarlyHours, savePriceConfig } = useAdmin()
  const [draftHours, setDraftHours] = useState('1')
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [activityKey, setActivityKey] = useState(0)

  // Sync the local editor whenever the server config loads/changes
  useEffect(() => {
    setDraftHours(String(timerEarlyHours ?? 1))
  }, [timerEarlyHours])

  // Nothing is applied to the live website until this is pressed.
  const save = async () => {
    setSaving(true)
    setStatus('')
    const result = await savePriceConfig({ timerEarlyHours: draftHours })
    setSaving(false)
    setStatus(result.ok ? '✅ Saved — live on the website for all devices.' : `❌ ${result.message}`)
    if (result.ok) setActivityKey((k) => k + 1)
  }

  return (
    <div className="admin-section">
      <h2>Timer Config</h2>
      <p className="admin-desc">
        How many hours early the product countdown timers should finish compared to the
        b4traders time. For example, 1 means every timer shows one hour less than the actual
        remaining time. Set 0 to show the exact time. Nothing changes on the website until
        you press Save.
      </p>

      <div className="admin-field">
        <label htmlFor="timer-early-hours">Timer Earliness</label>
        <input
          id="timer-early-hours"
          type="number"
          min="0"
          step="0.5"
          value={draftHours}
          onChange={(e) => setDraftHours(e.target.value)}
        />
        <span className="admin-unit">hours</span>
      </div>

      <div className="range-actions">
        <button
          type="button"
          className="admin-login-btn"
          style={{ marginTop: 0 }}
          disabled={saving}
          onClick={save}
        >
          {saving ? 'Saving…' : 'Save Timer Config'}
        </button>
        {status && <span className="range-status">{status}</span>}
      </div>
      <SectionActivity section="timer" refreshKey={activityKey} />
    </div>
  )
}

function AdminAccountsSection() {
  const { adminUser, adminHeaders, handleUnauthorized } = useAdmin()
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [removing, setRemoving] = useState(null)
  const [activityKey, setActivityKey] = useState(0)

  const isSuper = !!adminUser?.isSuperAdmin

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/admins', { headers: adminHeaders() })
      handleUnauthorized(res)
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load admins')
      setAdmins(data.admins)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const create = async (e) => {
    e.preventDefault()
    setBusy(true)
    setStatus('')
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: adminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ username: newUsername, password: newPassword })
      })
      handleUnauthorized(res)
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to create admin')
      setNewUsername('')
      setNewPassword('')
      setStatus(`✅ Admin "${data.admin.username}" created.`)
      await load()
      setActivityKey((k) => k + 1)
    } catch (err) {
      setStatus(`❌ ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  const remove = async (username) => {
    if (!window.confirm(`Remove admin "${username}"? They will be signed out immediately.`)) return
    setRemoving(username)
    setStatus('')
    try {
      const res = await fetch(`/api/admin/admins/${encodeURIComponent(username)}`, {
        method: 'DELETE',
        headers: adminHeaders()
      })
      handleUnauthorized(res)
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to remove admin')
      setStatus(`✅ Admin "${username}" removed.`)
      await load()
      setActivityKey((k) => k + 1)
    } catch (err) {
      setStatus(`❌ ${err.message}`)
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div className="admin-section">
      <h2>Admin Accounts</h2>
      <p className="admin-desc">
        Everyone listed here has full admin access. Only the super admin (gopi) can create
        or remove admin accounts.
      </p>

      {error && <div className="admin-error">{error}</div>}
      {loading ? (
        <div className="admin-desc">Loading accounts…</div>
      ) : (
        <div className="trader-list">
          {admins.map((a) => (
            <div key={a.username} className="trader-card">
              <div className="trader-info">
                <div className="trader-name">
                  {a.username}
                  {a.isSuperAdmin ? <span className="trader-org"> — super admin</span> : null}
                  {adminUser?.username === a.username ? <span className="trader-org"> (you)</span> : null}
                </div>
                <div className="trader-meta">
                  Added by {a.createdBy || 'system'} · 🗓 {a.createdAt ? new Date(a.createdAt).toLocaleString() : '—'}
                </div>
              </div>
              <div className="trader-actions">
                {isSuper && !a.isSuperAdmin && adminUser?.username !== a.username && (
                  <button
                    type="button"
                    className="admin-reject-btn"
                    disabled={removing === a.username}
                    onClick={() => remove(a.username)}
                  >
                    {removing === a.username ? 'Removing…' : '✕ Remove'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isSuper && (
        <form className="hike-add-row" style={{ marginTop: '16px' }} onSubmit={create}>
          <div className="hike-row" style={{ gridTemplateColumns: '1fr 1fr auto' }}>
            <input
              type="text"
              placeholder="New username"
              aria-label="New admin username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Password (min 4 chars)"
              aria-label="New admin password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button type="submit" className="hike-add-btn" disabled={busy}>
              {busy ? 'Adding…' : '+ Add Admin'}
            </button>
          </div>
        </form>
      )}
      {status && <span className="range-status">{status}</span>}
      <SectionActivity section="admins" refreshKey={activityKey} />
    </div>
  )
}

function describeActivity(a) {
  switch (a.action) {
    case 'login': return 'signed in'
    case 'create_admin': return a.detail || 'created an admin account'
    case 'remove_admin': return a.detail || 'removed an admin account'
    case 'update_price_config': return `updated price config (${a.detail || 'saved'})`
    case 'update_price_hike': return `updated price hikes (${a.detail || 'saved'})`
    case 'update_timer_config': return `updated timer config (${a.detail || 'saved'})`
    case 'trader_approved': return `approved trader ${a.detail || ''}`.trim()
    case 'trader_rejected': return `rejected trader ${a.detail || ''}`.trim()
    case 'trader_pending': return `moved trader back to pending ${a.detail || ''}`.trim()
    case 'assign_bid': return `assigned a bid (${a.detail || 'saved'})`
    case 'end_bidding': return `ended bidding early (${a.detail || 'saved'})`
    case 'reopen_bidding': return `reopened bidding (${a.detail || 'saved'})`
    default: return a.detail ? `${a.action} — ${a.detail}` : a.action
  }
}

// Compact per-section activity feed: shows only this section's entries,
// newest first, with who + when. Rendered inside each admin section.
// `refreshKey` lets the parent force a reload (e.g. right after a save).
function SectionActivity({ section, refreshKey = 0 }) {
  const { adminHeaders, handleUnauthorized } = useAdmin()
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/activity?section=${encodeURIComponent(section)}&limit=10`, { headers: adminHeaders() })
      handleUnauthorized(res)
      const data = await res.json()
      if (res.ok && data.success) setActivity(data.activity)
    } catch {
      // Activity is informational — never break the section over it.
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [section, refreshKey])

  return (
    <div className="section-activity">
      <div className="section-activity-head">
        <h4>Activity</h4>
        <button type="button" className="section-activity-refresh" onClick={load} aria-label="Refresh activity">⟳</button>
      </div>
      {loading ? (
        <p className="section-activity-empty">Loading…</p>
      ) : activity.length === 0 ? (
        <p className="section-activity-empty">No activity yet — changes made here will appear with who did them and when.</p>
      ) : (
        <ul className="section-activity-list">
          {activity.map((a) => (
            <li key={a.id}>
              <strong>{a.username}</strong> {describeActivity(a)}
              <span className="section-activity-time"> · {a.createdAt ? new Date(a.createdAt).toLocaleString() : '—'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function RecentActivitySection() {
  const { adminHeaders, handleUnauthorized } = useAdmin()
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/activity?limit=100', { headers: adminHeaders() })
      handleUnauthorized(res)
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load activity')
      setActivity(data.activity)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const describe = (a) => describeActivity(a)

  return (
    <div className="admin-section">
      <h2>Recent Activity</h2>
      <p className="admin-desc">
        Everything done in the admin panel, newest first — each section above also
        shows only its own activity beside it.
      </p>

      <div className="trader-tabs">
        <button type="button" className="trader-tab refresh" onClick={load}>⟳ Refresh</button>
      </div>

      {error && <div className="admin-error">{error}</div>}
      {loading ? (
        <div className="admin-desc">Loading activity…</div>
      ) : activity.length === 0 ? (
        <div className="admin-desc">No activity yet.</div>
      ) : (
        <div className="trader-list">
          {activity.map((a) => (
            <div key={a.id} className="trader-card">
              <div className="trader-info">
                <div className="trader-name">{a.username}</div>
                <div className="trader-meta">{describe(a)}</div>
                <div className="trader-meta">🗓 {a.createdAt ? new Date(a.createdAt).toLocaleString() : '—'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AdminPanel() {
  const { logout, adminUser } = useAdmin()
  const navigate = useNavigate()

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {adminUser?.username && (
            <span className="admin-desc" style={{ margin: 0 }}>
              👤 {adminUser.username}{adminUser.isSuperAdmin ? ' (super admin)' : ''}
            </span>
          )}
          <button
            type="button"
            className="admin-login-btn"
            style={{ marginTop: 0, padding: '8px 16px' }}
            onClick={() => navigate('/admin/orders')}
          >
            📊 Orders Dashboard
          </button>
          <button className="admin-logout-btn" onClick={() => { logout(); navigate('/'); }}>Logout</button>
        </div>
      </div>
      <RangePriceSection />
      <TimerConfigSection />

      <AdminTradersSection />

      <AdminAccountsSection />

      <RecentActivitySection />
    </div>
  )
}


export default function App() {
  return (
    <BrowserRouter>
      <AdminProvider>
        <UserProvider>
          <SignInModal />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/products" element={<ShopPage />} />
            <Route path="/marketplaces" element={<MarketplacesPage />} />
            <Route path="/my-account" element={<MyAccountPage />} />
            <Route path="/product_detail/:id" element={<ProductDetailPage />} />
            <Route path="/product_detail/:slug/:id" element={<ProductDetailPage />} />
            <Route path="/:orgName/products" element={<ShopPage />} />
            <Route path="/:orgName/product_detail/:id" element={<ProductDetailPage />} />
            <Route path="/:orgName/product_detail/:slug/:id" element={<ProductDetailPage />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/admin/orders" element={<AdminOrdersDashboard />} />
          </Routes>
        </UserProvider>
      </AdminProvider>
    </BrowserRouter>
  )
}