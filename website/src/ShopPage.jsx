import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { usePrice } from './usePrice'
import { displayCity } from './displayCity'
import { displayMarketplaceName, displayOrgImageUrl } from './displayMarketplace'
import SiteHeader, { SiteFooter } from './SiteChrome'
import './theme.css'
import './ShopPage.css'

const SORT_OPTIONS = [
  { label: 'Ending Soon', sortBy: '+end_date', selectedSortBy: 'end_date_l_h' },
  { label: 'Recently Listed', sortBy: '-start_date', selectedSortBy: 'recent' },
  { label: 'Price: High to Low', sortBy: '-mrp', selectedSortBy: 'mrp_h_l' },
  { label: 'Price: Low to High', sortBy: '+mrp', selectedSortBy: 'mrp_l_h' }
]

const TIMER_OFFSET_SECONDS_FALLBACK = 60 * 60
const PER_PAGE = 24

function formatTimerHero(seconds) {
  if (!seconds || seconds <= 0) return 'Ended'
  const s = Math.floor(seconds)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n) => String(n).padStart(2, '0')
  if (d > 0) return `${pad(d)}d ${pad(h)} Hr ${pad(m)} Min ${pad(sec)} Sec`
  return `${pad(h)} Hr ${pad(m)} Min ${pad(sec)} Sec`
}

function toggleInArray(list, value) {
  if (list.includes(value)) return list.filter((x) => x !== value)
  return [...list, value]
}

function buildVisiblePages(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total]
  }
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  }
  return [1, '...', current - 1, current, current + 1, '...', total]
}

function LotCard({ product, orgName, formatMoney, formatRawMoney }) {
  const navigate = useNavigate()
  const detailPath = orgName
    ? `/${orgName}/product_detail/${product.id}`
    : `/product_detail/${product.id}`
  const remaining = typeof product.bid_remaining_time === 'number'
    ? product.bid_remaining_time
    : null
  const ended = remaining !== null && remaining <= 0
  const urgent = remaining !== null && remaining > 0 && remaining <= 3600

  return (
    <article
      className={`lot-card${ended ? ' lot-card--ended' : ''}`}
      onClick={() => navigate(detailPath)}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(detailPath) }}
      tabIndex={0}
      role="link"
      aria-label={product.lot_name}
    >
      <div className="lot-card__timer-hero">
        {remaining !== null && !ended ? (
          <span className={`lot-card__timer-pill ${urgent ? 'urgent' : ''}`}>
            <svg className="lot-card__timer-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="13" r="8" />
              <path d="M12 9v4l2.5 2.5" />
              <path d="M9 2h6" />
            </svg>
            {formatTimerHero(remaining)}
          </span>
        ) : (
          <span className="lot-card__timer-pill ended">Ended</span>
        )}
      </div>

      <div className="lot-card__media">
        <img
          src={product.lot_image_urls?.[0] || ''}
          alt={product.lot_name}
          className="lot-card__img"
          loading="lazy"
          onError={(e) => { e.target.src = '/favicon.png' }}
        />
        {product.org_image_url && (
          <img src={displayOrgImageUrl(product.org_image_url)} alt="" className="lot-card__org" loading="lazy" onError={(e) => { e.target.src = '/favicon.png' }} />
        )}
      </div>

      <div className="lot-card__body">
        <div className="lot-card__tags">
          {product.storage_location && (
            <span className="wl-badge">{displayCity(product.storage_location)}</span>
          )}
          {product.grade_name && (
            <span className="wl-badge wl-badge-brand">{product.grade_name}</span>
          )}
        </div>

        <h3 className="lot-card__title">{product.lot_name}</h3>

        <div className="lot-card__specs">
          {product.items_count != null && (
            <div className="lot-card__spec">
              <span>Quantity</span>
              <strong>{product.items_count} items</strong>
            </div>
          )}
          {product.mrp != null && (
            <div className="lot-card__spec">
              <span>MRP</span>
              <strong>{formatRawMoney(product.mrp)}</strong>
            </div>
          )}
        </div>

        <div className="lot-card__price-row">
          <div className="lot-card__price">
            <span className="lot-card__price-label">Floor Price</span>
            <strong className="lot-card__price-val">{formatMoney(product.floor_price)}</strong>
          </div>
          <span className={`lot-card__cta${ended ? ' lot-card__cta--ended' : ''}`}>{ended ? 'View Details →' : 'View & Bid →'}</span>
        </div>

        <div className="lot-card__foot">
          {product.delivery_by && <span>{product.delivery_by}</span>}
        </div>
      </div>
    </article>
  )
}

