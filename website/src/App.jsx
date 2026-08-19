import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useParams, Link } from 'react-router-dom'
import { AdminProvider, useAdmin } from './AdminContext'
import { usePrice } from './usePrice'
import LandingPage from './LandingPage'
import MarketplacesPage from './MarketplacesPage'
import ProductDetailPage from './ProductDetailPage'
import MyAccountPage from './MyAccountPage'
import AdminOrdersDashboard from './AdminOrdersDashboard'
import { UserProvider } from './UserContext'
import Header from './Header'
import SignInModal from './SignInModal'
import './App.css'
import './Admin.css'

const SORT_OPTIONS = [
  { label: 'Sort by: Time Left', sortBy: '+end_date', selectedSortBy: 'end_date_l_h' },
  { label: 'Sort by: Recent', sortBy: '-start_date', selectedSortBy: 'recent' },
  { label: 'Price : High to Low', sortBy: '-mrp', selectedSortBy: 'mrp_h_l' },
  { label: 'Price : Low to High', sortBy: '+mrp', selectedSortBy: 'mrp_l_h' }
]

function formatTime(seconds) {
  if (!seconds || seconds <= 0) return '0 Hr 00 Min 00 Sec'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const mStr = String(m).padStart(2, '0')
  const sStr = String(s).padStart(2, '0')
  return `${h} Hr ${mStr} Min ${sStr} Sec`
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

function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAdmin()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    const success = login(username, password)
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

function AdminPanel() {
  const { priceHike, updatePriceHike, logout } = useAdmin()
  const navigate = useNavigate()

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
      <div className="admin-section">
        <h2>Price Config</h2>
        <p className="admin-desc">
          Set a percentage hike to apply to all prices received from the Bulk4Traders API.
          This will be applied everywhere on the website.
        </p>
        <div className="admin-field">
          <label htmlFor="price-hike">Price Hike Percentage</label>
          <input
            id="price-hike"
            type="number"
            min="0"
            max="100"
            value={priceHike}
            onChange={(e) => updatePriceHike(e.target.value)}
          />
          <span className="admin-unit">%</span>
        </div>
        <div className="admin-preview">
          Current hike: <strong>{priceHike}%</strong>
        </div>
      </div>
    </div>
  )
}

