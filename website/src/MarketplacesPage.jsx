import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SiteHeader, { SiteFooter } from './SiteChrome'
import './theme.css'
import './Marketplaces.css'

export default function MarketplacesPage() {
  const [marketplaces, setMarketplaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchMarketplaces = async () => {
      try {
        const res = await fetch('/api/organizations/fetch_marketplace')
        if (!res.ok) {
          throw new Error(`Failed to fetch marketplaces (${res.status})`)
        }
        const data = await res.json()
        if (!data || !data.marketplaces) {
          throw new Error('Invalid response from marketplaces API')
        }
        setMarketplaces((data.marketplaces || []).filter(Boolean))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchMarketplaces()
  }, [])

  return (
    <div className="wl-page">
      <SiteHeader />

      <main className="wl-main">
        <nav className="wl-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="wl-crumb-sep">/</span>
          <span className="wl-crumb-current">Marketplaces</span>
        </nav>

        <div className="wl-page-head">
          <div>
            <h1>Browse Marketplaces</h1>
            <p className="wl-sub">
              Each marketplace lists its own live lots. Pick one to see what is
              on auction there — or shop everything together.
            </p>
          </div>
          <Link to="/products" className="wl-btn wl-btn-primary">
            Shop All Auctions →
          </Link>
        </div>

        {error && <div className="wl-notice wl-notice-error">{error}</div>}

        {loading ? (
          <div className="mp-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="mp-card" aria-hidden="true">
                <div className="mp-card__body">
                  <div className="wl-skeleton" style={{ width: 72, height: 72, borderRadius: 10 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="wl-skeleton" style={{ height: 18, width: '80%' }} />
                    <div className="wl-skeleton" style={{ height: 14, width: '50%' }} />
                  </div>
                </div>
                <div className="wl-skeleton" style={{ height: 40 }} />
              </div>
            ))}
          </div>
        ) : marketplaces.length === 0 && !error ? (
          <div className="wl-empty">
            <h3>No marketplaces available right now</h3>
            <p>Please check back soon — or shop every live lot in one place.</p>
            <div className="wl-empty-actions">
              <Link to="/products" className="wl-btn wl-btn-primary">
                Shop All Auctions
              </Link>
            </div>
          </div>
        ) : (
          <div className="mp-grid">
            {marketplaces.map((mp, idx) => {
              const orgPath = mp.marketplace_name || mp.id
              return (
                <div key={mp.id || idx} className="mp-card">
                  <div className="mp-card__body">
                    {mp.image_url ? (
                      <img src={mp.image_url} alt={mp.name || orgPath} className="mp-card__logo" loading="lazy" />
                    ) : (
                      <div className="mp-card__logo mp-card__logo--fallback">
                        {(mp.name || orgPath || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="mp-card__info">
                      <h3>{mp.name || orgPath}</h3>
                      <span className="mp-card__lots">
                        {mp.active_lots || 0} active lots
                      </span>
                    </div>
                  </div>
                  <Link to={`/${orgPath}/products`} className="wl-btn wl-btn-secondary wl-btn-block">
                    View Lots →
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