function FilterGroup({ title, children, defaultOpen = true, count = 0 }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="shop-filter-group">
      <button
        type="button"
        className="shop-filter-group__head"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>
          {title}
          {count > 0 && <span className="shop-filter-count">{count}</span>}
        </span>
        <span className={`shop-filter-chevron ${open ? 'open' : ''}`}>▾</span>
      </button>
      {open && <div className="shop-filter-group__body">{children}</div>}
    </section>
  )
}

export default function ShopPage() {
  const { orgName } = useParams()
  const { formatMoney, formatRawMoney, applyPriceHike, timerOffsetSeconds } = usePrice()
  const timerOffset = Number.isFinite(timerOffsetSeconds) ? timerOffsetSeconds : TIMER_OFFSET_SECONDS_FALLBACK
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    sub_categories: [],
    conditions: [],
    location: [],
    price_range: { min_price: 0, max_price: 12000000 }
  })

  const [selectedSort, setSelectedSort] = useState(SORT_OPTIONS[0])
  const [searchInput, setSearchInput] = useState('')
  const [searchText, setSearchText] = useState('')

  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedSubCategories, setSelectedSubCategories] = useState([])
  const [selectedConditions, setSelectedConditions] = useState([])
  const [selectedLocations, setSelectedLocations] = useState([])

  const [priceFrom, setPriceFrom] = useState(0)
  const [priceTo, setPriceTo] = useState(12000000)

  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ current_page: 1, total_pages: 1, total_count: 0, active_lots: 0 })

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const res = await fetch('/api/lots/lot_filter_options?lot_type=hybrid')
        if (!res.ok) return
        const data = await res.json()
        const opts = data?.filter
        if (!opts) return

        setFilterOptions(opts)
        setPriceFrom(opts.price_range?.min_price ?? 0)
        setPriceTo(opts.price_range?.max_price ?? 12000000)
      } catch (err) {
        console.error('Error fetching filter options:', err)
      }
    }

    fetchFilterOptions()
  }, [])

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      setError('')

      const payload = {
        search: {
          priceRange: [String(priceFrom ?? 0), String(priceTo ?? 12000000)],
          sortBy: selectedSort?.sortBy || '+end_date',
          text: searchText || '',
          selectedSortBy: selectedSort?.selectedSortBy || 'end_date_l_h',
          filterBy: '',
          location: selectedLocations || [],
          condition: selectedConditions || [],
          category_id: selectedCategories || [],
          sub_categories: selectedSubCategories || [],
          lot_type: 'Hybrid',
          search: searchText || '',
          priceFrom: priceFrom ?? 0,
          priceTo: priceTo ?? 12000000,
          search_text: searchText || '',
          page: page || 1,
          perPage: PER_PAGE,
          sort_by: selectedSort?.sortBy || '+end_date',
          ...(orgName && { organization_name: orgName })
        },
        sort: selectedSort?.sortBy || '+end_date',
        lot_type: 'Hybrid',
        sort_by: selectedSort?.sortBy || '+end_date',
        page_size: PER_PAGE,
        page_number: page || 1,
        page: page || 1,
        per_page: PER_PAGE,
        ...(orgName && { organization_name: orgName })
      }

      try {
        const res = await fetch('/api/lot_publishes/filter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (!res.ok) {
          throw new Error(`Failed to fetch products (${res.status})`)
        }

        const data = await res.json()
        const now = Date.now()
        const results = (data?.results || []).map((p) => ({
          ...p,
          endTime: typeof p.bid_remaining_time === 'number'
            ? now + Math.max(0, p.bid_remaining_time - timerOffset) * 1000
            : null,
          bid_remaining_time: typeof p.bid_remaining_time === 'number'
            ? Math.max(0, p.bid_remaining_time - timerOffset)
            : p.bid_remaining_time
        }))
        setProducts(results)
        setMeta({
          current_page: data?.meta?.current_page || page,
          total_pages: data?.meta?.total_pages || 1,
          total_count: data?.meta?.total_count || 0,
          active_lots: data?.active_lots ?? 0
        })
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [
    selectedSort,
    searchText,
    selectedLocations,
    selectedConditions,
    selectedCategories,
    selectedSubCategories,
    priceFrom,
    priceTo,
    page,
    orgName,
    timerOffset
  ])

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now()
      setProducts((prevProducts) => {
        if (!prevProducts || !prevProducts.length) return prevProducts
        let hasChanged = false
        const nextProducts = prevProducts.map((p) => {
          if (!p.endTime) return p
          const remaining = Math.max(0, Math.floor((p.endTime - now) / 1000))
          if (p.bid_remaining_time === remaining) return p
          hasChanged = true
          return { ...p, bid_remaining_time: remaining }
        })
        return hasChanged ? nextProducts : prevProducts
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const visiblePages = useMemo(
    () => buildVisiblePages(meta.current_page, meta.total_pages),
    [meta.current_page, meta.total_pages]
  )

  const handleSearch = (event) => {
    event.preventDefault()
    setPage(1)
    setSearchText(searchInput.trim())
  }

  const priceRangeActive = priceFrom !== (filterOptions.price_range?.min_price ?? 0)
    || priceTo !== (filterOptions.price_range?.max_price ?? 12000000)

  const activeChips = [
    ...(searchText ? [{ key: 'q', label: `“${searchText}”`, clear: () => { setSearchText(''); setSearchInput(''); setPage(1) } }] : []),
    ...selectedCategories.map((c) => ({ key: `cat-${c}`, label: c, clear: () => { setSelectedCategories((p) => toggleInArray(p, c)); setPage(1) } })),
    ...selectedSubCategories.map((c) => ({ key: `sub-${c}`, label: c, clear: () => { setSelectedSubCategories((p) => toggleInArray(p, c)); setPage(1) } })),
    ...selectedConditions.map((c) => ({ key: `cond-${c}`, label: c, clear: () => { setSelectedConditions((p) => toggleInArray(p, c)); setPage(1) } })),
    ...selectedLocations.map((c) => ({ key: `loc-${c}`, label: displayCity(c), clear: () => { setSelectedLocations((p) => toggleInArray(p, c)); setPage(1) } })),
    ...(priceRangeActive ? [{ key: 'price', label: `${applyPriceHike(priceFrom).toLocaleString('en-IN')} – ${applyPriceHike(priceTo).toLocaleString('en-IN')}`, clear: () => { setPriceFrom(filterOptions.price_range?.min_price ?? 0); setPriceTo(filterOptions.price_range?.max_price ?? 12000000); setPage(1) } }] : [])
  ]

  const clearFilters = () => {
    setSelectedCategories([])
    setSelectedSubCategories([])
    setSelectedConditions([])
    setSelectedLocations([])
    setPriceFrom(filterOptions.price_range?.min_price ?? 0)
    setPriceTo(filterOptions.price_range?.max_price ?? 12000000)
    setSearchInput('')
    setSearchText('')
    setPage(1)
    setSelectedSort(SORT_OPTIONS[0])
  }

  const isDefaultView = !searchText
    && selectedCategories.length === 0
    && selectedSubCategories.length === 0
    && selectedConditions.length === 0
    && selectedLocations.length === 0
    && !priceRangeActive

  const hasActiveFilter = !isDefaultView

  // The filter API returns a real per-marketplace live count in `active_lots`
  // (e.g. 269 for an org page); `meta.total_count` is a capped 10000 and must
  // never be shown. With filters applied, show the filtered result count.
  const liveLotsCount = hasActiveFilter
    ? (meta.total_count || products.length)
    : (meta.active_lots || products.length)

  const filtersPanel = (
    <div className="shop-filters">
      <div className="shop-filters__head">
        <h3>Filters</h3>
        {activeChips.length > 0 && (
          <button type="button" className="wl-chip-clear" onClick={clearFilters}>Clear all</button>
        )}
      </div>

      <FilterGroup title="Price Range">
        <div className="shop-price-values">
          <span>₹{applyPriceHike(priceFrom).toLocaleString('en-IN')}</span>
          <span>₹{applyPriceHike(priceTo).toLocaleString('en-IN')}</span>
        </div>
        <div className="shop-price-sliders">
          <input
            type="range"
            aria-label="Minimum price"
            min={filterOptions.price_range?.min_price ?? 0}
            max={filterOptions.price_range?.max_price ?? 12000000}
            value={priceFrom}
            onChange={(e) => {
              const v = Number(e.target.value)
              setPage(1)
              setPriceFrom(Math.min(v, priceTo))
            }}
          />
          <input
            type="range"
            aria-label="Maximum price"
            min={filterOptions.price_range?.min_price ?? 0}
            max={filterOptions.price_range?.max_price ?? 12000000}
            value={priceTo}
            onChange={(e) => {
              const v = Number(e.target.value)
              setPage(1)
              setPriceTo(Math.max(v, priceFrom))
            }}
          />
        </div>
      </FilterGroup>

      {(filterOptions.categories?.length > 0) && (
        <FilterGroup title="Category" count={selectedCategories.length}>
          <div className="shop-check-list">
            {filterOptions.categories.map((category) => (
              <label key={category} className="shop-check">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category)}
                  onChange={() => {
                    setPage(1)
                    setSelectedCategories((prev) => toggleInArray(prev, category))
                  }}
                />
                <span>{category}</span>
              </label>
            ))}
          </div>
        </FilterGroup>
      )}

      {(filterOptions.sub_categories?.length > 0) && (
        <FilterGroup title="Sub Category" count={selectedSubCategories.length} defaultOpen={false}>
          <div className="shop-check-list shop-check-list--scroll">
            {filterOptions.sub_categories.map((subCategory) => (
              <label key={subCategory} className="shop-check">
                <input
                  type="checkbox"
                  checked={selectedSubCategories.includes(subCategory)}
                  onChange={() => {
                    setPage(1)
                    setSelectedSubCategories((prev) => toggleInArray(prev, subCategory))
                  }}
                />
                <span>{subCategory}</span>
              </label>
            ))}
          </div>
        </FilterGroup>
      )}

      {(filterOptions.conditions?.length > 0) && (
        <FilterGroup title="Condition" count={selectedConditions.length}>
          <div className="shop-check-list">
            {filterOptions.conditions.map((condition) => (
              <label key={condition} className="shop-check">
                <input
                  type="checkbox"
                  checked={selectedConditions.includes(condition)}
                  onChange={() => {
                    setPage(1)
                    setSelectedConditions((prev) => toggleInArray(prev, condition))
                  }}
                />
                <span>{condition}</span>
              </label>
            ))}
          </div>
        </FilterGroup>
      )}

      {(filterOptions.location?.length > 0) && (
        <FilterGroup title="Location" count={selectedLocations.length} defaultOpen={false}>
          <div className="shop-check-list shop-check-list--scroll">
            {filterOptions.location.map((location) => (
              <label key={location} className="shop-check">
                <input
                  type="checkbox"
                  checked={selectedLocations.includes(location)}
                  onChange={() => {
                    setPage(1)
                    setSelectedLocations((prev) => toggleInArray(prev, location))
                  }}
                />
                <span>{displayCity(location)}</span>
              </label>
            ))}
          </div>
        </FilterGroup>
      )}
    </div>
  )

  return (
    <div className="wl-page">
      <SiteHeader />

      <main className="wl-main">
        <nav className="wl-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="wl-crumb-sep">/</span>
          {orgName ? (
            <>
              <Link to="/marketplaces">Marketplaces</Link>
              <span className="wl-crumb-sep">/</span>
              <span className="wl-crumb-current">{displayMarketplaceName(orgName)}</span>
            </>
          ) : (
            <span className="wl-crumb-current">All Auctions</span>
          )}
        </nav>

        <div className="wl-page-head">
          <div>
            <h1>{orgName ? `${displayMarketplaceName(orgName)} Lots` : 'All Live Auctions'}</h1>
            <p className="wl-sub">
              {orgName
                ? 'Live lots from this marketplace. Bid before the timer runs out.'
                : 'Every live lot across all marketplaces, in one place.'}
            </p>
          </div>
          <span className="wl-count-pill">
            <span className="wl-dot" />
            {liveLotsCount} live lots
          </span>
        </div>

        <div className="shop-toolbar">
          <form className="shop-search" onSubmit={handleSearch} role="search">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search lots by name, brand, or keyword…"
              aria-label="Search lots"
            />
            <button type="submit" className="wl-btn wl-btn-primary">Search</button>
          </form>

          <div className="shop-toolbar__right">
            <button
              type="button"
              className="wl-btn wl-btn-secondary wl-btn-sm shop-filters-toggle"
              onClick={() => setFiltersOpen(true)}
            >
              Filters{activeChips.length > 0 ? ` (${activeChips.length})` : ''}
            </button>
            <label className="shop-sort">
              <span>Sort</span>
              <select
                className="wl-select"
                value={selectedSort.label}
                onChange={(e) => {
                  const next = SORT_OPTIONS.find((item) => item.label === e.target.value) || SORT_OPTIONS[0]
                  setPage(1)
                  setSelectedSort(next)
                }}
                aria-label="Sort lots"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.label} value={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {activeChips.length > 0 && (
          <div className="wl-chips" aria-label="Active filters">
            {activeChips.map((chip) => (
              <span key={chip.key} className="wl-chip">
                {chip.label}
                <button type="button" onClick={chip.clear} aria-label={`Remove filter ${chip.label}`}>×</button>
              </span>
            ))}
            <button type="button" className="wl-chip-clear" onClick={clearFilters}>Clear all</button>
          </div>
        )}

        <div className="shop-layout">
          <aside className="shop-sidebar" aria-label="Filters">
            {filtersPanel}
          </aside>

          <section className="shop-results" aria-live="polite">
            {error && <div className="wl-notice wl-notice-error">{error}</div>}

            {loading ? (
              <div className="shop-grid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="lot-card lot-card--skeleton" aria-hidden="true">
                    <div className="wl-skeleton lot-card__media" style={{ height: 210 }} />
                    <div className="lot-card__body">
                      <div className="wl-skeleton" style={{ height: 14, width: '70%' }} />
                      <div className="wl-skeleton" style={{ height: 20, width: '100%' }} />
                      <div className="wl-skeleton" style={{ height: 34, width: '100%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 && !error ? (
              <div className="wl-empty">
                <h3>No lots match your filters</h3>
                <p>
                  Try removing a filter or two, or search with a broader keyword.
                  New lots are listed on an ongoing basis.
                </p>
                <div className="wl-empty-actions">
                  <button type="button" className="wl-btn wl-btn-primary" onClick={clearFilters}>
                    Clear all filters
                  </button>
                  <Link to="/marketplaces" className="wl-btn wl-btn-secondary">
                    Browse marketplaces
                  </Link>
                </div>
              </div>
            ) : (
              <div className="shop-grid">
                {products.map((product) => (
                  <LotCard
                    key={product.id}
                    product={product}
                    orgName={orgName}
                    formatMoney={formatMoney}
                    formatRawMoney={formatRawMoney}
                  />
                ))}
              </div>
            )}

            {!loading && meta.total_pages > 1 && (
              <nav className="wl-pagination" aria-label="Pagination">
                <button
                  type="button"
                  disabled={meta.current_page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  ‹
                </button>

                {visiblePages.map((pageItem, index) => {
                  if (pageItem === '...') {
                    return <span key={`dots-${index}`} className="wl-page-label">…</span>
                  }
                  return (
                    <button
                      type="button"
                      key={pageItem}
                      className={pageItem === meta.current_page ? 'active' : ''}
                      onClick={() => setPage(pageItem)}
                      aria-label={`Page ${pageItem}`}
                      aria-current={pageItem === meta.current_page ? 'page' : undefined}
                    >
                      {pageItem}
                    </button>
                  )
                })}

                <button
                  type="button"
                  disabled={meta.current_page >= meta.total_pages}
                  onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))}
                  aria-label="Next page"
                >
                  ›
                </button>
                <span className="wl-page-label">
                  Page {meta.current_page} of {meta.total_pages}
                </span>
              </nav>
            )}
          </section>
        </div>
      </main>

      {filtersOpen && (
        <div className="shop-drawer" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="shop-drawer__overlay" onClick={() => setFiltersOpen(false)} />
          <div className="shop-drawer__panel">
            <div className="shop-drawer__head">
              <h3>Filters</h3>
              <button type="button" className="shop-drawer__close" onClick={() => setFiltersOpen(false)} aria-label="Close filters">×</button>
            </div>
            <div className="shop-drawer__body">
              {filtersPanel}
            </div>
            <div className="shop-drawer__foot">
              <button type="button" className="wl-btn wl-btn-secondary" onClick={clearFilters}>
                Clear all
              </button>
              <button type="button" className="wl-btn wl-btn-primary" onClick={() => setFiltersOpen(false)}>
                Show {liveLotsCount} lots
              </button>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  )
}