function ShopPage() {
  const { orgName } = useParams()
  const navigate = useNavigate()
  const { formatMoney, formatRawMoney, applyPriceHike } = usePrice()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
  const [meta, setMeta] = useState({ current_page: 1, total_pages: 1, total_count: 0 })

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
          perPage: 24,
          sort_by: selectedSort?.sortBy || '+end_date',
          ...(orgName && { organization_name: orgName })
        },
        sort: selectedSort?.sortBy || '+end_date',
        lot_type: 'Hybrid',
        sort_by: selectedSort?.sortBy || '+end_date',
        page_size: 24,
        page_number: page || 1,
        page: page || 1,
        per_page: 24,
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
          endTime: typeof p.bid_remaining_time === 'number' ? now + p.bid_remaining_time * 1000 : null
        }))
        setProducts(results)
        setMeta({
          current_page: data?.meta?.current_page || page,
          total_pages: data?.meta?.total_pages || 1,
          total_count: data?.meta?.total_count || 0
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
    orgName
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

  const displayPriceFrom = applyPriceHike(priceFrom)
  const displayPriceTo = applyPriceHike(priceTo)

  return (
    <div className="page">
      <Header />

      <div className="layout">
        <aside className="sidebar">
          <div className="filters-heading-row">
            <h3>FILTERS</h3>
            <button type="button" className="clear-btn" onClick={clearFilters}>Clear</button>
          </div>

          <section className="filter-section">
            <h4>BIDDING MODE</h4>
            <label className="check-row">
              <input type="radio" disabled /> Open
            </label>
            <label className="check-row">
              <input type="radio" checked readOnly /> Hybrid
            </label>
          </section>

          <section className="filter-section">
            <h4>PRICE RANGE</h4>
            <div className="price-values">
              <span>{displayPriceFrom.toLocaleString('en-IN')}</span>
              <span>{displayPriceTo.toLocaleString('en-IN')}</span>
            </div>
            <div className="price-sliders">
              <input
                type="range"
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
          </section>

          <section className="filter-section scrollable">
            <h4>CATEGORY</h4>
            {filterOptions.categories?.map((category) => (
              <label key={category} className="check-row">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category)}
                  onChange={() => {
                    setPage(1)
                    setSelectedCategories((prev) => toggleInArray(prev, category))
                  }}
                />
                {category}
              </label>
            ))}
          </section>

          <section className="filter-section scrollable tall">
            <h4>SUB CATEGORY</h4>
            {filterOptions.sub_categories?.map((subCategory) => (
              <label key={subCategory} className="check-row">
                <input
                  type="checkbox"
                  checked={selectedSubCategories.includes(subCategory)}
                  onChange={() => {
                    setPage(1)
                    setSelectedSubCategories((prev) => toggleInArray(prev, subCategory))
                  }}
                />
                {subCategory}
              </label>
            ))}
          </section>

          <section className="filter-section">
            <h4>CONDITION</h4>
            {filterOptions.conditions?.map((condition) => (
              <label key={condition} className="check-row">
                <input
                  type="checkbox"
                  checked={selectedConditions.includes(condition)}
                  onChange={() => {
                    setPage(1)
                    setSelectedConditions((prev) => toggleInArray(prev, condition))
                  }}
                />
                {condition}
              </label>
            ))}
          </section>

          <section className="filter-section">
            <h4>LOCATION</h4>
            {filterOptions.location?.map((location) => (
              <label key={location} className="check-row">
                <input
                  type="checkbox"
                  checked={selectedLocations.includes(location)}
                  onChange={() => {
                    setPage(1)
                    setSelectedLocations((prev) => toggleInArray(prev, location))
                  }}
                />
                {location}
              </label>
            ))}
          </section>
        </aside>

        <main className="content">
          <form className="search-row" onSubmit={handleSearch}>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search for lots"
            />
            <button type="submit">SEARCH</button>
          </form>

          <div className="sort-row">
            <p>{meta.total_count || products.length} Live Lots (Hybrid)</p>
            <select
              value={selectedSort.label}
              onChange={(e) => {
                const next = SORT_OPTIONS.find((item) => item.label === e.target.value) || SORT_OPTIONS[0]
                setPage(1)
                setSelectedSort(next)
              }}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.label} value={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {error ? <div className="error">{error}</div> : null}
          {loading ? <div className="loading">Loading products...</div> : null}

          {!loading && (
            <div className="cards-grid">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="product-card"
                  onClick={() => {
                    const detailPath = orgName ? `/${orgName}/product_detail/${product.id}` : `/product_detail/${product.id}`
                    navigate(detailPath)
                  }}
                >
                  <img src={product.org_image_url} alt="org_image_url" className="org-logo" />

                  <div className="timer">⏱ {formatTime(product.bid_remaining_time)}</div>

                  <img
                    src={product.lot_image_urls?.[0] || ''}
                    alt={product.lot_name}
                    className="lot-image"
                  />

                  <div className="meta-tags">
                    <span>📍 {product.storage_location}</span>
                    <span>{product.grade_name}</span>
                  </div>

                  <h2>{product.lot_name}</h2>

                  <div className="spec-row"><span>Quantity</span><strong>{product.items_count} items</strong></div>
                  <div className="spec-row"><span>MRP</span><strong>{formatRawMoney(product.mrp)}</strong></div>
                  <div className="spec-row"><span>Floor Price</span><strong>{formatMoney(product.floor_price)}</strong></div>

                  <div className="shipping-row">
                    <span>🚚 {product.delivery_by}</span>
                    <span>📦 Hybrid</span>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && products.length === 0 && !error ? (
            <div className="loading">No products found.</div>
          ) : null}

          <nav className="pagination" aria-label="Pagination Navigation">
            <button
              type="button"
              disabled={meta.current_page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹
            </button>

            {visiblePages.map((pageItem, index) => {
              if (pageItem === '...') {
                return <span key={`dots-${index}`} className="dots">...</span>
              }
              return (
                <button
                  type="button"
                  key={pageItem}
                  className={pageItem === meta.current_page ? 'active' : ''}
                  onClick={() => setPage(pageItem)}
                >
                  {pageItem}
                </button>
              )
            })}

            <button
              type="button"
              disabled={meta.current_page >= meta.total_pages}
              onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))}
            >
              ›
            </button>
          </nav>
        </main>
      </div>

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
          <a href="#">FAQ</a>
        </div>
        <div className="footer-links">
          <a href="#">Terms of Purchase</a>
          <a href="#">Items Condition</a>
          <a href="#">Privacy Policy</a>
        </div>
        <div className="footer-contact">
          <p>📞 1800-419-0431</p>
          <p>✉ support@wholelottraders.com</p>
        </div>
      </footer>

      <a className="whatsapp-fab" href="https://api.whatsapp.com/send?phone=+919481359961&text=Hello%21%20." target="_blank" rel="noreferrer" aria-label="Open WhatsApp">
        ☎
      </a>
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