import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { displayMarketplaceName, displayMarketplaceImage } from '../../displayMarketplace'
import { IconArrowRight } from './LandingIcons'

export default function MarketplacesSection() {
  const [marketplaces, setMarketplaces] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const fetchMarketplaces = async () => {
      try {
        const res = await fetch('/api/organizations/fetch_marketplace')
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && data && data.marketplaces) {
          setMarketplaces(data.marketplaces.filter(Boolean))
        }
      } catch {
        // Section hides itself on failure — never break the page.
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchMarketplaces()
    return () => { cancelled = true }
  }, [])

  if (!loading && marketplaces.length === 0) return null

  return (
    <section className="landing-section" id="marketplaces">
      <div className="landing-container">
        <div className="landing-section__header landing-marketplaces__head">
          <div>
            <span className="landing-eyebrow">Marketplaces</span>
            <h2 className="landing-section__title">Browse marketplaces.</h2>
            <p className="landing-section__subtitle">
              Each marketplace lists its own live lots. Pick one to see what is
              on auction there right now — or shop everything together.
            </p>
          </div>
          <div className="landing-marketplaces__head-actions">
            <Link to="/marketplaces" className="landing-btn landing-btn--secondary">
              <span>All Marketplaces</span>
              <IconArrowRight size={16} />
            </Link>
            <Link to="/products" className="landing-btn landing-btn--primary">
              <span>Shop All Auctions</span>
              <IconArrowRight size={16} />
            </Link>
          </div>
        </div>

        {loading ? (
          <p className="landing-muted-text">Loading marketplaces…</p>
        ) : (
          <div className="landing-marketplaces__grid">
            {marketplaces.map((mp, idx) => {
              const orgPath = mp.marketplace_name || mp.id
              const displayName = displayMarketplaceName(mp)
              const displayImage = displayMarketplaceImage(mp)
              return (
                <Link
                  key={mp.id || idx}
                  to={`/${orgPath}/products`}
                  className="landing-marketplace-card"
                >
                  {displayImage && (
                    <img src={displayImage} alt={displayName || 'Marketplace'} className="landing-marketplace-card__logo" />
                  )}
                  <div>
                    <strong className="landing-marketplace-card__name">
                      {displayName || orgPath}
                    </strong>
                    <span className="landing-marketplace-card__lots">
                      {mp.active_lots || 0} active lots
                    </span>
                  </div>
                  <span className="landing-marketplace-card__go">View lots →</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
