import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { displayMarketplaceName, displayMarketplaceImage } from '../../../displayMarketplace'
import { useReveal } from './useReveal'

export default function BrandsStrip() {
  const ref = useReveal()
  const [marketplaces, setMarketplaces] = useState([])

  useEffect(() => {
    let cancelled = false
    const fetchMarketplaces = async () => {
      try {
        const res = await fetch('/api/organizations/fetch_marketplace')
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && data && data.marketplaces) {
          setMarketplaces(data.marketplaces.filter((mp) => mp && Number(mp.active_lots) > 0))
        }
      } catch {
        // Section hides itself on failure — never break the page.
      }
    }
    fetchMarketplaces()
    return () => { cancelled = true }
  }, [])

  if (marketplaces.length === 0) return null

  return (
    <section className="lotz-section" ref={ref}>
      <div className="lotz-container lotz-center">
        <p className="lotz-eyebrow lotz-reveal">Our live marketplaces</p>
        <h2 className="lotz-h2 lotz-h2--sm lotz-reveal">Live lots from marketplaces you already know.</h2>
        <p className="lotz-body lotz-reveal">Same live marketplaces as above — each one lists its own lots on auction right now. Pick one to start bidding.</p>
        <div className="lotz-brands lotz-reveal">
          {marketplaces.map((mp, idx) => {
            const orgPath = mp.marketplace_name || mp.id
            const displayName = displayMarketplaceName(mp)
            const displayImage = displayMarketplaceImage(mp)
            return (
              <Link key={mp.id || idx} to={`/${orgPath}/products`} className="lotz-brand-card" aria-label={`${displayName || orgPath} lots`}>
                {displayImage && (
                  <img src={displayImage} alt={displayName || 'Marketplace'} className="lotz-brand-card__logo" loading="lazy" />
                )}
                <span className="lotz-brand-card__name">{displayName || orgPath}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
