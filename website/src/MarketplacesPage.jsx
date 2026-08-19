import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header from './Header'
import './MarketplacesPage.css'

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
        setMarketplaces((data.marketplaces || []).filter(Boolean)) // filter out nulls
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchMarketplaces()
  }, [])

  return (
    <div className="marketplaces-page">
      <Header />

      <main className="marketplaces-main">
        <h1>Leading liquidation marketplaces</h1>
        
        {loading && <div className="loading">Loading marketplaces...</div>}
        {error && <div className="error">{error}</div>}

        {!loading && !error && (
          <div className="marketplaces-grid">
            {marketplaces.map((mp, idx) => {
              const orgPath = mp.marketplace_name || mp.id
              return (
                <div key={mp.id || idx} className="marketplace-card">
                  <div className="mp-header">
                    <div className="mp-stats">
                      <strong>{mp.active_lots || 0}</strong> Active Lots
                    </div>
                  </div>
                  <div className="mp-body">
                    <img src={mp.image_url} alt={mp.name} className="mp-logo" />
                    <span className="mp-category">Liquidation</span>
                  </div>
                  <div className="mp-footer">
                    <Link to={`/${orgPath}/products`} className="btn-mp-link">View Lots</Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <footer className="footer">
        <div className="footer-brand">
          <div className="brand-logo footer-logo" role="img" aria-label="wholelot traders">
            <span className="brand-text">wholelot</span>
            <span className="brand-text-second">traders</span>
          </div>
        </div>
        <div className="footer-links">
          <a href="#">About Us</a>
          <a href="#">Contact Us</a>
        </div>
      </footer>
    </div>
  )
}
